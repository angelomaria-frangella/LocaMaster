
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

/**
 * Estrae i dati da un contratto caricato (PDF o immagine) usando Gemini 3 Flash.
 */
export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: {
                systemInstruction: `Agisci come un Analista Legale e Fiscale esperto in locazioni italiane. 
                Analizza il documento e produci un JSON che rispetti rigorosamente questi criteri:
                
                1. CANONE CONCORDATO: Cerca riferimenti alla "Legge 431/98 art. 2 comma 3", "Accordo Territoriale", "3+2". Se presenti, isCanoneConcordato DEVE essere true.
                2. DATI CATASTALI: Estrai Foglio, Particella, Subalterno, Categoria e Rendita.
                3. REGISTRAZIONE: Cerca timbri o clausole di registrazione. Estrai Data, Ufficio, Serie e Numero.
                4. ECONOMICO: Estrai Canone Annuo, Deposito Cauzionale e Spese accessorie/condominiali.
                5. ANAGRAFICA: Per ogni parte estrai Nome, Codice Fiscale e Indirizzo.
                
                Rispondi SOLO in formato JSON.`,
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
                        expenses: { type: Type.STRING },
                        startDate: { type: Type.STRING },
                        cedolareSecca: { type: Type.BOOLEAN },
                        isCanoneConcordato: { type: Type.BOOLEAN },
                        registration: {
                            type: Type.OBJECT,
                            properties: {
                                date: { type: Type.STRING },
                                office: { type: Type.STRING },
                                series: { type: Type.STRING },
                                number: { type: Type.STRING }
                            }
                        }
                    },
                    required: ["owners", "tenants", "propertyAddress", "annualRent", "startDate", "isCanoneConcordato"]
                }
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Estrai tutti i dati, inclusi catastali, registrazione, deposito e spese." }] }]
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Data extraction error:", e);
        return {};
    }
};

/**
 * Analizza la strategia di locazione o risponde a domande specifiche usando Gemini 3 Pro.
 */
export const analyzeLeaseStrategy = async (userMsg: string, contracts: Contract[], focusedContract: Contract | null, history: any[]): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const systemInstruction = `Sei un consulente legale e fiscale esperto in locazioni immobiliari italiane.
        Contesto: Hai accesso a ${contracts.length} contratti gestiti.
        ${focusedContract ? `FOCUS ATTIVO sul contratto in ${focusedContract.propertyAddress}. Tipo: ${focusedContract.contractType}, Canone: ${focusedContract.annualRent}€.` : ''}
        
        Usa i dati forniti per rispondere a domande su:
        1. Calcolo adeguamento ISTAT.
        2. Scadenza annualità e imposte di registro.
        3. Redazione di lettere di sollecito o disdetta.
        4. Strategie fiscali (Cedolare Secca vs Ordinario).
        
        Sii professionale, preciso e cita le leggi italiane quando pertinente.`;

        const contents = history.map(m => ({
            role: m.role === 'ai' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
        contents.push({ role: 'user', parts: [{ text: userMsg }] });

        const response = await ai.models.generateContent({
            model: MODEL_PRO,
            contents,
            config: { systemInstruction }
        });

        return response.text || "";
    } catch (e) {
        console.error("AI Strategy error:", e);
        return "Mi scuso, si è verificato un errore durante l'elaborazione della tua richiesta.";
    }
};

/**
 * Genera un report fiscale HTML dettagliato usando Gemini 3 Pro.
 */
export const generateFiscalReport = async (contracts: Contract[], type: string, subjectName: string, studioSettings: any): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `Agisci come un consulente fiscale avanzato. 
        Genera un report fiscale in formato HTML (restituisci SOLO il codice HTML per il contenuto, senza tag <html> o <body>).
        Usa stili puliti (tabelle, bordi, grassetti).
        Includi:
        - Intestazione Studio: ${studioSettings?.name || 'Titan Management'} (P.IVA: ${studioSettings?.piva || 'N/A'})
        - Dettaglio per ogni contratto (Indirizzo, Locatore/Conduttore, Canone, Regime Fiscale)
        - Scadenze fiscali imminenti (Imposte di registro)
        - Riepilogo rendimenti annui totali.`;

        const prompt = `Genera un report "${type}" per ${subjectName || 'il portfolio completo'}.
        Dati contratti: ${JSON.stringify(contracts.map(c => ({
            addr: c.propertyAddress,
            owner: c.ownerName,
            tenant: c.tenantName,
            rent: c.annualRent,
            cedolare: c.cedolareSecca,
            type: c.contractType,
            start: c.startDate
        })))}`;

        const response = await ai.models.generateContent({
            model: MODEL_PRO,
            contents: prompt,
            config: { systemInstruction }
        });

        return response.text || "Report non disponibile.";
    } catch (e) {
        console.error("Report generation error:", e);
        return "Errore tecnico nella generazione del report fiscale.";
    }
};

/**
 * Genera intuizioni rapide sul portfolio usando Gemini 3 Flash.
 */
export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analizza questo portfolio di locazioni e fornisci 3 intuizioni strategiche brevi (massimo 15 parole ciascuna).
            Dati: ${JSON.stringify(contracts.map(c => ({ address: c.propertyAddress, rent: c.annualRent, cedolare: c.cedolareSecca })))}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, description: "Categoria dell'intuizione (es. Fiscale, Rendimento, Scadenze)" },
                            text: { type: Type.STRING, description: "Descrizione sintetica dell'intuizione" }
                        },
                        required: ["category", "text"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Portfolio insights error:", e);
        return [];
    }
};
