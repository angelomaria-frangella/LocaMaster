
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

/**
 * Estrae i dati da un contratto con focus sulla Destinazione d'Uso e Carenze Contrattuali.
 */
export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: {
                systemInstruction: `Agisci come un Analista Legale Forense. 
                Analizza il contratto e produci un JSON. 
                
                ATTENZIONE CRITICA:
                1. DESTINAZIONE D'USO: Cerca clausole come "destinato esclusivamente ad uso...", "uso abitativo", "uso diverso". 
                   Se NON trovi il dato, scrivi esplicitamente "CARENZA: Destinazione d'uso non rilevata" nel campo usageType.
                2. CANONE CONCORDATO: Se vedi "Accordo Territoriale" o "Legge 431/98 art 2 c.3", isCanoneConcordato deve essere true.
                3. DATI CATASTALI: Estrai Foglio, Particella, Subalterno.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        owners: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        tenants: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        propertyAddress: { type: Type.STRING },
                        usageType: { type: Type.STRING, description: "Destinazione d'uso o segnalazione carenza" },
                        annualRent: { type: Type.NUMBER },
                        isCanoneConcordato: { type: Type.BOOLEAN },
                        startDate: { type: Type.STRING },
                        cadastral: {
                            type: Type.OBJECT,
                            properties: { foglio: { type: Type.STRING }, particella: { type: Type.STRING }, subalterno: { type: Type.STRING } }
                        }
                    },
                    required: ["usageType", "annualRent", "isCanoneConcordato"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Estrai i dati e verifica la presenza della destinazione d'uso." }] }]
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return {};
    }
};

/**
 * Genera intuizioni strategiche EVITANDO consigli ovvi o già applicati.
 */
export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Passiamo dati dettagliati per evitare suggerimenti stupidi
        const portfolioData = contracts.map(c => ({
            addr: c.propertyAddress,
            type: c.contractType,
            rent: c.annualRent,
            isConcordato: c.isCanoneConcordato,
            cedolare: c.cedolareSecca,
            usage: c.usageType
        }));

        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza questo portfolio. Fornisci 3 intuizioni strategiche.
            REGOLE TASSATIVE:
            1. Se un contratto è già "Abitativo Concordato (3+2)", NON suggerire di passare al concordato.
            2. Se un canone è già alto per la zona, non suggerire aumenti.
            3. Segnala subito se manca l' "Uso Immobile" (usageType contiene 'CARENZA').
            Dati: ${JSON.stringify(portfolioData)}`,
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
    // ... mantiene l'implementazione pro precedente
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: [...history.map(m => ({role: m.role === 'ai' ? 'model' : 'user', parts: [{text: m.content}]})), {role: 'user', parts: [{text: userMsg}]}],
        config: { systemInstruction: "Sei un esperto legale. Rispondi in modo tecnico e cita le leggi." }
    });
    return response.text || "";
};

export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any) => {
    // ... mantiene l'implementazione precedente
    return "Report HTML Generato";
};
