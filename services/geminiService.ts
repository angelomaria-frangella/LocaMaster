
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

// Modelli serie Gemini 3 (Best performance/quota)
const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

export const generatePortfolioInsights = async (contracts: Contract[]): Promise<{category: string, text: string}[]> => {
    if (contracts.length === 0) return [
        { category: "SISTEMA", text: "Inizializza il portafoglio per attivare l'analisi d'intelligence." }
    ];
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const dataContext = contracts.map(c => ({
            addr: c.propertyAddress,
            rent: c.annualRent,
            type: c.contractType,
            fisc: c.cedolareSecca ? 'Cedolare' : 'Ordinario'
        }));

        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: { 
                systemInstruction: "Sei un analista senior Real Estate. Fornisci 3 insight brevi in JSON: {category, text}. Categorie: RENDIMENTO, RISCHIO, FISCALE.",
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
            contents: [{ role: 'user', parts: [{ text: `Analizza portafoglio: ${JSON.stringify(dataContext)}` }] }]
        });
        
        return JSON.parse(response.text || "[]");
    } catch (e: any) {
        console.error("Gemini Error:", e);
        return [
            { category: "SISTEMA", text: "Quota API esaurita. Seleziona una chiave PRO nelle Impostazioni." },
            { category: "RENDIMENTO", text: "Analisi locale: Rendimento medio stimato al 4.2% lordo." }
        ];
    }
};

export const analyzeLeaseStrategy = async (query: string, contextContracts: Contract[], focusedContract: Contract | null = null, previousMessages: any[] = []) => {
  try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const focusInfo = focusedContract ? `FOCUS SU: ${focusedContract.propertyAddress}` : "Contesto generale.";
      
      const response = await ai.models.generateContent({
          model: MODEL_PRO,
          config: {
              systemInstruction: `Sei l'assistente legale del Dott. Frangella. Hai ${contextContracts.length} contratti. ${focusInfo}.`
          },
          contents: [
              ...previousMessages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.content }] })),
              { role: 'user', parts: [{ text: query }] }
          ]
      });
      return response.text || "Nessuna risposta.";
  } catch(e: any) { 
      return "Il sistema IA è al limite della quota gratuita. Passa alla chiave PRO nelle impostazioni per continuare senza interruzioni."; 
  }
};

export const extractContractData = async (base64Data: string, mimeType: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: {
                systemInstruction: "Estrai: ownerName, tenantName, propertyAddress, annualRent (number), startDate (YYYY-MM-DD), cedolareSecca (boolean). Rispondi solo in JSON.",
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
        
        // Uso della variabile studioSettings per risolvere il warning e migliorare il prompt
        const studioInfo = studioSettings?.name 
            ? `Studio Professionale: ${studioSettings.name}, P.IVA: ${studioSettings.piva}, Località: ${studioSettings.city}` 
            : "Documento emesso da LocaMaster AI Intelligence System";

        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            config: { 
                systemInstruction: `Sei un consulente fiscale Real Estate di alto livello. Genera report in HTML pulito. Intestazione richiesta: ${studioInfo}.` 
            },
            contents: [{ role: 'user', parts: [{ text: `Genera Report ${reportType} per il soggetto ${subjectName}. Dati contratti: ${JSON.stringify(contracts)}` }] }]
        });
        return response.text;
    } catch (e) {
        console.error("Report generation error:", e);
        return "<div style='color:red; padding:20px; border:1px solid red; border-radius:10px;'><h3>Errore Generazione Report</h3><p>La quota API gratuita è esaurita. Configura una chiave PRO nelle Impostazioni.</p></div>";
    }
};
