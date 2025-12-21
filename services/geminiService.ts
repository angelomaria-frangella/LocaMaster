
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

/**
 * DEEP SCAN FISCALE: Estrazione dati per anagrafiche tributarie.
 * Persona: Esperto di Studio Commercialista.
 */
export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: {
                systemInstruction: `Agisci come un Esperto di Studio Commercialista specializzato in Pratiche RLI. 
                Estrai i dati e restituisci SOLO un JSON conforme allo schema.
                
                REGOLE TASSATIVE DI STUDIO:
                1. DURATA: Se rilevi "Canone Concordato" o riferimenti alla L. 431/98 art. 2 comma 3, imposta contractType a "Abitativo Concordato (3+2)". 
                   NON assegnare mai 4+4 se il canone è concordato.
                2. ANAGRAFICA: Estrai con precisione Nome/Ragione Sociale, Codice Fiscale e RESIDENZA o SEDE LEGALE delle parti.
                3. CATASTALE: Estrai Foglio, Particella, Subalterno e Categoria.
                4. FISCALE: Identifica se è presente l'opzione per la Cedolare Secca.
                5. LINGUA: Solo ITALIANO tecnico-tributario.`,
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
                              address: { type: Type.STRING, description: "Residenza o Sede Legale" }
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
                              address: { type: Type.STRING, description: "Residenza o Sede Legale" }
                            } 
                          } 
                        },
                        propertyAddress: { type: Type.STRING },
                        usageType: { type: Type.STRING },
                        annualRent: { type: Type.NUMBER },
                        deposit: { type: Type.NUMBER },
                        isCanoneConcordato: { type: Type.BOOLEAN },
                        cedolareSecca: { type: Type.BOOLEAN },
                        contractType: { type: Type.STRING },
                        startDate: { type: Type.STRING },
                        cadastral: {
                            type: Type.OBJECT,
                            properties: { foglio: { type: Type.STRING }, particella: { type: Type.STRING }, subalterno: { type: Type.STRING }, categoria: { type: Type.STRING }, rendita: { type: Type.NUMBER } }
                        },
                        registration: {
                            type: Type.OBJECT,
                            properties: { date: { type: Type.STRING }, office: { type: Type.STRING }, series: { type: Type.STRING }, number: { type: Type.STRING } }
                        }
                    },
                    required: ["annualRent", "owners", "tenants"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Esegui analisi tecnica per adempimenti fiscali RLI." }] }]
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Errore IA Studio:", e);
        return {};
    }
};

/**
 * INTELLIGENCE STUDIO: Rileva anomalie tributarie e opportunità di risparmio fiscale.
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
            tipo: c.contractType
        }));

        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza il portfolio clienti dello studio. Fornisci 3 alert fiscali in ITALIANO.
            FOCUS: 
            - Incoerenze tra Tipo Contratto e Canone (es. Concordato con durata errata).
            - Mancanza di Cedolare Secca dove conveniente.
            - Scadenze imminenti di annualità successive.`,
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
            systemInstruction: `Sei TITAN Intelligence, consulente tributario esperto in immobili. Rispondi in ITALIANO. 
            Il tuo utente è un Commercialista. Usa un linguaggio tecnico preciso (IMU, Cedolare Secca, Aliquote, RLI). 
            Se rilevi che un contratto Concordato è stato salvato come 4+4, segnalalo immediatamente come ERRORE NORMATIVO.` 
        }
    });
    return response.text || "";
};

export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any) => {
    return `<h1>Report Fiscale TITAN Studio</h1><p>Analisi tributaria asset per ${subjectName}.</p>`;
};
