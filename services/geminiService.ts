
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

/**
 * Estrae i dati con focus ossessivo su Destinazione d'Uso e Canone Concordato.
 * Localizzazione 100% Italiana.
 */
export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: {
                systemInstruction: `Agisci come un Analista Legale esperto in locazioni italiane. 
                Estrai i dati e restituisci SOLO un JSON conforme allo schema.
                
                REGOLE TASSATIVE PER L'ESTRAZIONE:
                1. DESTINAZIONE D'USO (usageType): Cerca clausole come "uso abitativo", "uso ufficio", "categoria catastale". 
                   Se NON trovi l'uso esplicitamente, scrivi esattamente: "CARENZA DOCUMENTALE: Destinazione d'uso non rilevata".
                2. CANONE CONCORDATO (isCanoneConcordato): Imposta a true se cita "Accordo Territoriale" o "Legge 431/98 art 2 c.3".
                3. LINGUA: Rispondi esclusivamente in ITALIANO tecnico.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        owners: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        tenants: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, taxCode: { type: Type.STRING } } } },
                        propertyAddress: { type: Type.STRING },
                        usageType: { type: Type.STRING },
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
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Analizza il contratto e rileva l'uso dell'immobile." }] }]
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Errore IA:", e);
        return {};
    }
};

/**
 * Intelligence Strategica Portfolio: Filtra suggerimenti inutili.
 */
export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const data = contracts.map(c => ({
            addr: c.propertyAddress,
            uso: c.usageType,
            rent: c.annualRent,
            concordato: c.isCanoneConcordato
        }));

        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza questo portfolio. Fornisci 3 intuizioni in ITALIANO.
            REGOLE:
            1. Se usageType contiene 'CARENZA', segnala il rischio di nullità.
            2. Se concordato = true, non suggerirlo di nuovo.
            3. Suggerisci ottimizzazioni fiscali solo se necessarie.`,
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
            systemInstruction: `Sei un consulente legale senior esperto in locazioni. Rispondi sempre in ITALIANO. 
            Se l'uso dell'immobile è marcato come 'CARENZA' nel contratto selezionato, avvisa l'utente della nullità potenziale.` 
        }
    });
    return response.text || "";
};

export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any) => {
    return `<h1>Report Fiscale Generato</h1><p>Dati in elaborazione per ${subjectName}.</p>`;
};
