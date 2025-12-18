import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, X } from 'lucide-react';
import { analyzeLeaseStrategy } from '../services/geminiService';
import { Contract } from '../types';

interface AIAdvisorProps {
  contracts: Contract[];
  focusedContract: Contract | null;
  onClearFocus: () => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ contracts, focusedContract, onClearFocus }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Ciao! Sono il tuo assistente per le locazioni. Posso aiutarti a calcolare l\'adeguamento ISTAT, scrivere lettere di sollecito o analizzare scadenze complesse. Come posso aiutarti oggi?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedContract) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          content: `Ho attivato il focus sul contratto per **${focusedContract.propertyAddress}** (${focusedContract.contractType}).\n\nChiedimi pure di redigere lettere, calcolare imposte o verificare scadenze specifiche per questo immobile.` 
        }
      ]);
    }
  }, [focusedContract]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    const currentHistory = messages; // Cattura la history attuale PRIMA di aggiungere il nuovo messaggio

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Passiamo currentHistory alla funzione
      const response = await analyzeLeaseStrategy(userMsg, contracts, focusedContract, currentHistory);
      
      // Ensure we display something even if response is empty string
      const textToDisplay = response || "Non sono riuscito a generare una risposta. Riprova.";
      setMessages(prev => [...prev, { role: 'ai', content: textToDisplay }]);
    } catch (error: any) {
      console.error("Critical AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: `Errore imprevisto: ${error.message || "Servizio non disponibile"}.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render text with basic formatting (bold and newlines)
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Handle simple bold markdown (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={i} className={`min-h-[1.2em] ${i > 0 ? 'mt-1' : ''}`}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const suggestions = focusedContract 
    ? [
        "Prepara lettera adeguamento ISTAT",
        "Scrivi sollecito pagamento",
        "Calcola imposta di registro annuale",
        "Bozza disdetta per il conduttore"
      ]
    : [
        "Scrivi una disdetta generica",
        "Calcola imposta su 12.000€",
        "Differenze cedolare vs ordinario",
        "Come gestire un inquilino moroso?"
      ];

  return (
    // FIX HEIGHT: Used fixed VH calculation instead of h-full to prevent collapse in scrollable parent
    // FIX VISUAL: Removed opacity/blur. Solid bg-slate-900.
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      <div className={`p-4 border-b border-slate-700 transition-colors duration-300 flex items-center justify-between flex-shrink-0 ${focusedContract ? 'bg-primary-950' : 'bg-slate-900'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              Assistente Virtuale
              {focusedContract && <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full border border-primary-500">FOCUS ATTIVO</span>}
            </h2>
            {focusedContract ? (
              <p className="text-xs text-primary-200 truncate max-w-[200px] sm:max-w-md">
                {focusedContract.propertyAddress} • {focusedContract.tenantName}
              </p>
            ) : (
              <p className="text-xs text-slate-400">Powered by Gemini 2.5 Flash</p>
            )}
          </div>
        </div>
        
        {focusedContract && (
          <button 
            onClick={onClearFocus}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <X className="w-3 h-3" />
            Chiudi Focus
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-primary-900 border border-primary-800'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-primary-400" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md break-words border ${
                msg.role === 'user' 
                  ? 'bg-slate-700 border-slate-600 text-white rounded-tr-sm' 
                  : 'bg-slate-950 text-slate-200 border-slate-800 rounded-tl-sm'
              }`}>
                {msg.role === 'ai' ? renderFormattedText(msg.content) : msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary-900 border border-primary-800 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-400" />
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                  <span className="text-sm text-slate-400">Sto elaborando...</span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 border-t border-slate-800 flex-shrink-0 ${focusedContract ? 'bg-primary-950' : 'bg-slate-900'}`}>
        {messages.length < (focusedContract ? 4 : 3) && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
                {suggestions.map((s, i) => (
                    <button 
                        key={i} 
                        onClick={() => setInput(s)}
                        className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-xs transition-colors flex-shrink-0 ${
                          focusedContract 
                            ? 'bg-primary-900 border-primary-800 text-primary-200 hover:bg-primary-800'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={focusedContract ? "Chiedi qualcosa su questo contratto..." : "Chiedi qualcosa sulle scadenze..."}
            className={`w-full text-white pl-4 pr-12 py-3.5 rounded-xl border focus:outline-none focus:ring-2 transition-all shadow-inner ${
               focusedContract
                 ? 'bg-slate-950 border-primary-800 focus:ring-primary-600 focus:border-primary-600 placeholder-primary-300/30'
                 : 'bg-slate-950 border-slate-700 focus:ring-primary-600 focus:border-primary-600'
            }`}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;