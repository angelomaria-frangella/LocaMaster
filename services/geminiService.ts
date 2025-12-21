
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: {
                systemInstruction: `Agisci come Lia, l'AI di Studio Commercialista specializzata in RLI. 
                Focus assoluto su DATE di decorrenza, stipula e termini di disdetta. 
                Restituisci SOLO JSON.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        owners: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING }, address: { type: Type.STRING } } } },
                        tenants: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING }, address: { type: Type.STRING } } } },
                        propertyAddress: { type: Type.STRING },
                        usageType: { type: Type.STRING },
                        annualRent: { type: Type.NUMBER },
                        deposit: { type: Type.NUMBER },
                        isCanoneConcordato: { type: Type.BOOLEAN },
                        cedolareSecca: { type: Type.BOOLEAN },
                        contractType: { type: Type.STRING },
                        startDate: { type: Type.STRING },
                        stipulationDate: { type: Type.STRING },
                        cadastral: { type: Type.OBJECT, properties: { foglio: { type: Type.STRING }, particella: { type: Type.STRING }, subalterno: { type: Type.STRING }, categoria: { type: Type.STRING }, rendita: { type: Type.NUMBER } } }
                    },
                    required: ["owners", "tenants", "startDate", "stipulationDate"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Esegui analisi tecnica fiscale." }] }]
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Errore IA Studio:", e);
        return {};
    }
};

export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    if (!contracts || contracts.length === 0) return [];
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza questo portfolio per conto dello Studio Commercialista: ${JSON.stringify(contracts)}. Segnala scadenze imminenti e ottimizzazioni fiscali.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["category", "text"] }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) { return []; }
};

export const analyzeLeaseStrategy = async (userMsg: string, contracts: Contract[], focusedContract: Contract | null, history: any[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: [...history.map(m => ({role: m.role === 'ai' ? 'model' : 'user', parts: [{text: m.content}]})), {role: 'user', parts: [{text: userMsg}]}],
        config: { 
            systemInstruction: `Sei Lia, assistente senior di Studio Commercialista. 
            Le DATE sono il tuo chiodo fisso. Non dare mai consigli senza aver verificato stipula e decorrenza.
            Usa un tono professionale, asciutto e autorevole.` 
        }
    });
    return response.text || "";
};

/**
 * GENERATORE REPORT FISCALE REALE
 */
export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_PRO,
            contents: `Genera un report fiscale HTML dettagliato per il cliente "${subjectName}". Dati: ${JSON.stringify(contracts)}. 
            Lo studio è: ${JSON.stringify(studioSettings)}. 
            Includi tabelle per scadenze, imposte dovute e analisi cedolare secca. Usa Tailwind CSS inline se necessario.`
        });
        return response.text || "Impossibile generare il report.";
    } catch (e) {
        return "Errore durante la generazione del report IA.";
    }
};
