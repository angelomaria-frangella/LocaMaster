
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

/**
 * DEEP SCAN: Estrae ogni singolo metadato fiscale, catastale e anagrafico.
 * Implementa logica di allerta per dati mancanti.
 */
export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: {
                systemInstruction: `Agisci come un Analista Legale e Fiscale Senior. 
                Estrai ogni dato e restituisci SOLO un JSON conforme allo schema.
                
                REGOLE TASSATIVE:
                1. USAGE (usageType): Fondamentale. Se assente scrivi "CARENZA DOCUMENTALE".
                2. FISCALE: Cerca estremi registrazione (Serie, Numero, Ufficio).
                3. CATASTALE: Estrai Foglio, Particella, Subalterno.
                4. PARTI: Identifica tutti i locatori e conduttori con i loro Codici Fiscali.
                5. LINGUA: Solo ITALIANO tecnico professionale.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        owners: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        tenants: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        propertyAddress: { type: Type.STRING },
                        usageType: { type: Type.STRING },
                        annualRent: { type: Type.NUMBER },
                        deposit: { type: Type.NUMBER },
                        isCanoneConcordato: { type: Type.BOOLEAN },
                        cedolareSecca: { type: Type.BOOLEAN },
                        startDate: { type: Type.STRING },
                        stipulationDate: { type: Type.STRING },
                        cadastral: {
                            type: Type.OBJECT,
                            properties: { foglio: { type: Type.STRING }, particella: { type: Type.STRING }, subalterno: { type: Type.STRING }, categoria: { type: Type.STRING }, rendita: { type: Type.NUMBER } }
                        },
                        registration: {
                            type: Type.OBJECT,
                            properties: { date: { type: Type.STRING }, office: { type: Type.STRING }, series: { type: Type.STRING }, number: { type: Type.STRING } }
                        }
                    },
                    required: ["usageType", "annualRent", "owners", "tenants"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Esegui deep scan forense di questo contratto di locazione." }] }]
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Errore IA:", e);
        return {};
    }
};

/**
 * INTELLIGENCE PORTFOLIO: Rileva rischi di nullità e ottimizzazioni fiscali.
 */
export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const data = contracts.map(c => ({
            id: c.id,
            addr: c.propertyAddress,
            uso: c.usageType,
            rent: c.annualRent,
            concordato: c.isCanoneConcordato,
            cedolare: c.cedolareSecca,
            catastale: c.cadastral
        }));

        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza questo portfolio asset. Fornisci 3 intuizioni critiche in ITALIANO.
            FOCUS: 
            - Segnala Rischio di Nullità se manca l'uso o i dati catastali.
            - Segnala Mancata Ottimizzazione se c'è canone concordato ma non cedolare al 10%.
            - Segnala Rendimento basso rispetto alla media di mercato se possibile.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            text: { type: Type.STRING }
                        },
                        required: ["category", "text"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
};

export const analyzeLeaseStrategy = async (userMsg: string, contracts: Contract[], focusedContract: Contract | null, history: any[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: [...history.map(m => ({role: m.role === 'ai' ? 'model' : 'user', parts: [{text: m.content}]})), {role: 'user', parts: [{text: userMsg}]}],
        config: { 
            systemInstruction: `Sei TITAN Intelligence, consulente legale senior. Rispondi in ITALIANO. 
            Analizza i dati catastali e fiscali forniti. Se rilevi omissioni nei campi 'registrazione' o 'cadastral', inizia la risposta con un avviso di 'INTEGRITÀ ASSET COMPROMESSA'.` 
        }
    });
    return response.text || "";
};

export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any) => {
    return `<h1>Report Fiscale TITAN</h1><p>Analisi asset per ${subjectName}.</p>`;
};
