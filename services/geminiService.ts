
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
                systemInstruction: `Agisci come Lia, l'AI senior di uno Studio Commercialista italiano esperta in RLI e contrattualistica.
                Il tuo compito è l'estrazione TECNICA e FISCALE chirurgica. 
                REGOLE TASSATIVE:
                1. PARTI: Estrai TUTTI i Locatori e TUTTI i Conduttori con Nome, Codice Fiscale e Indirizzo.
                2. IMMOBILE: Estrai Indirizzo e IDENTIFICATIVI CATASTALI (Foglio, Particella/Mappale, Subalterno, Categoria).
                3. CANONE CONCORDATO: Verifica se il contratto cita la L. 431/98 art. 2 c. 3 o accordi territoriali. Se sì, isCanoneConcordato deve essere TRUE.
                4. FISCO: Identifica Cedolare Secca e imposte di registro.
                5. DATE: Estrai Stipula e Decorrenza (Inizio).
                6. PREAVVISO: Cerca i mesi di preavviso per la disdetta (solitamente 6, ma verifica se 3 o altro).
                Restituisci esclusivamente un JSON puro.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        owners: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    name: { type: Type.STRING }, 
                                    taxCode: { type: Type.STRING },
                                    address: { type: Type.STRING }
                                } 
                            } 
                        },
                        tenants: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    name: { type: Type.STRING }, 
                                    taxCode: { type: Type.STRING },
                                    address: { type: Type.STRING }
                                } 
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
                        noticeMonthsTenant: { type: Type.NUMBER },
                        usageType: { type: Type.STRING }
                    },
                    required: ["startDate", "propertyAddress"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Analisi tecnica contratto per fini fiscali e registrazione RLI." }] }]
        });
        
        let text = response.text || "{}";
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("Lia Extraction Error:", e);
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
               Usa un tono autorevole. Restituisci JSON con "subject" e "body" (HTML).`
            : `Genera report HTML professionale. Contratti: ${JSON.stringify(contracts)}. Usa Tailwind CSS inline. Includi dettagli catastali e fiscali.`;

        const response = await ai.models.generateContent({
            model: MODEL_PRO,
            contents: prompt,
            config: { 
                responseMimeType: type === 'MAIL_ADVISORY' ? "application/json" : "text/plain"
            }
        });

        if (type === 'MAIL_ADVISORY') {
            const data = JSON.parse(response.text?.replace(/```json/g, "").replace(/```/g, "").trim() || "{}");
            return { html: data.body || "", subject: data.subject || "Avviso Scadenza Studio" };
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
            systemInstruction: `Sei Lia. Esperta di L. 431/98 e L. 392/78. 
            Rispondi come un consulente senior dello studio commercialista. 
            Analizza scadenze, dati catastali e calcoli fiscali con precisione assoluta.` 
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
            contents: `Analizza portfolio: ${JSON.stringify(contracts)}. Identifica rischi di morosità, scadenze disdetta e opportunità fiscali (es. passaggio a concordato).`,
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
