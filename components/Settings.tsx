import { useState, useEffect } from 'react';
import { Shield, Globe, Bell, Building, LayoutDashboard, ArrowRight, Database, Cloud, Calendar, HardDrive, Sparkles, RefreshCw, Mail } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseService';

declare var process: any;

interface SettingsProps {
    onNavigate: (view: string) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('security');
  const [googleClientId, setGoogleClientId] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState(false);
  
  const [studioName, setStudioName] = useState('');
  const [studioPiva, setStudioPiva] = useState('');
  const [studioCity, setStudioCity] = useState('');

  const [apiKeyStatus, setApiKeyStatus] = useState<{valid: boolean, message: string, preview: string}>({
    valid: false, 
    message: "Verifica in corso...", 
    preview: ""
  });

  useEffect(() => {
    checkKeyStatus();
    loadStudioData();
    setSupabaseStatus(isSupabaseConfigured());
    setGoogleClientId(localStorage.getItem('google_client_id') || '');
  }, []);

  const loadStudioData = () => {
      setStudioName(localStorage.getItem('studio_name') || 'Studio Commercialista');
      setStudioPiva(localStorage.getItem('studio_piva') || '');
      setStudioCity(localStorage.getItem('studio_city') || '');
  };

  const handleSaveStudioData = () => {
      localStorage.setItem('studio_name', studioName);
      localStorage.setItem('studio_piva', studioPiva);
      localStorage.setItem('studio_city', studioCity);
      alert("Profilo studio aggiornato.");
  };

  const checkKeyStatus = () => {
    const hasKey = !!process.env.API_KEY;
    setApiKeyStatus({
        valid: hasKey,
        message: hasKey ? "Chiave API Gemini Configurata" : "Chiave API Gemini Assente",
        preview: hasKey ? "Configurata dal sistema" : "Non rilevata"
    });
  };

  const handleSaveGoogleConfig = () => {
      localStorage.setItem('google_client_id', googleClientId);
      alert("Configurazione Google Workspace salvata. Ora puoi connettere il calendario dalla vista Scadenze.");
  };

  const menuItems = [
    { id: 'security', label: 'Sicurezza & Cloud', icon: Shield },
    { id: 'general', label: 'Profilo Studio', icon: Building },
    { id: 'integrations', label: 'Workspace Integration', icon: Globe },
    { id: 'notifications', label: 'Notifiche', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white">Impostazioni</h2>
            <p className="text-slate-400 mt-1">Sincronizzazione Cloud e Integrazioni.</p>
        </div>
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl border border-slate-700 transition-all group">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Dashboard</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? 'text-white' : 'text-slate-500'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl">
          
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <div className="p-3 bg-blue-600 rounded-xl text-white"><Globe className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold text-white">Google Workspace</h3>
                  <p className="text-blue-300/70 text-sm">Sincronizza lo studio con l'ecosistema Google.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <h4 className="text-white font-bold flex items-center gap-2 mb-4"><Calendar className="w-4 h-4 text-primary-400"/> Google Calendar & Drive</h4>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Per abilitare la sincronizzazione automatica cross-terminale degli eventi e dei documenti, devi creare un progetto su <b>Google Cloud Console</b> e inserire qui il tuo Client ID.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Google Client ID</label>
                            <input 
                                type="text" 
                                value={googleClientId}
                                onChange={(e) => setGoogleClientId(e.target.value)}
                                placeholder="tuoid.apps.googleusercontent.com"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm outline-none focus:border-primary-500"
                            />
                        </div>
                        <button 
                            onClick={handleSaveGoogleConfig}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" /> Salva Configurazione Workspace
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center text-center opacity-50">
                        <Mail className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-xs font-bold text-slate-300">Invio Lettere via Gmail</span>
                        <span className="text-[10px] text-slate-500 mt-1">Prossimo Update</span>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center text-center opacity-50">
                        <Database className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-xs font-bold text-slate-300">Backup Drive</span>
                        <span className="text-[10px] text-slate-500 mt-1">Prossimo Update</span>
                    </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-xl font-bold text-white">Profilo Studio Professionale</h3>
                <div className="grid grid-cols-1 gap-4">
                   <div className="space-y-2">
                       <label className="text-xs font-semibold text-slate-400 uppercase">Nome Studio</label>
                       <input type="text" value={studioName} onChange={(e) => setStudioName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase">Partita IVA</label>
                            <input type="text" value={studioPiva} onChange={(e) => setStudioPiva(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase">Città</label>
                            <input type="text" value={studioCity} onChange={(e) => setStudioCity(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                        </div>
                   </div>
                </div>
                <button onClick={handleSaveStudioData} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-primary-900/20">
                    <RefreshCw className="w-4 h-4" /> Salva Profilo
                </button>
             </div>
          )}

          {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                 <div className="space-y-4 border-b border-slate-800 pb-8">
                     <h3 className="text-lg font-bold text-white flex items-center gap-2"><Database className="w-5 h-5 text-emerald-400" /> Sincronizzazione Cross-Terminale</h3>
                     <div className={`p-5 rounded-2xl border ${supabaseStatus ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-slate-950 border-slate-800'}`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${supabaseStatus ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                                {supabaseStatus ? <Cloud className="w-6 h-6 text-emerald-500" /> : <HardDrive className="w-6 h-6 text-slate-500" />}
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg">
                                    Stato: {supabaseStatus ? 'CLOUD SYNC ATTIVO' : 'MODALITÀ LOCALE'}
                                </p>
                                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                                    {supabaseStatus 
                                        ? "I tuoi dati sono al sicuro nel Cloud. Puoi accedere alla tua dashboard da qualsiasi PC o terminale usando le tue credenziali Supabase." 
                                        : "Attualmente i dati sono salvati solo in questo browser. Per averli su tutti i terminali, configura un progetto Supabase gratuito."}
                                </p>
                                {!supabaseStatus && (
                                    <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-xl text-[10px] text-indigo-300">
                                        <b>CONSIGLIO:</b> Crea un account su <a href="https://supabase.com" target="_blank" className="underline font-bold">Supabase</a>, crea un progetto e inserisci le chiavi nel tuo ambiente per sbloccare la portabilità totale.
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary-400" /> Intelligenza Artificiale (Gemini)</h3>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-full ${apiKeyStatus.valid ? 'bg-primary-500/10 text-primary-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                <Sparkles className="w-6 h-6" />
                             </div>
                             <div>
                                <p className="font-bold text-white">{apiKeyStatus.message}</p>
                                <p className="text-xs text-slate-500">L'IA è gestita a livello di sistema.</p>
                             </div>
                        </div>
                    </div>
                 </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}