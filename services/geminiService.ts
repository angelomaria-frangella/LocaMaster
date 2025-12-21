
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
                systemInstruction: `Agisci come Lia, l'AI senior di uno Studio Commercialista italiano. 
                Sei un'esperta assoluta in RLI e contrattualistica. Devi estrarre TUTTI i dati con precisione chirurgica.
                FOCUS CRITICO:
                1. PARTI: Estrai tutti i Locatori e Conduttori con Nome, Codice Fiscale e Indirizzo.
                2. IMMOBILE: Indirizzo completo e DATI CATASTALI (Foglio, Particella, Subalterno).
                3. FISCO: Verifica se è 'Canone Concordato' (L. 431/98 art. 2 c. 3) e se c'è l'opzione 'Cedolare Secca'.
                4. ECONOMICO: Canone annuo e Deposito cauzionale.
                5. TEMPI: Data stipula, Data decorrenza e i MESI DI PREAVVISO per la disdetta (cerca clausole come '6 mesi', '3 mesi').
                Restituisci SOLO JSON puro.`,
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
                                categoria: { type: Type.STRING }
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
                    required: ["startDate", "owners", "tenants", "propertyAddress"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Esegui analisi tecnica del contratto per Studio Commercialista." }] }]
        });
        
        let text = response.text || "{}";
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("Lia Critical Extraction Error:", e);
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
               Contenuto: Spiega l'adempimento, i termini legali e cosa deve fare il cliente. 
               Restituisci JSON con chiavi "subject" e "body" (HTML).`
            : `Genera un report fiscale HTML professionale per ${subjectName}. Contratti: ${JSON.stringify(contracts)}. 
               Includi analisi scadenze, calcoli imposte e proiezioni fiscali. Usa Tailwind CSS inline.`;

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

export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    if (!contracts || contracts.length === 0) return [];
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza strategicamente questo portfolio di locazioni: ${JSON.stringify(contracts)}. 
            Identifica rischi di morosità, scadenze disdetta critiche e opportunità di risparmio fiscale.`,
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
            systemInstruction: `Sei Lia, assistente d'intelligence senior di uno Studio Commercialista. 
            Conosci perfettamente la L. 431/98 e la L. 392/78. 
            Le tue risposte devono essere tecnicamente ineccepibili, basate su DATE certe e calcoli fiscali esatti. 
            Se ti chiedono una bozza di lettera, scrivila in modo formale e legale.` 
        }
    });
    return response.text || "";
};
