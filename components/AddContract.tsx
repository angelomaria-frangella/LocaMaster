
import React, { useState, useEffect } from 'react';
import { 
  Upload, X, Sparkles, User, Building2, Euro, Save, 
  ShieldCheck, Landmark, FileDigit, AlertTriangle, Calendar, MapPin, 
  Percent, Hash, Info, PlusCircle, Trash2, Home
} from 'lucide-react';
import { extractContractData } from '../services/geminiService';
import { Contract, ContractType, Party } from '../types';

const InputField = ({ label, value, onChange, type = "text", placeholder = "", required = false, isAlert = false, icon: Icon }: any) => {
    const isEmpty = required && (!value || value === 0);
    return (
      <div className="space-y-1.5 w-full">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                {Icon && <Icon className="w-3 h-3 text-primary-500" />}
                {label}
              </span>
              {required && <span className={`px-1.5 py-0.5 rounded text-[8px] ${isEmpty ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{isEmpty ? 'RICHIESTO' : 'OK'}</span>}
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
    clientSide: 'LOCATORE',
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
    cedolareSecca: false,
    isCanoneConcordato: false,
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
        const data: any = await extractContractData(base64String, file.type);
        
        // Logica di blindatura: se è concordato, forza 3+2
        let finalContractType = data.contractType || formData.contractType;
        if (data.isCanoneConcordato) {
          finalContractType = ContractType.ABITATIVO_CONCORDATO_3_2;
        }

        setFormData(prev => ({
          ...prev,
          ...data,
          contractType: finalContractType,
          usageType: data.usageType || "CARENZA DOCUMENTALE",
          attachment: { fileName: file.name, mimeType: file.type, data: base64String }
        }));
        setStep('review');
      } catch (err) { console.error(err); } finally { setIsProcessing(false); }
    };
    reader.readAsDataURL(file);
  };

  const addParty = (type: 'owners' | 'tenants') => {
    const newParty = { id: Math.random().toString(36).substr(2, 5), name: '', taxCode: '', address: '' };
    setFormData(prev => ({ ...prev, [type]: [...prev[type], newParty] }));
  };

  // Check per incoerenze normative
  const hasInconsistency = formData.isCanoneConcordato && formData.contractType === ContractType.ABITATIVO_LIBERO_4_4;

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col gap-6">
      {step === 'upload' ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] p-20 border-slate-800 bg-slate-900/40 animate-scan">
          {isProcessing ? (
             <div className="text-center space-y-6">
               <div className="w-24 h-24 border-b-4 border-primary-500 rounded-full animate-spin mx-auto" />
               <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Scansione Tecnica...</h3>
               <p className="text-primary-500 font-mono text-xs animate-pulse">ESTRAZIONE DATI PER STUDIO COMMERCIALE</p>
             </div>
          ) : (
             <>
               <div className="p-10 bg-slate-800 rounded-[2.5rem] mb-8 shadow-2xl border border-white/5 relative group">
                  <div className="absolute inset-0 bg-primary-500/10 blur-2xl rounded-full group-hover:bg-primary-500/20 transition-all"></div>
                  <Upload className="w-16 h-16 text-primary-500 relative z-10" />
               </div>
               <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Ingresso Asset</h3>
               <p className="text-slate-500 mb-10 text-center max-w-md font-bold uppercase text-[10px] tracking-[0.3em]">Protocollo di acquisizione Studio Titan V5.0</p>
               <label className="cursor-pointer px-16 py-6 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl hover:scale-105">
                 Analizza Contratto
                 <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
               </label>
             </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative hud-border overflow-hidden">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-6">
                   <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                      <FileDigit className="w-7 h-7 text-primary-500" /> Analisi Asset <span className="text-slate-700">/</span> <span className="text-primary-500">{formData.propertyAddress || 'Pratica Tributaria'}</span>
                   </h2>
                </div>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="px-6 py-3 bg-slate-800 hover:bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Annulla</button>
                    <button onClick={() => onConfirmSave(formData, true)} className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2"><Save className="w-4 h-4" /> Salva Pratica</button>
                </div>
            </div>

            <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
                {[
                  { id: 'anagrafica', label: 'Anagrafiche Tributarie', icon: User },
                  { id: 'immobile', label: 'Dati Catastali', icon: Landmark },
                  { id: 'economico', label: 'Canone e Durata', icon: Euro },
                  { id: 'registrazione', label: 'Protocollo AdE', icon: FileDigit }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border ${activeTab === tab.id ? 'bg-primary-600 text-white border-primary-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-slate-800/40 text-slate-500 border-white/5 hover:text-slate-300'}`}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide">
                {activeTab === 'anagrafica' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Locatori */}
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em]">Locatori (Soggetti Passivi)</h4>
                            <button onClick={() => addParty('owners')} className="text-primary-500 hover:text-white transition-colors"><PlusCircle className="w-5 h-5" /></button>
                          </div>
                          {formData.owners.map((owner, idx) => (
                            <div key={owner.id} className="space-y-4 p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                                <div className="grid grid-cols-2 gap-4">
                                  <InputField label="Nome / Ragione Sociale" value={owner.name} onChange={(v: string) => {
                                      const newOwners = [...formData.owners];
                                      newOwners[idx].name = v;
                                      setFormData(p => ({...p, owners: newOwners, ownerName: newOwners[0].name }));
                                  }} required icon={User} />
                                  <InputField label="Codice Fiscale / P.IVA" value={owner.taxCode} onChange={(v: string) => {
                                      const newOwners = [...formData.owners];
                                      newOwners[idx].taxCode = v;
                                      setFormData(p => ({...p, owners: newOwners}));
                                  }} required icon={Hash} />
                                </div>
                                <InputField label="Residenza o Sede Legale" value={owner.address} onChange={(v: string) => {
                                    const newOwners = [...formData.owners];
                                    newOwners[idx].address = v;
                                    setFormData(p => ({...p, owners: newOwners}));
                                }} icon={Home} placeholder="Via, Civico, CAP, Città, Prov" />
                            </div>
                          ))}
                      </div>
                      {/* Conduttori */}
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em]">Conduttori</h4>
                            <button onClick={() => addParty('tenants')} className="text-primary-500 hover:text-white transition-colors"><PlusCircle className="w-5 h-5" /></button>
                          </div>
                          {formData.tenants.map((tenant, idx) => (
                            <div key={tenant.id} className="space-y-4 p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                                <div className="grid grid-cols-2 gap-4">
                                  <InputField label="Nome / Ragione Sociale" value={tenant.name} onChange={(v: string) => {
                                      const newTenants = [...formData.tenants];
                                      newTenants[idx].name = v;
                                      setFormData(p => ({...p, tenants: newTenants, tenantName: newTenants[0].name }));
                                  }} required icon={User} />
                                  <InputField label="Codice Fiscale / P.IVA" value={tenant.taxCode} onChange={(v: string) => {
                                      const newTenants = [...formData.tenants];
                                      newTenants[idx].taxCode = v;
                                      setFormData(p => ({...p, tenants: newTenants}));
                                  }} required icon={Hash} />
                                </div>
                                <InputField label="Residenza o Sede Legale" value={tenant.address} onChange={(v: string) => {
                                    const newTenants = [...formData.tenants];
                                    newTenants[idx].address = v;
                                    setFormData(p => ({...p, tenants: newTenants}));
                                }} icon={Home} placeholder="Via, Civico, CAP, Città, Prov" />
                            </div>
                          ))}
                      </div>
                  </div>
                )}

                {activeTab === 'immobile' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-4">Ubicazione e Uso</h4>
                          <InputField label="Indirizzo Immobile" value={formData.propertyAddress} onChange={(v: string) => setFormData(p => ({...p, propertyAddress: v}))} required icon={MapPin} />
                          <InputField label="Destinazione d'Uso" value={formData.usageType} onChange={(v: string) => setFormData(p => ({...p, usageType: v}))} required isAlert={formData.usageType?.includes('CARENZA')} icon={Info} />
                      </div>
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-4">Dati Catastali</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <InputField label="Foglio" value={formData.cadastral?.foglio} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, foglio: v}}))} icon={Hash} />
                            <InputField label="Particella" value={formData.cadastral?.particella} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, particella: v}}))} icon={Hash} />
                            <InputField label="Subalterno" value={formData.cadastral?.subalterno} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, subalterno: v}}))} icon={Hash} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Categoria" value={formData.cadastral?.categoria} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, categoria: v}}))} placeholder="Es: A/2" icon={Building2} />
                            <InputField label="Rendita €" type="number" value={formData.cadastral?.rendita} onChange={(v: number) => setFormData(p => ({...p, cadastral: {...p.cadastral, rendita: v}}))} icon={Euro} />
                          </div>
                      </div>
                  </div>
                )}

                {activeTab === 'economico' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-4">Condizioni Economiche</h4>
                          <InputField label="Canone Annuo €" type="number" value={formData.annualRent} onChange={(v: number) => setFormData(p => ({...p, annualRent: v}))} required icon={Euro} />
                          <div className="flex items-center gap-4 p-5 bg-primary-500/10 border border-primary-500/30 rounded-2xl group transition-all cursor-pointer" onClick={() => setFormData(p => ({...p, isCanoneConcordato: !p.isCanoneConcordato}))}>
                             <Sparkles className={`w-8 h-8 ${formData.isCanoneConcordato ? 'text-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-600'}`} />
                             <div className="flex-1">
                                <p className="text-sm font-black text-white uppercase tracking-tighter">Canone Concordato</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{formData.isCanoneConcordato ? 'L. 431/98 Attiva' : 'Mercato Libero'}</p>
                             </div>
                             <div className={`w-12 h-6 rounded-full relative transition-all ${formData.isCanoneConcordato ? 'bg-primary-500' : 'bg-slate-800'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isCanoneConcordato ? 'left-7' : 'left-1'}`}></div>
                             </div>
                          </div>
                          {hasInconsistency && (
                            <div className="flex items-start gap-4 p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl animate-pulse">
                                <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                                <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight">Errore Normativo: Il Canone Concordato richiede durata 3+2. Selezionata 4+4.</p>
                            </div>
                          )}
                      </div>
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-4">Durata Contratto</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Data Inizio" type="date" value={formData.startDate} onChange={(v: string) => setFormData(p => ({...p, startDate: v}))} required icon={Calendar} />
                            <InputField label="Data Stipula" type="date" value={formData.stipulationDate} onChange={(v: string) => setFormData(p => ({...p, stipulationDate: v}))} icon={Calendar} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Modello Contrattuale</label>
                             <select value={formData.contractType} onChange={(e) => setFormData(p => ({...p, contractType: e.target.value as ContractType}))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-primary-500">
                                {Object.values(ContractType).map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                          </div>
                      </div>
                  </div>
                )}

                {activeTab === 'registrazione' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-4">Protocollo AdE</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Data Registrazione" type="date" value={formData.registration?.date} onChange={(v: string) => setFormData(p => ({...p, registration: {...p.registration, date: v}}))} icon={Calendar} />
                            <InputField label="Ufficio AdE" value={formData.registration?.office} onChange={(v: string) => setFormData(p => ({...p, registration: {...p.registration, office: v}}))} placeholder="Es: Milano 1" icon={Landmark} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Serie" value={formData.registration?.series} onChange={(v: string) => setFormData(p => ({...p, registration: {...p.registration, series: v}}))} icon={Hash} />
                            <InputField label="Numero" value={formData.registration?.number} onChange={(v: string) => setFormData(p => ({...p, registration: {...p.registration, number: v}}))} icon={Hash} />
                          </div>
                      </div>
                      <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5">
                          <h4 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-4">Tassazione</h4>
                          <div className="flex items-center gap-4 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl group transition-all cursor-pointer" onClick={() => setFormData(p => ({...p, cedolareSecca: !p.cedolareSecca}))}>
                             <ShieldCheck className={`w-8 h-8 ${formData.cedolareSecca ? 'text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-slate-600'}`} />
                             <div className="flex-1">
                                <p className="text-sm font-black text-white uppercase tracking-tighter">Cedolare Secca</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{formData.cedolareSecca ? 'Regime Sostitutivo Attivo' : 'Tassazione Ordinaria'}</p>
                             </div>
                             <div className={`w-12 h-6 rounded-full relative transition-all ${formData.cedolareSecca ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.cedolareSecca ? 'left-7' : 'left-1'}`}></div>
                             </div>
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
