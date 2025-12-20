
import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, Sparkles, User, Key, Building2, Euro, Save, MessageSquare, ShieldCheck, Landmark, FileDigit, AlertTriangle } from 'lucide-react';
import { extractContractData } from '../services/geminiService';
import { Contract, ContractType, ContractAttachment, Party } from '../types';

const InputField = ({ label, value, onChange, type = "text", placeholder = "", required = false, isAlert = false }: any) => {
    const isEmpty = required && !value;
    return (
      <div className="space-y-2 w-full">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
              {label}
              {required && <span className={`px-1.5 py-0.5 rounded ml-2 ${isEmpty ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'}`}>{isEmpty ? 'OBBLIGATORIO' : 'OK'}</span>}
          </label>
          <div className="relative">
              <input 
                  type={type} 
                  value={value || ''} 
                  onChange={e => onChange(e.target.value)}
                  className={`w-full bg-[#020617] border rounded-xl p-3.5 font-medium placeholder-slate-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all ${isAlert ? 'hazard-alert text-rose-400' : isEmpty ? 'border-slate-800 text-white' : 'border-slate-800 text-white focus:border-primary-500'}`}
                  placeholder={placeholder}
              />
              {isAlert && <AlertTriangle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />}
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
    owners: [{ id: '1', name: '' }],
    tenantName: '',
    tenants: [{ id: '1', name: '' }],
    propertyAddress: '',
    usageType: '',
    annualRent: 0,
    deposit: 0,
    contractType: ContractType.ABITATIVO_LIBERO_4_4,
    startDate: '',
    cedolareSecca: false,
    isCanoneConcordato: false,
    cadastral: { foglio: '', particella: '', subalterno: '' },
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
        
        setFormData(prev => ({
          ...prev,
          ...data,
          usageType: data.usageType || "CARENZA DOCUMENTALE: Destinazione d'uso non rilevata",
          contractType: data.isCanoneConcordato ? ContractType.ABITATIVO_CONCORDATO_3_2 : prev.contractType,
          attachment: { fileName: file.name, mimeType: file.type, data: base64String }
        }));
        setStep('review');
      } catch (err) { 
          console.error(err); 
      } finally { 
          setIsProcessing(false); 
      }
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
      { id: 'anagrafica', label: 'Anagrafica' },
      { id: 'immobile', label: 'Dati Asset' },
      { id: 'economico', label: 'Economia' }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col">
      {step === 'upload' ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] p-20 border-slate-800 bg-slate-900/40 animate-scan">
          {isProcessing ? (
             <div className="text-center">
               <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
               <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Analisi Forense...</h3>
             </div>
          ) : (
             <>
               <div className="p-10 bg-slate-800 rounded-[2.5rem] mb-8 shadow-2xl border border-white/5"><Upload className="w-16 h-16 text-primary-500" /></div>
               <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Ingresso Dati</h3>
               <p className="text-slate-500 mb-10 text-center max-w-md font-medium uppercase text-xs tracking-widest">Trascina il PDF o clicca per avviare il protocollo IA.</p>
               <label className="cursor-pointer px-12 py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl">
                 Carica Contratto
                 <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
               </label>
             </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-white/5 rounded-[3rem] p-8 backdrop-blur-xl relative overflow-hidden hud-border">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <Sparkles className="w-8 h-8 text-primary-500" /> Intelligence Strategica
                </h2>
                <button onClick={onCancel} className="p-3 bg-slate-800 hover:bg-rose-600 rounded-2xl transition-all"><X className="w-6 h-6 text-white" /></button>
            </div>

            <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30 border-primary-500' : 'bg-slate-800/50 text-slate-500 border-white/5'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-10 scrollbar-hide">
                {activeTab === 'anagrafica' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6 bg-slate-950/50 p-8 rounded-[2rem] border border-white/5">
                            <InputField label="Indirizzo Asset" value={formData.propertyAddress} onChange={(v: string) => setFormData(p => ({...p, propertyAddress: v}))} required />
                            <InputField 
                                label="Destinazione d'Uso" 
                                value={formData.usageType} 
                                onChange={(v: string) => setFormData(p => ({...p, usageType: v}))} 
                                isAlert={formData.usageType?.includes('CARENZA')}
                                required 
                            />
                            {formData.usageType?.includes('CARENZA') && (
                                <div className="flex items-start gap-4 p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                                    <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                                    <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight">Rilevato rischio nullità: Uso non specificato nel contratto.</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-6 bg-slate-950/50 p-8 rounded-[2rem] border border-white/5">
                             <InputField label="Locatore" value={formData.ownerName} onChange={(v: string) => setFormData(p => ({...p, ownerName: v}))} required />
                             <InputField label="Conduttore" value={formData.tenantName} onChange={(v: string) => setFormData(p => ({...p, tenantName: v}))} required />
                        </div>
                    </div>
                )}
                {/* Altri tab seguono la stessa logica HUD... */}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex justify-end">
                <button onClick={() => onConfirmSave(formData, true)} className="px-12 py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 transition-all">
                    <Save className="w-6 h-6" /> Registra Asset
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default AddContract;
