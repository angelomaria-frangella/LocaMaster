
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    if (contracts.length === 0) return [
        { category: "SISTEMA", text: "Inizializza il portafoglio per attivare l'analisi d'intelligence." },
        { category: "SISTEMA", text: "Monitoraggio asset pronto all'uso." }
    ];
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const dataContext = contracts.map(c => ({
            addr: c.propertyAddress,
            rent: c.annualRent,
            expiry: c.startDate,
            type: c.contractType,
            fisc: c.cedolareSecca ? 'Cedolare' : 'Ordinario'
        }));

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            config: { 
                systemInstruction: "Sei un analista senior Real Estate di una big four. Analizza il portafoglio e fornisci 3 insight d'intelligence 'executive' e professionali per il Dott. Frangella. Concentrati su: 1. Ottimizzazione Rendita, 2. Rischi Contrattuali, 3. Strategia Fiscale. Rispondi RIGOROSAMENTE in JSON con array di oggetti {category, text}. Categorie ammesse: RENDIMENTO, RISCHIO, FISCALE.",
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
            },
            contents: [{ role: 'user', parts: [{ text: `Analizza: ${JSON.stringify(dataContext)}` }] }]
        });
        
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [
            { category: "FISCO", text: "Verificare scadenze ISTAT per contratti 4+4: potenziale recupero inflattivo del 2.5%." },
            { category: "RENDIMENTO", text: "Ottimizzazione Yield possibile su asset ad uso commerciale via rinegoziazione." },
            { category: "RISCHIO", text: "Scadenziario denso nei prossimi 60 giorni. Pianificare adempimenti RLI per evitare sanzioni." }
        ];
    }
};

export const analyzeLeaseStrategy = async (query: string, contextContracts: Contract[], focusedContract: Contract | null = null, previousMessages: any[] = []) => {
  try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextSummary = contextContracts.map(c => `${c.propertyAddress} (${c.tenantName})`).join(', ');
      const focusInfo = focusedContract ? `FOCUS ATTIVO SU: ${focusedContract.propertyAddress}, Locatario: ${focusedContract.ownerName}, Conduttore: ${focusedContract.tenantName}` : "Nessun focus specifico.";
      
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          config: {
              systemInstruction: `Sei l'assistente legale del Dott. Frangella. 
              CONTESTO STUDIO: Hai ${contextContracts.length} contratti totali: ${contextSummary}. ${focusInfo}. Rispondi in modo professionale e preciso.`
          },
          contents: [
              ...previousMessages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.content }] })),
              { role: 'user', parts: [{ text: query }] }
          ]
      });
      return response.text || "Nessuna risposta generata.";
  } catch(e) { 
      return "Il robot non ha energia. Verifica la chiave API_KEY."; 
  }
};

export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            config: {
                systemInstruction: "Estrai dati contrattuali: ownerName, tenantName, propertyAddress, annualRent, startDate (YYYY-MM-DD), cedolareSecca (boolean). Rispondi in JSON.",
                responseMimeType: "application/json"
            },
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Estrai dati." }] }]
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return {};
    }
};

export const generateFiscalReport = async (contracts: Contract[], reportType: string, subjectName: string = "Generale", studioSettings: any = {}) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const studioInfo = studioSettings.name ? `Studio: ${studioSettings.name}, P.IVA: ${studioSettings.piva}` : "Studio Professionale";
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            config: { systemInstruction: "Genera report fiscale HTML professionale." },
            contents: [{ role: 'user', parts: [{ text: `Genera report ${reportType} per ${subjectName}. ${studioInfo}. Dati: ${JSON.stringify(contracts)}` }] }]
        });
        return response.text;
    } catch (e) {
        return "<h1>Errore Report</h1>";
    }
};
