
import React, { useState, useEffect, useMemo } from 'react';
import { Upload, X, FileText, AlertTriangle, Sparkles, User, Key, Building2, Calendar, Euro, FileCheck, Save, MessageSquare, Trash2, XCircle, Clock, ShieldCheck, Banknote, RefreshCw } from 'lucide-react';
import { extractContractData } from '../services/geminiService';
import { Contract, ContractType, ClientSide, ContractAttachment, Party } from '../types';
import { isCedolareActive } from '../utils/dateUtils';

// --- COMPONENTI UI ISOLATI ---
const InputField = ({ label, value, onChange, type = "text", placeholder = "", width = "w-full", required = false }: any) => {
    const isEmpty = required && !value;
    return (
      <div className={`space-y-2 ${width}`}>
          <label className="text-xs font-black text-white uppercase tracking-wider ml-1 flex justify-between shadow-black drop-shadow-md">
              {label}
              {required && <span className={`text-[10px] px-1.5 py-0.5 rounded ml-2 ${isEmpty ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-700 text-slate-300'}`}>{isEmpty ? 'MANCANTE' : 'OK'}</span>}
          </label>
          <input 
              type={type} 
              value={value || ''} 
              onChange={e => onChange(e.target.value)}
              className={`w-full bg-[#0f172a] border rounded-xl p-3.5 text-white font-medium placeholder-slate-500 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner ${isEmpty ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-600 focus:border-primary-500'}`}
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
  const [validationMsg, setValidationMsg] = useState<{type: 'error' | 'warning', text: string} | null>(null);
  const [attachment, setAttachment] = useState<ContractAttachment | null>(null);
  
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // --- STATO UNIFICATO ---
  const [formData, setFormData] = useState<Partial<Contract>>({
    clientSide: 'LOCATORE',
    contractType: ContractType.ABITATIVO_LIBERO_4_4,
    annualRent: 0,
    deposit: 0,
    noticeMonthsTenant: 6,
    noticeMonthsOwner: 6,
    cadastral: {},
    registration: {},
    driveLink: '',
    usageType: '',
    earlyTerminationDate: '',
    cedolareSecca: false 
  });

  const [expensesMode, setExpensesMode] = useState<'INCLUDED' | 'EXTRA'>('EXTRA');
  const [expensesAmount, setExpensesAmount] = useState<string>('');
  const [ownersList, setOwnersList] = useState<Party[]>([{ id: '1', name: '' }]);
  const [tenantsList, setTenantsList] = useState<Party[]>([{ id: '1', name: '' }]);

  // --- INIZIALIZZAZIONE ---
  useEffect(() => {
    if (initialData) {
        setStep('review');
        const safeCedolare = isCedolareActive(initialData.cedolareSecca);
        
        setFormData({
            ...initialData,
            cadastral: initialData.cadastral || {},
            registration: initialData.registration || {},
            driveLink: initialData.driveLink || '',
            earlyTerminationDate: initialData.earlyTerminationDate || '',
            cedolareSecca: safeCedolare
        });
        
        if (initialData.attachment) setAttachment(initialData.attachment);
        
        if (initialData.owners && initialData.owners.length > 0) setOwnersList(initialData.owners);
        else if (initialData.ownerName) setOwnersList([{ id: '1', name: initialData.ownerName, taxCode: initialData.ownerTaxCode, address: initialData.ownerAddress }]);
        
        if (initialData.tenants && initialData.tenants.length > 0) setTenantsList(initialData.tenants);
        else if (initialData.tenantName) setTenantsList([{ id: '1', name: initialData.tenantName, taxCode: initialData.tenantTaxCode, address: initialData.tenantAddress }]);
        
        if (initialData.expenses) {
            if (initialData.expenses.includes('INCLUSE')) setExpensesMode('INCLUDED');
            setExpensesAmount(initialData.expenses.split('[')[0].trim());
        }
    }
  }, [initialData]);

  // --- LOGICA BUSINESS ---
  const calculatedNextExpiration = useMemo(() => {
    if (!formData.startDate) return null;
    
    if (formData.earlyTerminationDate) {
        return { date: new Date(formData.earlyTerminationDate), isEarly: true, label: "Data Risoluzione (Chiusura)" };
    }

    const start = new Date(formData.startDate);
    const firstExp = formData.firstExpirationDate ? new Date(formData.firstExpirationDate) : null;
    const today = new Date();

    if (isNaN(start.getTime())) return null;

    let initialDuration = 4;
    let renewalDuration = 4;
    const cType = (formData.contractType || '').toLowerCase();

    if (cType.includes('3+2') || cType.includes('concordato')) {
        initialDuration = 3;
        renewalDuration = 2;
    } else if (cType.includes('6+6') || cType.includes('commerciale')) {
        initialDuration = 6;
        renewalDuration = 6;
    } else if (cType.includes('transitorio')) {
        initialDuration = 1;
        renewalDuration = 0; 
    }

    let cursorDate = firstExp && !isNaN(firstExp.getTime()) 
        ? firstExp 
        : new Date(start.getFullYear() + initialDuration, start.getMonth(), start.getDate());

    if (cursorDate > today) {
        return { date: cursorDate, isRenewal: false, label: "Prima Scadenza Naturale" };
    }

    let renewalCount = 0;
    let safetyCounter = 0;

    if (renewalDuration > 0) {
        while (cursorDate < today) {
            if (safetyCounter > 50) break;
            const nextDate = new Date(cursorDate.getFullYear() + renewalDuration, cursorDate.getMonth(), cursorDate.getDate());
            if (nextDate.getTime() === cursorDate.getTime()) break;
            cursorDate = nextDate;
            renewalCount++;
            safetyCounter++;
        }
        return { date: cursorDate, isRenewal: true, label: `Scadenza Rinnovo Successivo (+${renewalDuration} anni)`, renewalCount };
    }

    return { date: cursorDate, isRenewal: false, isExpired: true, label: "Contratto Scaduto" };
  }, [formData.startDate, formData.firstExpirationDate, formData.contractType, formData.earlyTerminationDate]);


  const tabs = [
    { id: 'general', label: 'Generale', icon: FileText },
    { id: 'parties', label: 'Soggetti', icon: User },
    { id: 'property', label: 'Immobile', icon: Building2 },
    { id: 'economics', label: 'Economico', icon: Euro },
    { id: 'dates', label: 'Durata & Disdette', icon: Calendar },
    { id: 'registration', label: 'Registrazione', icon: FileCheck },
  ];

  // --- EVENT HANDLERS ---
  const handleContractTypeChange = (newType: ContractType) => {
      setFormData(prev => ({ ...prev, contractType: newType }));
  };

  const handleUpdateKeyAndRetry = () => {
      if(newApiKey.length > 20) {
          localStorage.setItem('gemini_api_key', newApiKey);
          setNewApiKey('');
          setShowKeyInput(false);
          setValidationMsg(null);
          if (currentFile) processFile(currentFile);
      }
  };

  const processFile = async (file: File) => {
    if (file.size > 8291456) {
        setValidationMsg({ type: 'error', text: `File troppo grande (${(file.size / 1024 / 1024).toFixed(2)} MB).` });
        return;
    }

    setCurrentFile(file);
    setIsProcessing(true);
    setValidationMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        setAttachment({ fileName: file.name, mimeType: file.type, data: base64String });
        const data: any = await extractContractData(base64String, file.type);
        
        if (data.owners && Array.isArray(data.owners) && data.owners.length > 0) {
            setOwnersList(data.owners.map((o: any, i: number) => ({ id: Date.now().toString() + i, name: o.name || '', taxCode: o.taxCode || '', address: o.address || '' })));
        } else if (data.ownerName) {
            setOwnersList([{ id: Date.now().toString(), name: data.ownerName, taxCode: data.ownerTaxCode, address: data.ownerAddress }]);
        }

        if (data.tenants && Array.isArray(data.tenants) && data.tenants.length > 0) {
            setTenantsList(data.tenants.map((t: any, i: number) => ({ id: (Date.now() + 100 + i).toString(), name: t.name || '', taxCode: t.taxCode || '', address: t.address || '' })));
        } else if (data.tenantName) {
            setTenantsList([{ id: (Date.now() + 1).toString(), name: data.tenantName, taxCode: data.tenantTaxCode, address: data.tenantAddress }]);
        }

        setFormData(prev => ({
          ...prev,
          ...data,
          cedolareSecca: isCedolareActive(data.cedolareSecca),
          cadastral: data.cadastral || {},
          registration: data.registration || {},
        }));
        setStep('review');
      } catch (err: any) {
        setValidationMsg({ type: 'error', text: err.message || "Errore IA." });
        if (err.message.includes('429')) setShowKeyInput(true);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const executeSave = (openAi: boolean = false) => {
    const validOwners = ownersList.filter(o => o.name.trim() !== '');
    const validTenants = tenantsList.filter(t => t.name.trim() !== '');

    const newContract: Contract = {
      ...formData as Contract,
      ownerName: validOwners[0]?.name || "Da Compilare",
      tenantName: validTenants[0]?.name || "Da Compilare",
      owners: validOwners,
      tenants: validTenants,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      isActive: true,
      attachment: attachment || undefined,
      cedolareSecca: !!formData.cedolareSecca 
    };
    
    onConfirmSave(newContract, openAi);
  };

  const addParty = (type: 'OWNER' | 'TENANT') => {
    const newParty: Party = { id: Date.now().toString(), name: '' };
    if (type === 'OWNER') setOwnersList(prev => [...prev, newParty]);
    else setTenantsList(prev => [...prev, newParty]);
  };

  const removeParty = (type: 'OWNER' | 'TENANT', id: string) => {
    if (type === 'OWNER' ? ownersList.length > 1 : tenantsList.length > 1) {
        if (type === 'OWNER') setOwnersList(prev => prev.filter(p => p.id !== id));
        else setTenantsList(prev => prev.filter(p => p.id !== id));
    }
  };

  const updateParty = (type: 'OWNER' | 'TENANT', id: string, field: string, value: string) => {
    if (type === 'OWNER') setOwnersList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    else setTenantsList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const renderUploadStep = () => (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-500 p-6 relative">
      <div 
        className={`w-full max-w-2xl bg-slate-900 border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 relative group
            ${isDragging ? 'border-primary-500 bg-primary-900/10 scale-105 shadow-2xl shadow-primary-500/20' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}
        `}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
      >
          <button onClick={onCancel} className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-full transition-colors z-[50]"><X className="w-6 h-6" /></button>
          {isProcessing ? (
              <div className="py-12 flex flex-col items-center relative z-10">
                  <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary-400 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Analisi IA in corso...</h3>
                  <p className="text-slate-400 font-medium">Estrazione parametri fiscali e contrattuali.</p>
              </div>
          ) : (
              <>
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-xl">
                    <Upload className="w-8 h-8 text-slate-300 group-hover:text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Ingestione Documentale</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">Carica PDF o Immagine. L'IA di LocaMaster rileverà automaticamente se si tratta di <b>Cedolare Secca</b> o Regime Ordinario.</p>
                {validationMsg && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-950/30 text-rose-300 border border-rose-900 flex flex-col items-start gap-3 text-left">
                        <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium">{validationMsg.text}</p></div>
                        {showKeyInput && (
                            <div className="w-full mt-2 pt-3 border-t border-rose-800/50">
                                <input type="text" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="Inserisci Nuova API KEY Gemini..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 outline-none mb-2" />
                                <button onClick={handleUpdateKeyAndRetry} disabled={newApiKey.length < 20} className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2"><RefreshCw className="w-3 h-3" /> Aggiorna & Riprova</button>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <label className="cursor-pointer px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2">
                        <Upload className="w-5 h-5" /> Carica File
                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => { if(e.target.files?.[0]) processFile(e.target.files[0]); }} />
                    </label>
                    <button onClick={() => setStep('review')} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 hover:border-slate-500 flex items-center justify-center gap-2"><FileText className="w-5 h-5" /> Inserimento Manuale</button>
                </div>
              </>
          )}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="flex flex-col min-h-full">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary-400" /> {initialData ? 'Revisione Pratica' : 'Configurazione Missione'}</h2>
                <p className="text-slate-300 text-sm mt-1">Valida i dati estratti dall'IA e configura il regime fiscale.</p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 transition-colors"><X className="w-6 h-6"/></button>
        </div>

        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 sticky top-0 bg-slate-900 z-10 pt-2 border-b border-slate-800/50">
            {tabs.map(t => (
                <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${activeTab === t.id ? 'bg-primary-600 text-white border-primary-500 shadow-primary-900/40' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
                >
                    <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-white' : 'text-slate-500'}`} />
                    {t.label}
                </button>
            ))}
        </div>

        <div className="space-y-6 pb-32">
            {activeTab === 'general' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    {/* SELETTORE REGIME FISCALE - NUOVO DESIGN HIGH IMPACT */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Configurazione Regime Fiscale</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => setFormData(prev => ({...prev, cedolareSecca: true}))}
                                className={`relative p-6 rounded-[2rem] border-2 text-left transition-all duration-500 group overflow-hidden ${formData.cedolareSecca ? 'bg-emerald-600/10 border-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-900 border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl transition-all duration-500 ${formData.cedolareSecca ? 'bg-emerald-500 text-white scale-110 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    {formData.cedolareSecca && <div className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-lg">MODALITÀ ATTIVA</div>}
                                </div>
                                <h4 className={`text-xl font-black tracking-tight mb-2 ${formData.cedolareSecca ? 'text-emerald-400' : 'text-slate-300'}`}>Cedolare Secca</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">Esente da imposta di registro e bolli. Aliquota fissa agevolata (10% o 21%). <b>Nessuna scadenza F24 annuale.</b></p>
                                {formData.cedolareSecca && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>}
                            </button>

                            <button 
                                onClick={() => setFormData(prev => ({...prev, cedolareSecca: false}))}
                                className={`relative p-6 rounded-[2rem] border-2 text-left transition-all duration-500 group overflow-hidden ${!formData.cedolareSecca ? 'bg-indigo-600/10 border-indigo-500 ring-4 ring-indigo-500/20' : 'bg-slate-900 border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl transition-all duration-500 ${!formData.cedolareSecca ? 'bg-indigo-500 text-white scale-110 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                                        <Banknote className="w-6 h-6" />
                                    </div>
                                    {!formData.cedolareSecca && <div className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black rounded-full shadow-lg">MODALITÀ ATTIVA</div>}
                                </div>
                                <h4 className={`text-xl font-black tracking-tight mb-2 ${!formData.cedolareSecca ? 'text-indigo-400' : 'text-slate-300'}`}>Regime Ordinario</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">Imposta di Registro (2% o 1%) dovuta ogni anno. Marca da bollo richiesta. <b>Scadenze F24 annuali generate.</b></p>
                                {!formData.cedolareSecca && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 shadow-xl">
                        <label className="text-xs font-black text-white uppercase tracking-wider block mb-4">Ruolo della Pratica</label>
                        <div className="flex gap-4">
                            {['LOCATORE', 'CONDUTTORE'].map((side) => (
                                <label key={side} className={`flex-1 cursor-pointer group`}>
                                    <input type="radio" name="clientSide" value={side} checked={formData.clientSide === side} onChange={() => setFormData(prev => ({...prev, clientSide: side as ClientSide}))} className="peer hidden" />
                                    <div className="p-5 rounded-xl border-2 border-slate-800 bg-slate-900 peer-checked:border-primary-500 peer-checked:bg-primary-500/10 peer-checked:text-primary-400 text-slate-400 flex flex-col items-center justify-center gap-2 transition-all hover:bg-slate-950 hover:text-white">
                                        {side === 'LOCATORE' ? <Key className="w-6 h-6 mb-1" /> : <User className="w-6 h-6 mb-1" />}
                                        <span className="font-black text-xs uppercase tracking-widest">{side}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <label className="text-xs font-black text-white uppercase tracking-wider ml-1">Tipologia Contratto</label>
                             <select value={formData.contractType} onChange={e => handleContractTypeChange(e.target.value as ContractType)} className="w-full bg-[#0f172a] border border-slate-600 rounded-xl p-3.5 text-white font-bold outline-none shadow-sm transition-all focus:border-primary-500">
                                {Object.values(ContractType).map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                        </div>
                        <InputField label="Destinazione d'uso" value={formData.usageType} onChange={(v: string) => setFormData(prev => ({...prev, usageType: v}))} placeholder="Es. Abitativo A/2" />
                    </div>
                </div>
            )}
            
            {activeTab === 'parties' && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2"><h3 className="text-white font-bold text-lg flex items-center gap-2"><Key className="w-5 h-5 text-emerald-400"/> Proprietari</h3><button onClick={() => addParty('OWNER')} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all">+ Aggiungi</button></div>
                        {ownersList.map((owner, index) => (
                            <div key={owner.id} className="relative bg-slate-900 rounded-xl p-5 border border-slate-800 animate-in zoom-in-95">
                                {ownersList.length > 1 && <button onClick={() => removeParty('OWNER', owner.id)} className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2"><InputField label="Nome / Ragione Sociale" value={owner.name} onChange={(v: string) => updateParty('OWNER', owner.id, 'name', v)} required={index === 0} /></div>
                                    <InputField label="Codice Fiscale" value={owner.taxCode} onChange={(v: string) => updateParty('OWNER', owner.id, 'taxCode', v)} />
                                    <InputField label="Residenza" value={owner.address} onChange={(v: string) => updateParty('OWNER', owner.id, 'address', v)} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2"><h3 className="text-white font-bold text-lg flex items-center gap-2"><User className="w-5 h-5 text-blue-400"/> Inquilini</h3><button onClick={() => addParty('TENANT')} className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all">+ Aggiungi</button></div>
                        {tenantsList.map((tenant, index) => (
                            <div key={tenant.id} className="relative bg-slate-900 rounded-xl p-5 border border-slate-800 animate-in zoom-in-95">
                                {tenantsList.length > 1 && <button onClick={() => removeParty('TENANT', tenant.id)} className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2"><InputField label="Nome / Ragione Sociale" value={tenant.name} onChange={(v: string) => updateParty('TENANT', tenant.id, 'name', v)} required={index === 0} /></div>
                                    <InputField label="Codice Fiscale" value={tenant.taxCode} onChange={(v: string) => updateParty('TENANT', tenant.id, 'taxCode', v)} />
                                    <InputField label="Residenza" value={tenant.address} onChange={(v: string) => updateParty('TENANT', tenant.id, 'address', v)} />
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            {activeTab === 'economics' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Canone Annuo (€)" type="number" value={formData.annualRent} onChange={(v: any) => setFormData(prev => ({...prev, annualRent: Number(v)}))} />
                        <InputField label="Deposito Cauzionale (€)" type="number" value={formData.deposit} onChange={(v: any) => setFormData(prev => ({...prev, deposit: Number(v)}))} />
                     </div>
                     <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
                        <div className="flex items-center justify-between"><label className="text-xs font-black text-white uppercase tracking-wider">Spese Condominiali</label><div className="flex bg-slate-900 rounded-lg border border-slate-700 p-1"><button onClick={() => setExpensesMode('EXTRA')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${expensesMode === 'EXTRA' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>A parte</button><button onClick={() => setExpensesMode('INCLUDED')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${expensesMode === 'INCLUDED' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Incluse</button></div></div>
                        <input type="text" value={expensesAmount} onChange={(e) => setExpensesAmount(e.target.value)} placeholder="Importo o descrizione spese..." className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3.5 text-white outline-none focus:border-primary-500 transition-all" />
                     </div>
                </div>
            )}

            {activeTab === 'dates' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                         <h3 className="text-slate-300 font-bold mb-6 text-sm uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4 text-primary-400" /> Cronologia Ciclo di Vita</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                            <InputField label="Decorrenza (Inizio)" type="date" value={formData.startDate} onChange={(v: string) => setFormData(prev => ({...prev, startDate: v}))} required={true} />
                            <InputField label="Prima Scadenza" type="date" value={formData.firstExpirationDate} onChange={(v: string) => setFormData(prev => ({...prev, firstExpirationDate: v}))} />
                        </div>
                        {calculatedNextExpiration && (
                           <div className="mt-8 p-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative z-10 shadow-xl shadow-indigo-900/40">
                               <div className="bg-slate-900 rounded-xl p-5 flex items-center justify-between gap-4">
                                   <div className="flex items-center gap-4">
                                       <div className={`p-3 rounded-full ${calculatedNextExpiration.isExpired ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}><Clock className="w-6 h-6" /></div>
                                       <div>
                                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">{calculatedNextExpiration.label}</p>
                                           <p className="text-2xl font-black text-white">{calculatedNextExpiration.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                       </div>
                                   </div>
                               </div>
                           </div>
                        )}
                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <div className="bg-rose-950/20 border border-rose-900/50 p-5 rounded-2xl">
                                <h3 className="text-rose-400 font-bold mb-3 text-sm uppercase tracking-wider flex items-center gap-2"><XCircle className="w-4 h-4"/> Risoluzione Anticipata</h3>
                                <InputField label="Data Rilascio Immobili (Fine Effettiva)" type="date" value={formData.earlyTerminationDate} onChange={(v: string) => setFormData(prev => ({...prev, earlyTerminationDate: v}))} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 -mx-6 -mb-6 md:-mx-8 md:-mb-8 mt-auto z-30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
             <div className="flex gap-4 w-full sm:w-auto justify-end ml-auto">
                 <button onClick={onCancel} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border border-slate-700">Abbandona</button>
                 <button onClick={() => executeSave(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-500/30 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg"><MessageSquare className="w-4 h-4" /> Salva & Analizza</button>
                 <button onClick={() => executeSave(false)} className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary-900/30 transition-all hover:scale-[1.02] active:scale-95"><Save className="w-5 h-5" /> Registra Pratica</button>
             </div>
        </div>
    </div>
  );
  
  return (
    <div className="w-full max-w-6xl mx-auto h-full">{step === 'upload' ? renderUploadStep() : renderReviewStep()}</div>
  );
};

export default AddContract;
