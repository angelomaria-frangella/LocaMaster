
import React, { useState, useEffect } from 'react';
import { 
  Upload, Sparkles, User, Building2, Euro, Save, 
  Landmark, FileDigit, AlertTriangle, Calendar, MapPin, 
  Hash, Info, PlusCircle, Home, Clock, ShieldCheck, UserCheck, Trash2
} from 'lucide-react';
import { extractContractData } from '../services/geminiService';
import { Contract, ContractType, ClientSide } from '../types';

const InputField = ({ label, value, onChange, type = "text", placeholder = "", required = false, isAlert = false, icon: Icon }: any) => {
    const isEmpty = required && (!value || value === 0 || value === '');
    return (
      <div className="space-y-1.5 w-full">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                {Icon && <Icon className="w-3 h-3 text-primary-500" />}
                {label}
              </span>
              {required && <span className={`px-1.5 py-0.5 rounded text-[8px] ${isEmpty ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{isEmpty ? 'MANCANTE' : 'OK'}</span>}
          </label>
          <div className="relative group">
              <input 
                  type={type} 
                  value={value || ''} 
                  onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                  className={`w-full bg-slate-950 border rounded-xl p-3 text-sm font-bold placeholder-slate-700 outline-none transition-all ${isAlert ? 'hazard-alert text-rose-400' : isEmpty ? 'border-slate-800 text-white focus:border-rose-500/50' : 'border-slate-800 text-white focus:border-primary-500 shadow-inner'}`}
                  placeholder={placeholder}
              />
              {isAlert && <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />}
          </div>
      </div>
    );
};

interface AddContractProps {
  initialData?: Contract;
  onConfirmSave: (contract: Contract, openAi?: boolean) => void;
  onCancel: () => void;
}

const AddContract: React.FC<AddContractProps> = ({ initialData, onConfirmSave, onCancel }) => {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [activeTab, setActiveTab] = useState('anagrafica');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState<Contract>({
    id: initialData?.id || Math.random().toString(36).substr(2, 9),
    isActive: true,
    clientSide: initialData?.clientSide || 'LOCATORE',
    ownerName: '',
    owners: [{ id: '1', name: '', taxCode: '', address: '' }],
    tenantName: '',
    tenants: [{ id: '1', name: '', taxCode: '', address: '' }],
    propertyAddress: '',
    usageType: '',
    annualRent: 0,
    deposit: 0,
    contractType: ContractType.ABITATIVO_LIBERO_4_4,
    startDate: '',
    stipulationDate: '',
    cedolareSecca: false,
    isCanoneConcordato: false,
    noticeMonthsOwner: 6,
    noticeMonthsTenant: 6,
    cadastral: { foglio: '', particella: '', subalterno: '', categoria: '', rendita: 0 },
    registration: { date: '', office: '', series: '', number: '' }
  });

  useEffect(() => {
    if (initialData) {
        setStep('review');
        setFormData({ ...initialData });
    }
  }, [initialData]);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const extracted: any = await extractContractData(base64String, file.type);
        
        if (!extracted || Object.keys(extracted).length === 0) {
            alert("Lia non è riuscita a leggere il file. Assicurati che il PDF sia leggibile.");
            setIsProcessing(false);
            return;
        }

        // DETERMINAZIONE DINAMICA TIPO CONTRATTO
        let autoType = extracted.contractType || formData.contractType;
        if (extracted.isCanoneConcordato) autoType = ContractType.ABITATIVO_CONCORDATO_3_2;

        setFormData(prev => ({
          ...prev,
          ...extracted,
          contractType: autoType,
          owners: extracted.owners && extracted.owners.length > 0 ? extracted.owners : prev.owners,
          tenants: extracted.tenants && extracted.tenants.length > 0 ? extracted.tenants : prev.tenants,
          ownerName: extracted.owners?.[0]?.name || prev.ownerName,
          tenantName: extracted.tenants?.[0]?.name || prev.tenantName,
          cadastral: {
            ...prev.cadastral,
            ...extracted.cadastral
          }
        }));
        setStep('review');
      } catch (err) { 
        console.error("AI Protocol Failed:", err);
      } finally { 
        setIsProcessing(false); 
      }
    };
    reader.readAsDataURL(file);
  };

  const addParty = (type: 'owners' | 'tenants') => {
    const newParty = { id: Math.random().toString(36).substr(2, 5), name: '', taxCode: '', address: '' };
    setFormData(prev => ({ ...prev, [type]: [...prev[type], newParty] }));
  };

  const removeParty = (type: 'owners' | 'tenants', id: string) => {
    setFormData(prev => ({ ...prev, [type]: prev[type].filter(p => p.id !== id) }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col gap-6">
      {step === 'upload' ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] p-20 border-slate-800 bg-slate-900/40 animate-scan">
          {isProcessing ? (
             <div className="text-center space-y-6">
               <div className="w-24 h-24 border-b-4 border-primary-500 rounded-full animate-spin mx-auto" />
               <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Lia sta processando...</h3>
               <p className="text-primary-500 font-mono text-[10px] animate-pulse">ESTRAZIONE CATASTALE E FISCALE INTEGRALE</p>
             </div>
          ) : (
             <>
               <div className="p-10 bg-slate-800 rounded-[2.5rem] mb-8 shadow-2xl border border-white/5 relative group">
                  <div className="absolute inset-0 bg-primary-500/10 blur-2xl rounded-full group-hover:bg-primary-500/20 transition-all"></div>
                  <FileDigit className="w-16 h-16 text-primary-500 relative z-10" />
               </div>
               <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Carica Contratto</h3>
               <p className="text-slate-500 mb-10 text-center max-w-md font-bold uppercase text-[10px] tracking-[0.3em]">Trascina qui il file per l'estrazione automatica Lia Intelligence</p>
               <label className="cursor-pointer px-16 py-6 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl hover:scale-105">
                 Analizza Documento
                 <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
               </label>
             </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative hud-border overflow-hidden">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    <Clock className="w-7 h-7 text-primary-500" /> Revisione Intelligence <span className="text-slate-700">/</span> <span className="text-primary-500">{formData.propertyAddress || 'Dati Estratti'}</span>
                </h2>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="px-6 py-3 bg-slate-800 hover:bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Annulla</button>
                    <button onClick={() => onConfirmSave(formData, true)} className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2"><Save className="w-4 h-4" /> Conferma e Salva Asset</button>
                </div>
            </div>

            <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
                {[
                  { id: 'anagrafica', label: 'Parti (Locatore/Conduttore)', icon: User },
                  { id: 'economico', label: 'Canoni e Opzioni Fiscali', icon: Euro },
                  { id: 'immobile', label: 'Identificativi Catastali', icon: Landmark }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border ${activeTab === tab.id ? 'bg-primary-600 text-white border-primary-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-slate-800/40 text-slate-500 border-white/5 hover:text-slate-300'}`}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-8 no-scrollbar">
                {activeTab === 'anagrafica' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <div className="space-y-6 p-8 bg-slate-950/40 rounded-[2rem] border border-white/5">
                          <div className="flex justify-between items-center mb-4">
                             <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em]">Locatori (Proprietà)</h4>
                             <button onClick={() => addParty('owners')} className="p-2 bg-primary-600/10 text-primary-500 rounded-lg"><PlusCircle className="w-4 h-4" /></button>
                          </div>
                          {formData.owners.map((owner, idx) => (
                            <div key={idx} className="space-y-4 p-6 bg-slate-900/50 rounded-2xl border border-white/5 relative group">
                                {idx > 0 && <button onClick={() => removeParty('owners', (owner as any).id)} className="absolute top-4 right-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>}
                                <InputField label="Nome / Ragione Sociale" value={owner.name} onChange={(v: string) => {
                                    const next = [...formData.owners]; next[idx].name = v;
                                    setFormData(p => ({...p, owners: next, ownerName: next[0].name }));
                                }} required icon={User} />
                                <InputField label="Codice Fiscale" value={owner.taxCode} onChange={(v: string) => {
                                    const next = [...formData.owners]; next[idx].taxCode = v;
                                    setFormData(p => ({...p, owners: next}));
                                }} required icon={Hash} />
                            </div>
                          ))}
                      </div>
                      <div className="space-y-6 p-8 bg-slate-950/40 rounded-[2rem] border border-white/5">
                          <div className="flex justify-between items-center mb-4">
                             <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">Conduttori (Inquilini)</h4>
                             <button onClick={() => addParty('tenants')} className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg"><PlusCircle className="w-4 h-4" /></button>
                          </div>
                          {formData.tenants.map((tenant, idx) => (
                            <div key={idx} className="space-y-4 p-6 bg-slate-900/50 rounded-2xl border border-white/5 relative group">
                                {idx > 0 && <button onClick={() => removeParty('tenants', (tenant as any).id)} className="absolute top-4 right-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>}
                                <InputField label="Nome / Ragione Sociale" value={tenant.name} onChange={(v: string) => {
                                    const next = [...formData.tenants]; next[idx].name = v;
                                    setFormData(p => ({...p, tenants: next, tenantName: next[0].name }));
                                }} required icon={User} />
                                <InputField label="Codice Fiscale" value={tenant.taxCode} onChange={(v: string) => {
                                    const next = [...formData.tenants]; next[idx].taxCode = v;
                                    setFormData(p => ({...p, tenants: next}));
                                }} required icon={Hash} />
                            </div>
                          ))}
                      </div>
                  </div>
                )}

                {activeTab === 'economico' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em]">Date e Durata</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Decorrenza" type="date" value={formData.startDate} onChange={(v: string) => setFormData(p => ({...p, startDate: v}))} required icon={Calendar} />
                            <InputField label="Stipula" type="date" value={formData.stipulationDate} onChange={(v: string) => setFormData(p => ({...p, stipulationDate: v}))} icon={Clock} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Modello Contrattuale</label>
                             <select value={formData.contractType} onChange={(e) => setFormData(p => ({...p, contractType: e.target.value as ContractType}))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-primary-500">
                                {Object.values(ContractType).map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                          </div>
                      </div>
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em]">Fiscalità e Canoni</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Canone Annuo €" type="number" value={formData.annualRent} onChange={(v: number) => setFormData(p => ({...p, annualRent: v}))} required icon={Euro} />
                            <InputField label="Deposito €" type="number" value={formData.deposit} onChange={(v: number) => setFormData(p => ({...p, deposit: v}))} icon={Landmark} />
                          </div>
                          <div className="flex gap-4">
                             <div className={`flex-1 p-5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${formData.cedolareSecca ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`} onClick={() => setFormData(p => ({...p, cedolareSecca: !p.cedolareSecca}))}>
                                <ShieldCheck className="w-6 h-6" /> <span className="font-black text-[10px] uppercase tracking-widest">Cedolare Secca</span>
                             </div>
                             <div className={`flex-1 p-5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${formData.isCanoneConcordato ? 'bg-primary-500/10 border-primary-500/50 text-primary-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`} onClick={() => setFormData(p => ({...p, isCanoneConcordato: !p.isCanoneConcordato}))}>
                                <Sparkles className="w-6 h-6" /> <span className="font-black text-[10px] uppercase tracking-widest">Concordato</span>
                             </div>
                          </div>
                      </div>
                  </div>
                )}

                {activeTab === 'immobile' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em]">Localizzazione</h4>
                          <InputField label="Indirizzo Immobile" value={formData.propertyAddress} onChange={(v: string) => setFormData(p => ({...p, propertyAddress: v}))} required icon={MapPin} />
                      </div>
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em]">Identificativi Catastali</h4>
                          <div className="grid grid-cols-3 gap-4">
                             <InputField label="Foglio" value={formData.cadastral?.foglio} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, foglio: v}}))} icon={Hash} />
                             <InputField label="Particella" value={formData.cadastral?.particella} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, particella: v}}))} icon={Hash} />
                             <InputField label="Subalterno" value={formData.cadastral?.subalterno} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, subalterno: v}}))} icon={Hash} />
                          </div>
                      </div>
                  </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default AddContract;
