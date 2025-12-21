
import { GoogleGenAI, Type } from "@google/genai";
import { Contract, ContractType } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_PRO,
            config: {
                systemInstruction: `Agisci come Lia, l'AI Senior di uno Studio Commercialista italiano esperta in contratti di locazione (RLI, L.431/98).
                
                PROTOCOLLO DI ESTRAZIONE TASSATIVO:
                1. PARTI: Estrai TUTTI i Locatori (Proprietari) e Conduttori (Inquilini). Per ognuno: Nome/Ragione Sociale e Codice Fiscale.
                2. IMMOBILE: Indirizzo completo e DATI CATASTALI IDENTIFICATIVI (Foglio, Particella/Mappale, Subalterno, Categoria, Rendita).
                3. CANONE CONCORDATO: Se il testo cita "Accordo Territoriale del Comune di...", "L. 431/98 art. 2 comma 3", o "3+2 anni", imposta isCanoneConcordato: true.
                4. FISCO: Cerca "Cedolare Secca". Se citata come opzione esercitata, cedolareSecca: true.
                5. ECONOMICO: Canone Annuo (somma delle rate), Deposito Cauzionale.
                6. DISDETTA: Trova i mesi di preavviso per il recesso (es. "6 mesi", "3 mesi").
                
                Restituisci esclusivamente un oggetto JSON pulito.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        owners: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } 
                            } 
                        },
                        tenants: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } 
                            } 
                        },
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
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Esegui analisi catastale e fiscale integrale." }] }]
        });
        
        const rawText = response.text || "{}";
        const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Lia Extraction Critical Error:", e);
        return {};
    }
};

export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any, selectedDeadline?: any): Promise<{html: string, subject: string}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = type === 'MAIL_ADVISORY' 
            ? `Genera email formale di avviso scadenza per ${subjectName}. Studio: ${studioSettings.name}. Scadenza: ${selectedDeadline?.type} al ${selectedDeadline?.date}. Immobile: ${selectedDeadline?.contractAddress}.`
            : `Genera report fiscale HTML per ${subjectName}. Portfolio: ${JSON.stringify(contracts)}. Usa stile professionale Tailwind.`;

        const response = await ai.models.generateContent({
            model: MODEL_PRO,
            contents: prompt,
            config: { 
                responseMimeType: type === 'MAIL_ADVISORY' ? "application/json" : "text/plain"
            }
        });

        if (type === 'MAIL_ADVISORY') {
            const data = JSON.parse(response.text?.replace(/```json/g, "").replace(/```/g, "").trim() || "{}");
            return { html: data.body || "", subject: data.subject || "Avviso Scadenza Locazione" };
        }
        return { html: response.text || "", subject: `Report Fiscale - ${subjectName}` };
    } catch (e) {
        return { html: "Errore generazione report.", subject: "Errore" };
    }
};

export const analyzeLeaseStrategy = async (userMsg: string, contracts: Contract[], focusedContract: Contract | null, history: any[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: [...history.map(m => ({role: m.role === 'ai' ? 'model' : 'user', parts: [{text: m.content}]})), {role: 'user', parts: [{text: userMsg}]}],
        config: { 
            systemInstruction: "Sei Lia. Consulente senior immobiliare. Rispondi citando se necessario L. 431/98 e DPR 131/86." 
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
            contents: `Analizza anomalie e opportunità in questi contratti: ${JSON.stringify(contracts)}.`,
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
