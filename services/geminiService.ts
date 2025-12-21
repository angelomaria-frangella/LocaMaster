
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
                systemInstruction: `Agisci come Lia, l'AI senior di Studio Commercialista. 
                Il tuo compito è estrarre date e dati fiscali da contratti RLI.
                Focus: Decorrenza, Stipula, Canone, Cedolare.
                REGOLE: Restituisci SOLO un oggetto JSON. Se un dato è incerto, usa null. 
                NON aggiungere testo prima o dopo il JSON.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        owners: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        tenants: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        propertyAddress: { type: Type.STRING },
                        annualRent: { type: Type.NUMBER },
                        contractType: { type: Type.STRING },
                        startDate: { type: Type.STRING },
                        stipulationDate: { type: Type.STRING },
                        cedolareSecca: { type: Type.BOOLEAN },
                        isCanoneConcordato: { type: Type.BOOLEAN },
                        noticeMonthsOwner: { type: Type.NUMBER },
                        noticeMonthsTenant: { type: Type.NUMBER }
                    },
                    required: ["startDate"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Estrai parametri contrattuali." }] }]
        });
        
        let text = response.text || "{}";
        // Pulizia forzata per evitare errori di parsing
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("Lia Estrazione Error:", e);
        return {};
    }
};

export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any, selectedDeadline?: any): Promise<{html: string, subject: string}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = type === 'MAIL_ADVISORY' 
            ? `Genera un'email professionale per lo studio ${studioSettings?.name || 'Commercialista'}. 
               Cliente: ${subjectName}. Scadenza: ${selectedDeadline?.type}. Data: ${selectedDeadline?.date}. 
               Immobile: ${selectedDeadline?.contractAddress}.
               Scrivi un oggetto efficace e un corpo HTML formattato. Restituisci JSON con chiavi "subject" e "body".`
            : `Genera un report fiscale HTML professionale per ${subjectName}. Contratti: ${JSON.stringify(contracts)}. 
               Focus su scadenze RLI e termini disdetta. Usa Tailwind CSS inline.`;

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
        return { html: response.text || "", subject: `Report Studio - ${subjectName}` };
    } catch (e) {
        return { html: "Errore generazione report.", subject: "Errore" };
    }
};

export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    if (!contracts || contracts.length === 0) return [];
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza portfolio: ${JSON.stringify(contracts)}. Segnala scadenze disdetta entro 6 mesi.`,
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

export const analyzeLeaseStrategy = async (userMsg: string, contracts: Contract[], focusedContract: Contract | null, history: any[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: [...history.map(m => ({role: m.role === 'ai' ? 'model' : 'user', parts: [{text: m.content}]})), {role: 'user', parts: [{text: userMsg}]}],
        config: { 
            systemInstruction: `Sei Lia. Le DATE sono la tua vita. Se non hai date certe, segnalalo. 
            Fornisci calcoli esatti e bozze di lettere legali.` 
        }
    });
    return response.text || "";
};
