
import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, Sparkles, User, Key, Building2, Euro, FileCheck, Save, MessageSquare, ShieldCheck, Landmark, FileDigit } from 'lucide-react';
import { extractContractData } from '../services/geminiService';
import { Contract, ContractType, ContractAttachment, Party } from '../types';

const InputField = ({ label, value, onChange, type = "text", placeholder = "", required = false }: any) => {
    const isEmpty = required && !value;
    return (
      <div className="space-y-2 w-full">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
              {label}
              {required && <span className={`px-1.5 py-0.5 rounded ml-2 ${isEmpty ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'}`}>{isEmpty ? 'RICHIESTO' : 'OK'}</span>}
          </label>
          <input 
              type={type} 
              value={value || ''} 
              onChange={e => onChange(e.target.value)}
              className={`w-full bg-[#020617] border rounded-xl p-3.5 text-white font-medium placeholder-slate-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all ${isEmpty ? 'border-rose-500/50' : 'border-slate-800 focus:border-primary-500'}`}
              placeholder={placeholder}
          />
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
  const [activeTab, setActiveTab] = useState('general');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachment, setAttachment] = useState<ContractAttachment | null>(null);
  
  // Inizializzazione esplicita per evitare errori di proprietà mancanti
  const [formData, setFormData] = useState<Contract>({
    id: initialData?.id || '',
    isActive: true,
    clientSide: 'LOCATORE',
    ownerName: '',
    owners: [{ id: '1', name: '' }],
    tenantName: '',
    tenants: [{ id: '1', name: '' }],
    propertyAddress: '',
    annualRent: 0,
    deposit: 0,
    expenses: '',
    contractType: ContractType.ABITATIVO_LIBERO_4_4,
    startDate: '',
    cedolareSecca: false,
    isCanoneConcordato: false,
    cadastral: { foglio: '', particella: '', subalterno: '', categoria: '', rendita: 0 },
    registration: { date: '', office: '', series: '', number: '' }
  });

  const [ownersList, setOwnersList] = useState<Party[]>([]);
  const [tenantsList, setTenantsList] = useState<Party[]>([]);

  useEffect(() => {
    if (initialData) {
        setStep('review');
        setFormData({ ...initialData });
        if (initialData.attachment) setAttachment(initialData.attachment);
        setOwnersList(initialData.owners || [{ id: '1', name: '' }]);
        setTenantsList(initialData.tenants || [{ id: '1', name: '' }]);
    } else {
        setOwnersList([{ id: '1', name: '' }]);
        setTenantsList([{ id: '1', name: '' }]);
    }
  }, [initialData]);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        setAttachment({ fileName: file.name, mimeType: file.type, data: base64String });
        const data: any = await extractContractData(base64String, file.type);
        
        if (data.owners) setOwnersList(data.owners.map((o: any, i: number) => ({ id: (Date.now() + i).toString(), ...o })));
        if (data.tenants) setTenantsList(data.tenants.map((t: any, i: number) => ({ id: (Date.now() + 10 + i).toString(), ...t })));

        setFormData(prev => ({
          ...prev,
          ...data,
          cadastral: { ...prev.cadastral, ...(data.cadastral || {}) },
          registration: { ...prev.registration, ...(data.registration || {}) },
          contractType: data.isCanoneConcordato ? ContractType.ABITATIVO_CONCORDATO_3_2 : (data.contractType || prev.contractType)
        }));
        setStep('review');
      } catch (err) {
        console.error("AI Analysis error", err);
      } finally { setIsProcessing(false); }
    };
    reader.readAsDataURL(file);
  };

  const executeSave = (openAi: boolean = false) => {
    const finalContract: Contract = {
      ...formData,
      ownerName: ownersList[0]?.name || "Da Compilare",
      tenantName: tenantsList[0]?.name || "Da Compilare",
      owners: ownersList,
      tenants: tenantsList,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      attachment: attachment || undefined
    };
    onConfirmSave(finalContract, openAi);
  };

  const tabs = [
    { id: 'general', label: 'Generale', icon: FileText },
    { id: 'parties', label: 'Soggetti', icon: User },
    { id: 'property', label: 'Immobile', icon: Building2 },
    { id: 'economics', label: 'Economico', icon: Euro },
    { id: 'registration', label: 'Registrazione', icon: FileDigit },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col">
      {step === 'upload' ? (
        <div 
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] p-20 transition-all ${isDragging ? 'border-primary-500 bg-primary-950/20' : 'border-slate-800 bg-slate-900/40'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
        >
          {isProcessing ? (
             <div className="text-center">
               <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
               <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Analisi Forense in corso...</h3>
               <p className="text-slate-400 mt-4 text-lg">Sto estraendo concordato, catastali, registrazione, deposito e spese.</p>
             </div>
          ) : (
             <>
               <div className="p-10 bg-slate-800 rounded-[2.5rem] mb-8 shadow-2xl"><Upload className="w-16 h-16 text-primary-500" /></div>
               <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Ingestione Documentale</h3>
               <p className="text-slate-400 text-xl mb-12 max-w-md text-center">Carica il PDF. L'IA rileverà automaticamente se è <b>Canone Concordato</b> e i <b>Dati Catastali</b>.</p>
               <label className="cursor-pointer px-12 py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95">
                 Seleziona File
                 <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
               </label>
               <button onClick={() => setStep('review')} className="mt-6 text-slate-500 hover:text-white font-bold text-sm uppercase tracking-widest">Inserimento Manuale</button>
             </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60 border border-white/5 rounded-[3rem] p-8 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Sparkles className="w-8 h-8 text-primary-500" /> Revisione Intelligence Asset
                    </h2>
                    {formData.isCanoneConcordato && (
                        <div className="mt-2 flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-4 h-4" /> Vantaggio Fiscale Rilevato: Canone Concordato
                        </div>
                    )}
                </div>
                <button onClick={onCancel} className="p-3 bg-slate-800 hover:bg-rose-600 rounded-2xl transition-all"><X className="w-6 h-6 text-white" /></button>
            </div>

            <div className="flex gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all border ${activeTab === t.id ? 'bg-primary-600 border-primary-500 text-white shadow-xl shadow-primary-600/30' : 'bg-slate-800/50 border-white/5 text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    >
                        <t.icon className="w-5 h-5" /> {t.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-10 scrollbar-hide">
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4">
                        <div className="space-y-6 bg-slate-950/50 p-8 rounded-[2rem] border border-white/5">
                            <InputField label="Indirizzo Immobile" value={formData.propertyAddress} onChange={(v: string) => setFormData(p => ({...p, propertyAddress: v}))} required />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Regime Fiscale</label>
                                    <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
                                        <button onClick={() => setFormData(p => ({...p, cedolareSecca: true}))} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${formData.cedolareSecca ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Cedolare</button>
                                        <button onClick={() => setFormData(p => ({...p, cedolareSecca: false}))} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!formData.cedolareSecca ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Ordinario</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo Canone</label>
                                    <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
                                        <button onClick={() => setFormData(p => ({...p, isCanoneConcordato: true}))} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${formData.isCanoneConcordato ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500'}`}>Concordato</button>
                                        <button onClick={() => setFormData(p => ({...p, isCanoneConcordato: false}))} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!formData.isCanoneConcordato ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Libero</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 bg-slate-950/50 p-8 rounded-[2rem] border border-white/5">
                             <InputField label="Data Inizio" type="date" value={formData.startDate} onChange={(v: string) => setFormData(p => ({...p, startDate: v}))} required />
                             <InputField label="Uso" value={formData.usageType} onChange={(v: string) => setFormData(p => ({...p, usageType: v}))} placeholder="Es. Abitativo A/2" />
                        </div>
                    </div>
                )}

                {activeTab === 'property' && (
                    <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5 space-y-8 animate-in slide-in-from-right-4">
                        <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3"><Landmark className="w-6 h-6 text-primary-500" /> Dati Catastali</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <InputField label="Foglio" value={formData.cadastral?.foglio} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, foglio: v}}))} />
                            <InputField label="Particella" value={formData.cadastral?.particella} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, particella: v}}))} />
                            <InputField label="Subalterno" value={formData.cadastral?.subalterno} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, subalterno: v}}))} />
                            <InputField label="Cat." value={formData.cadastral?.categoria} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, categoria: v}}))} />
                            <InputField label="Rendita (€)" type="number" value={formData.cadastral?.rendita} onChange={(v: string) => setFormData(p => ({...p, cadastral: {...p.cadastral, rendita: Number(v)}}))} />
                        </div>
                    </div>
                )}

                {activeTab === 'economics' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-right-4">
                         <InputField label="Canone Annuo (€)" type="number" value={formData.annualRent} onChange={(v: string) => setFormData(p => ({...p, annualRent: Number(v)}))} required />
                         <InputField label="Deposito (€)" type="number" value={formData.deposit} onChange={(v: string) => setFormData(p => ({...p, deposit: Number(v)}))} />
                         <InputField label="Spese" value={formData.expenses} onChange={(v: string) => setFormData(p => ({...p, expenses: v}))} />
                    </div>
                )}

                {activeTab === 'registration' && (
                    <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5 space-y-8 animate-in slide-in-from-right-4">
                        <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3"><FileDigit className="w-6 h-6 text-emerald-500" /> Dati di Registrazione</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <InputField label="Data Reg." type="date" value={formData.registration?.date} onChange={(v: string) => setFormData(p => ({...p, registration: {...p.registration, date: v}}))} />
                            <InputField label="Ufficio" value={formData.registration?.office} onChange={(v: string) => setFormData(p => ({...p, registration: {...p.registration, office: v}}))} />
                            <InputField label="Serie" value={formData.registration?.series} onChange={(v: string) => setFormData(p => ({...p, registration: {...p.registration, series: v}}))} />
                            <InputField label="Numero" value={formData.registration?.number} onChange={(v: string) => setFormData(p => ({...p, registration: {...p.registration, number: v}}))} />
                        </div>
                    </div>
                )}

                {activeTab === 'parties' && (
                    <div className="space-y-12 animate-in slide-in-from-right-4">
                        <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5 space-y-6">
                            <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3"><Key className="w-6 h-6 text-emerald-500" /> Proprietari</h3>
                            {ownersList.map((o, i) => (
                                <div key={o.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                                    <InputField label="Nome" value={o.name} onChange={(v: string) => setOwnersList(p => p.map(item => item.id === o.id ? {...item, name: v} : item))} required={i===0} />
                                    <InputField label="Codice Fiscale" value={o.taxCode} onChange={(v: string) => setOwnersList(p => p.map(item => item.id === o.id ? {...item, taxCode: v} : item))} />
                                    <InputField label="Indirizzo" value={o.address} onChange={(v: string) => setOwnersList(p => p.map(item => item.id === o.id ? {...item, address: v} : item))} />
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5 space-y-6">
                            <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3"><User className="w-6 h-6 text-primary-500" /> Inquilini</h3>
                            {tenantsList.map((t, i) => (
                                <div key={t.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                                    <InputField label="Nome" value={t.name} onChange={(v: string) => setTenantsList(p => p.map(item => item.id === t.id ? {...item, name: v} : item))} required={i===0} />
                                    <InputField label="Codice Fiscale" value={t.taxCode} onChange={(v: string) => setTenantsList(p => p.map(item => item.id === t.id ? {...item, taxCode: v} : item))} />
                                    <InputField label="Indirizzo" value={t.address} onChange={(v: string) => setTenantsList(p => p.map(item => item.id === t.id ? {...item, address: v} : item))} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-end">
                <button onClick={() => executeSave(true)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-slate-700 hover:border-primary-500"><MessageSquare className="w-5 h-5" /> Salva & IA</button>
                <button onClick={() => executeSave(false)} className="px-12 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"><Save className="w-5 h-5" /> Registra Asset</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default AddContract;
