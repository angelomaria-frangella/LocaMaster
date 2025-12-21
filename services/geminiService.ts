
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_PRO,
            config: {
                systemInstruction: `Sei Lia, l'AI esperta di legislazione immobiliare italiana (RLI, L.431/98).
                DEVI ESTRARRE CHIRURGICAMENTE:
                1. PARTI: Locatori (proprietari) e Conduttori (inquilini) con Nome e Codice Fiscale.
                2. IMMOBILE: Indirizzo e DATI CATASTALI (Foglio, Particella/Mappale, Subalterno). Cerca i numeri nelle tabelle.
                3. ECONOMICO: Canone Annuo, Deposito Cauzionale.
                4. FISCO: Se presente "Cedolare Secca" o "Canone Concordato" (Accordi Territoriali).
                5. DATE: Stipula (firma) e Decorrenza (inizio).
                6. DISDETTA: Mesi di preavviso per recesso (solitamente 6).
                
                REGOLE DI OUTPUT:
                - Restituisci SOLO un oggetto JSON.
                - NESSUN testo prima o dopo.
                - Se un dato non c'è, usa stringa vuota o zero.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        owners: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        tenants: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        propertyAddress: { type: Type.STRING },
                        cadastral: {
                            type: Type.OBJECT,
                            properties: {
                                foglio: { type: Type.STRING },
                                particella: { type: Type.STRING },
                                subalterno: { type: Type.STRING },
                                categoria: { type: Type.STRING },
                                rendita: { type: Type.NUMBER }
                            }
                        },
                        annualRent: { type: Type.NUMBER },
                        deposit: { type: Type.NUMBER },
                        contractType: { type: Type.STRING },
                        startDate: { type: Type.STRING },
                        stipulationDate: { type: Type.STRING },
                        cedolareSecca: { type: Type.BOOLEAN },
                        isCanoneConcordato: { type: Type.BOOLEAN },
                        noticeMonthsOwner: { type: Type.NUMBER },
                        noticeMonthsTenant: { type: Type.NUMBER }
                    },
                    required: ["propertyAddress", "startDate"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Analizza questo contratto e compila il database fiscale." }] }]
        });
        
        let rawText = response.text || "{}";
        // Pulisci eventuale sporcizia nel testo se il modello non rispetta il mimeType
        const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Lia Critical Failure:", e);
        return {};
    }
};

export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any, selectedDeadline?: any): Promise<{html: string, subject: string}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = type === 'MAIL_ADVISORY' 
            ? `Scrivi un'email per lo studio ${studioSettings.name} rivolta a ${subjectName}. Scadenza ${selectedDeadline?.type} il ${selectedDeadline?.date}. Oggetto: Avviso Scadenza.`
            : `Genera un report HTML per ${subjectName}. Portfolio: ${JSON.stringify(contracts)}.`;

        const response = await ai.models.generateContent({
            model: MODEL_PRO,
            contents: prompt,
            config: { 
                responseMimeType: type === 'MAIL_ADVISORY' ? "application/json" : "text/plain"
            }
        });

        if (type === 'MAIL_ADVISORY') {
            const data = JSON.parse(response.text?.replace(/```json/g, "").replace(/```/g, "").trim() || "{}");
            return { html: data.body || "", subject: data.subject || "Avviso Scadenza" };
        }
        return { html: response.text || "", subject: `Report - ${subjectName}` };
    } catch (e) {
        return { html: "Errore.", subject: "Errore" };
    }
};

export const analyzeLeaseStrategy = async (userMsg: string, contracts: Contract[], focusedContract: Contract | null, history: any[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: [...history.map(m => ({role: m.role === 'ai' ? 'model' : 'user', parts: [{text: m.content}]})), {role: 'user', parts: [{text: userMsg}]}],
        config: { 
            systemInstruction: "Sei Lia. Consulente legale e fiscale senior. Rispondi con precisione e riferimenti normativi." 
        }
    });
    return response.text || "";
};

export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    if (!contracts || contracts.length === 0) return [];
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza questi contratti: ${JSON.stringify(contracts)}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, text: { type: Type.STRING } } }
                }
            }
        });
        return JSON.parse(response.text?.replace(/```json/g, "").replace(/```/g, "").trim() || "[]");
    } catch (e) { return []; }
};
