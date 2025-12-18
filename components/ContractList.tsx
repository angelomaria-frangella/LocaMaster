
import React, { useState, useRef, useEffect } from 'react';
import { Contract } from '../types';
import { Search, MoreHorizontal, Building2, Plus, Sparkles, Download, Trash2, Edit, X, Clock, ShieldCheck, Banknote } from 'lucide-react';
import { isCedolareActive } from '../utils/dateUtils';

interface ContractListProps {
  contracts: Contract[];
  onAddContract: () => void;
  onOpenAI: (contract: Contract) => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
}

const ContractList: React.FC<ContractListProps> = ({ contracts, onAddContract, onOpenAI, onEditContract, onDeleteContract }) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDownloadAttachment = (contract: Contract, e: React.MouseEvent) => {
    e.stopPropagation();
    if (contract.driveLink) { window.open(contract.driveLink, '_blank'); return; }
    if (contract.attachment) {
        const link = document.createElement('a');
        link.href = `data:${contract.attachment.mimeType};base64,${contract.attachment.data}`;
        link.download = contract.attachment.fileName;
        link.click();
    }
  };

  const getProgress = (startDate: string) => {
      const start = new Date(startDate);
      const today = new Date();
      if (isNaN(start.getTime())) return 0;
      const diffMonths = (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth();
      const progress = Math.min(100, Math.max(0, (diffMonths / 48) * 100)); // Assumiamo 4 anni come base
      return progress;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" />

      {selectedContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90" onClick={() => setSelectedContract(null)}>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedContract(null)} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400"><X className="w-6 h-6" /></button>
                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-white">{selectedContract.propertyAddress}</h2>
                    {isCedolareActive(selectedContract.cedolareSecca) ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-black uppercase tracking-tighter shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <ShieldCheck className="w-3.5 h-3.5" /> Cedolare Secca
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-xs font-black uppercase tracking-tighter shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <Banknote className="w-3.5 h-3.5" /> Regime Ordinario
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase mb-1">Locatore</p>
                        <p className="text-white font-bold">{selectedContract.ownerName}</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase mb-1">Conduttore</p>
                        <p className="text-white font-bold">{selectedContract.tenantName}</p>
                    </div>
                </div>
                <div className="p-6 bg-primary-600/10 border border-primary-500/20 rounded-2xl mb-8">
                    <h3 className="text-primary-400 font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> Timeline Ciclo di Vita</h3>
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-primary-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${getProgress(selectedContract.startDate)}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-500 uppercase">
                        <span>Inizio ({new Date(selectedContract.startDate).getFullYear()})</span>
                        <span className="text-primary-400">Oggi</span>
                        <span>Scadenza ({new Date(selectedContract.startDate).getFullYear() + 4})</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => onEditContract(selectedContract)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Modifica Dati</button>
                    <button onClick={() => { setSelectedContract(null); onOpenAI(selectedContract); }} className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-colors">Chiedi all'IA</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-white">Gestione Contratti</h2><p className="text-slate-400">Archivio pratiche e locazioni attive.</p></div>
        <div className="flex gap-2">
            <button onClick={onAddContract} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-primary-600/20"><Plus className="w-5 h-5" /> Nuovo</button>
            <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" /><input type="text" placeholder="Cerca..." className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 outline-none w-64" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {contracts.map((contract) => {
            const hasCedolare = isCedolareActive(contract.cedolareSecca);
            return (
                <div key={contract.id} onClick={() => setSelectedContract(contract)} className="group relative bg-slate-900 border border-slate-700 hover:border-primary-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col h-full cursor-pointer overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${hasCedolare ? 'from-emerald-500/10' : 'from-indigo-500/10'} to-transparent blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center transition-all ${hasCedolare ? 'group-hover:bg-emerald-600' : 'group-hover:bg-indigo-600'} text-white shadow-lg`}>
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white leading-tight truncate max-w-[150px]">{contract.propertyAddress}</h3>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{contract.contractType}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === contract.id ? null : contract.id); }} className="p-1 text-slate-500 hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                            {hasCedolare ? (
                                <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg shadow-lg">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            ) : (
                                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg shadow-lg">
                                    <Banknote className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Stato Ciclo Vita</span>
                            <span className="text-[10px] font-bold text-primary-400">{Math.round(getProgress(contract.startDate))}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary-600 to-indigo-500" style={{ width: `${getProgress(contract.startDate)}%` }}></div>
                        </div>
                    </div>
                    
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Locatore</span><span className="text-slate-200 font-bold">{contract.ownerName}</span></div>
                        <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Conduttore</span><span className="text-slate-200 font-bold">{contract.tenantName}</span></div>
                        <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Canone</span><span className="text-white font-black">€ {contract.annualRent.toLocaleString('it-IT')}</span></div>
                    </div>

                    <div className="mt-6 flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onOpenAI(contract); }} className="flex-1 py-2.5 bg-slate-800 hover:bg-primary-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-primary-500 shadow-lg"><Sparkles className="w-3.5 h-3.5" /> Analisi AI</button>
                        <button onClick={(e) => handleDownloadAttachment(contract, e)} className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg"><Download className="w-4 h-4" /></button>
                    </div>

                    {activeMenuId === contract.id && (
                        <div className="absolute right-6 top-16 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-20 py-2 w-48 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <button onClick={() => onEditContract(contract)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-900 flex items-center gap-2"><Edit className="w-4 h-4" /> Modifica</button>
                            <button onClick={() => onDeleteContract(contract.id)} className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-950 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Elimina</button>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ContractList;
