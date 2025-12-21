
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

/**
 * DEEP SCAN TRIBUTARIO - PROTOCOLLO STUDIO COMMERCIALISTA
 * Focalizzato su date di stipula, decorrenza e anagrafiche complete.
 */
export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: {
                systemInstruction: `Agisci come un Esperto Senior di Studio Commercialista specializzato in Modelli RLI e Gestione Clienti. 
                Estrai i dati e restituisci SOLO un JSON conforme allo schema.
                
                PROTOCOLLO RIGIDO DI ANALISI:
                1. DATE: Cerca 'Data di stipula/firma' e 'Data di decorrenza/inizio' in tutto il testo. Se scritte in lettere, converti in ISO YYYY-MM-DD.
                2. SOGGETTI: Estrai con precisione Nome/Cognome/Ragione Sociale e Codice Fiscale per TUTTI i locatori e conduttori.
                3. DURATA: Se rilevi "Canone Concordato" o "L.431/98 art.2 c.3", forza contractType a "Abitativo Concordato (3+2)".
                4. CATASTALE: Estrai Foglio, Particella, Subalterno.
                5. LINGUA: Solo ITALIANO tecnico-fiscale.`,
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
                        usageType: { type: Type.STRING },
                        annualRent: { type: Type.NUMBER },
                        deposit: { type: Type.NUMBER },
                        isCanoneConcordato: { type: Type.BOOLEAN },
                        cedolareSecca: { type: Type.BOOLEAN },
                        contractType: { type: Type.STRING },
                        startDate: { type: Type.STRING, description: "Data di decorrenza/inizio (YYYY-MM-DD)" },
                        stipulationDate: { type: Type.STRING, description: "Data di firma/stipula (YYYY-MM-DD)" },
                        cadastral: {
                            type: Type.OBJECT,
                            properties: { foglio: { type: Type.STRING }, particella: { type: Type.STRING }, subalterno: { type: Type.STRING }, categoria: { type: Type.STRING }, rendita: { type: Type.NUMBER } }
                        }
                    },
                    required: ["owners", "tenants", "startDate", "stipulationDate"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Esegui analisi tecnica per registrazione modello RLI." }] }]
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Errore IA Studio:", e);
        return {};
    }
};

/**
 * GROUNDED INSIGHTS - PREVENZIONE ALLUCINAZIONI
 */
export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    if (!contracts || contracts.length === 0) return [];
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const context = contracts.map(c => ({
            id: c.id,
            cliente: c.clientSide === 'LOCATORE' ? c.ownerName : c.tenantName,
            addr: c.propertyAddress,
            tipo: c.contractType,
            canone: c.annualRent,
            cedolare: c.cedolareSecca
        }));

        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza questo portfolio di contratti per conto dello Studio Commercialista: ${JSON.stringify(context)}.
            Riferisciti sempre agli interessi dei CLIENTE ASSISTITI elencati.
            NON INVENTARE contratti.
            Segnala se un cliente (Locatore) non ha attiva la cedolare secca e potrebbe risparmiare.`,
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
            systemInstruction: `Sei LocaMaster Intelligence, assistente tributario Senior per Studi Commercialisti. 
            Il tuo obiettivo è proteggere gli interessi del CLIENTE ASSISTITO (il Locatore o Conduttore a seconda della pratica).
            Usa termini come RLI, F24, Cedolare, IMU. 
            Identifica sempre il cliente per Nome e Cognome.` 
        }
    });
    return response.text || "";
};

export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any) => {
    return `<h1>Report Fiscale LocaMaster AI</h1><p>Documento ufficiale per il cliente: <strong>${subjectName}</strong>.</p>`;
};
