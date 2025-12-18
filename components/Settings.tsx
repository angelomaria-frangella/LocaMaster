
import { useState, useEffect } from 'react';
import { Shield, Globe, Bell, Building, LayoutDashboard, ArrowRight, Database, Cloud, HardDrive, Sparkles, RefreshCw, ExternalLink, Terminal, Github, Send } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseService';

declare var window: any;

interface SettingsProps {
    onNavigate: (view: string) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('security');
  const [googleClientId, setGoogleClientId] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState(false);
  const [hasPaidKey, setHasPaidKey] = useState(false);
  
  const [studioName, setStudioName] = useState('');
  const [studioPiva, setStudioPiva] = useState('');
  const [studioCity, setStudioCity] = useState('');

  useEffect(() => {
    loadStudioData();
    checkKeyStatus();
    setSupabaseStatus(isSupabaseConfigured());
    setGoogleClientId(localStorage.getItem('google_client_id') || '');
  }, []);

  const checkKeyStatus = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasPaidKey(selected);
    }
  };

  const handleOpenKeySelector = async () => {
      if (window.aistudio?.openSelectKey) {
          await window.aistudio.openSelectKey();
          // Assumiamo successo per sbloccare la UI immediatamente
          setHasPaidKey(true);
          // Eseguiamo un piccolo refresh dello stato dopo un istante
          setTimeout(checkKeyStatus, 1000);
      }
  };

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

  const handleSaveGoogleConfig = () => {
      localStorage.setItem('google_client_id', googleClientId);
      alert("Configurazione Google Workspace salvata.");
  };

  const menuItems = [
    { id: 'security', label: 'Sicurezza & Cloud', icon: Shield },
    { id: 'general', label: 'Profilo Studio', icon: Building },
    { id: 'integrations', label: 'Workspace Integration', icon: Globe },
    { id: 'deploy', label: 'Deployment & Terminal', icon: Terminal },
    { id: 'notifications', label: 'Notifiche', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white uppercase tracking-tighter italic">Settings <span className="text-primary-500 font-black">Control</span></h2>
            <p className="text-slate-400 mt-1">Configurazione d'intelligence e infrastruttura.</p>
        </div>
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl border border-slate-700 transition-all group">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            Dashboard
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-primary-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className={`w-5 h-5 mr-4 ${activeTab === item.id ? 'text-white' : 'text-slate-600'}`} />
              <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 blur-[100px] rounded-full"></div>
          
          {activeTab === 'security' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                 
                 <div className={`p-10 rounded-[3rem] border-4 transition-all ${hasPaidKey ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 'bg-primary-500/10 border-primary-500/40 shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-glow'}`}>
                    <div className="flex flex-col items-center text-center">
                        <div className={`p-6 rounded-[2rem] mb-6 ${hasPaidKey ? 'bg-emerald-500 text-white shadow-emerald-500/50' : 'bg-primary-500 text-white shadow-primary-500/50'} shadow-2xl`}>
                            <Sparkles className="w-12 h-12" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">
                            {hasPaidKey ? "SISTEMA AI PROFESSIONALE ATTIVO" : "POTENZIA L'INTELLIGENZA"}
                        </h3>
                        <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-md">
                            {hasPaidKey 
                              ? "Stai utilizzando la quota professionale senza limiti e con massima precisione legale." 
                              : "La versione gratuita ha limiti di velocità. Sblocca la chiave API Professionale per analisi illimitate e veloci."}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button 
                                onClick={handleOpenKeySelector}
                                className={`px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl hover:scale-105 active:scale-95 ${hasPaidKey ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'bg-white text-slate-950 border-4 border-primary-500'}`}
                            >
                                {hasPaidKey ? "MODIFICA CHIAVE PRO" : "SBLOCCA IA PRO ORA"}
                            </button>
                            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="px-8 py-5 bg-slate-800 text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-colors"><ExternalLink className="w-4 h-4" /> INFO FATTURAZIONE</a>
                        </div>
                    </div>
                 </div>

                 <div className="space-y-6 border-t border-slate-800 pt-8">
                     <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 italic">
                        <Database className="w-6 h-6 text-emerald-400" /> Infrastructure Link
                     </h3>
                     <div className={`p-8 rounded-[2rem] border-2 ${supabaseStatus ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950 border-slate-800'}`}>
                        <div className="flex items-start gap-5">
                            <div className={`p-4 rounded-2xl ${supabaseStatus ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                {supabaseStatus ? <Cloud className="w-8 h-8" /> : <HardDrive className="w-8 h-8" />}
                            </div>
                            <div>
                                <p className="font-black text-white text-lg uppercase tracking-tight">
                                    Status: {supabaseStatus ? 'Cloud Sync Online' : 'Local Storage Only'}
                                </p>
                                <p className="text-sm text-slate-500 mt-2">
                                    {supabaseStatus 
                                        ? "Dati protetti e sincronizzati in tempo reale con il database centrale." 
                                        : "Attenzione: i dati risiedono solo nella memoria locale di questo browser."}
                                </p>
                            </div>
                        </div>
                     </div>
                 </div>
              </div>
          )}

          {activeTab === 'general' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-2xl font-black text-white uppercase italic">Studio Profile</h3>
                <div className="grid grid-cols-1 gap-6">
                   <InputField label="Ragione Sociale" value={studioName} onChange={setStudioName} />
                   <div className="grid grid-cols-2 gap-6">
                        <InputField label="P.IVA" value={studioPiva} onChange={setStudioPiva} />
                        <InputField label="Città" value={studioCity} onChange={setStudioCity} />
                   </div>
                </div>
                <button onClick={handleSaveStudioData} className="flex items-center gap-3 bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"><RefreshCw className="w-4 h-4" /> Aggiorna Profilo</button>
             </div>
          )}

          {activeTab === 'integrations' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-2xl font-black text-white uppercase italic">Workspace Integration</h3>
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                    <InputField label="Google Client ID" value={googleClientId} onChange={setGoogleClientId} placeholder="xxxxxx-xxxxxxxx.apps.googleusercontent.com" />
                </div>
                <button onClick={handleSaveGoogleConfig} className="flex items-center gap-3 bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Salva Configurazione</button>
             </div>
          )}

          {activeTab === 'deploy' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-2xl font-black text-white uppercase italic flex items-center gap-3">
                    <Terminal className="w-8 h-8 text-primary-500" /> Deployment Console
                </h3>
                
                <div className="bg-black rounded-3xl p-8 border border-slate-800 font-mono shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/40 to-transparent"></div>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="ml-4 text-[10px] text-slate-600 uppercase font-black tracking-widest">Git Update Routine</span>
                    </div>
                    
                    <div className="space-y-4 text-sm">
                        <div className="flex gap-4">
                            <span className="text-slate-700">1</span>
                            <span className="text-emerald-500">git</span>
                            <span className="text-white">add .</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-slate-700">2</span>
                            <span className="text-emerald-500">git</span>
                            <span className="text-white">commit -m <span className="text-amber-400">"Build Fix: V1.2.0 sblocco PRO"</span></span>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-slate-700">3</span>
                            <span className="text-emerald-500">git</span>
                            <span className="text-white">push origin main</span>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-900 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 flex items-center gap-2">
                            <Github className="w-4 h-4" /> Pronto per la sincronizzazione
                        </span>
                        <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold animate-pulse">
                            <Send className="w-3 h-3" /> VERCEL DETECTED
                        </div>
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'notifications' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center py-20 opacity-40">
                <Bell className="w-16 h-16 text-slate-500 mb-4" />
                <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Notification Engine</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em]">Modulo in fase di rilascio</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

const InputField = ({ label, value, onChange, placeholder = "" }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary-500" />
    </div>
);
