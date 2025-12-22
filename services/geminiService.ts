
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
                // Aggiungiamo budget di pensiero per evitare errori su documenti complessi
                thinkingConfig: { thinkingBudget: 16000 },
                systemInstruction: `Sei Lia, Intelligence Ufficiale per Studi Commercialisti Italiani. 
                Il tuo compito è l'estrazione dati da Contratti di Locazione (Modello RLI, Confedilizia, ecc.).
                
                REGOLE TASSATIVE:
                1. PARTI: Identifica tutti i locatori e i conduttori (Nomi e Codici Fiscali).
                2. CATASTO: Estrai SEMPRE Foglio, Particella/Mappale, Subalterno, Categoria e Rendita. Se li trovi in tabelle, prendili tutti.
                3. FISCO: Se leggi "Cedolare Secca" -> true. Se leggi "Canone Concordato" o "Accordo Territoriale" o "L.431/98 art 2 c 3" -> isCanoneConcordato: true.
                4. DATE: Data Stipula (firma) e Data Decorrenza (inizio).
                5. ECONOMICO: Canone Annuo (totale), Deposito Cauzionale.
                6. DISDETTA: Mesi di preavviso per il recesso.
                
                OUTPUT: Solo JSON puro. Se un campo è mancante, usa "" o 0.`,
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
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Analizza questo contratto e mappa i dati fiscali/catastali." }] }]
        });
        
        const rawText = response.text || "{}";
        const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Lia Critical Failure:", e);
        throw e;
    }
};

export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any, selectedDeadline?: any): Promise<{html: string, subject: string}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = type === 'MAIL_ADVISORY' 
            ? `Scrivi email per ${subjectName} per scadenza ${selectedDeadline?.type} il ${selectedDeadline?.date}. Studio: ${studioSettings.name}.`
            : `Genera report HTML professionale per ${subjectName}.`;

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
            systemInstruction: "Sei Lia. Consulente esperta. Rispondi citando normative italiane (L.431/98)." 
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
            contents: `Analizza anomalie in: ${JSON.stringify(contracts)}.`,
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
