
import React, { useState, useRef, useEffect } from 'react';
import { Contract } from '../types';
import { Search, MoreHorizontal, Building2, Plus, Sparkles, Trash2, Edit, X, ShieldCheck, Banknote, User, MapPin } from 'lucide-react';
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

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // IDENTIFICAZIONE CLIENTE: Restituisce il nome della parte assistita dallo studio
  const getClientDisplayName = (c: Contract) => {
    if (c.clientSide === 'LOCATORE') {
        return c.ownerName || (c.owners && c.owners.length > 0 ? c.owners[0].name : 'Cliente Ignoto');
    } else {
        return c.tenantName || (c.tenants && c.tenants.length > 0 ? c.tenants[0].name : 'Cliente Ignoto');
    }
  };

  const getCounterpartyDisplay = (c: Contract) => {
    if (c.clientSide === 'LOCATORE') {
        return c.tenantName || (c.tenants && c.tenants.length > 0 ? c.tenants[0].name : 'N/A');
    } else {
        return c.ownerName || (c.owners && c.owners.length > 0 ? c.owners[0].name : 'N/A');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {selectedContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 animate-in zoom-in duration-200" onClick={() => setSelectedContract(null)}>
            <div className="bg-slate-900 border border-slate-700 rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedContract(null)} className="absolute top-8 right-8 p-3 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 transition-all"><X className="w-6 h-6" /></button>
                
                <div className="mb-10">
                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em] block mb-2">Pratica Assistita</span>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-tight">{getClientDisplayName(selectedContract)}</h2>
                    <div className="flex items-center gap-2 mt-4 text-slate-400 font-medium italic">
                        <MapPin className="w-4 h-4" /> {selectedContract.propertyAddress}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className={`p-6 rounded-2xl border ${isCedolareActive(selectedContract.cedolareSecca) ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-950 border-slate-800'}`}>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Regime Fiscale</p>
                        <div className="flex items-center gap-2">
                           {isCedolareActive(selectedContract.cedolareSecca) ? (
                               <>
                                 <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                 <span className="text-emerald-400 font-black text-sm uppercase italic">Cedolare Secca Attiva</span>
                               </>
                           ) : (
                               <>
                                 <Banknote className="w-5 h-5 text-indigo-400" />
                                 <span className="text-indigo-400 font-black text-sm uppercase italic">Regime Ordinario IRPEF</span>
                               </>
                           )}
                        </div>
                    </div>
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Tipologia Contratto</p>
                        <p className="text-white font-bold">{selectedContract.contractType}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-10">
                   <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800 flex justify-between items-center">
                       <div>
                           <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Controparte Locatizia</p>
                           <p className="text-white font-bold">{getCounterpartyDisplay(selectedContract)}</p>
                       </div>
                       <User className="w-5 h-5 text-slate-700" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800">
                           <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Inizio / Decorrenza</p>
                           <p className="text-white font-black">{selectedContract.startDate || '--'}</p>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800">
                           <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Canone Annuo</p>
                           <p className="text-white font-black italic">€ {selectedContract.annualRent.toLocaleString('it-IT')}</p>
                        </div>
                   </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => onEditContract(selectedContract)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/5">Modifica Pratica</button>
                    <button onClick={() => { setSelectedContract(null); onOpenAI(selectedContract); }} className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-600/20 transition-all flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> Consulenza IA Professional
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Anagrafica Assistiti</h2>
           <p className="text-slate-400">Archivio centralizzato Studio Commercialista.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={onAddContract} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-600/20 transition-all"><Plus className="w-5 h-5" /> Nuova Pratica</button>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Cerca cliente o immobile..." className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none w-64 focus:border-primary-500 transition-colors" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {contracts.map((contract) => {
            const hasCedolare = isCedolareActive(contract.cedolareSecca);
            const clientName = getClientDisplayName(contract);
            
            return (
                <div key={contract.id} onClick={() => setSelectedContract(contract)} className={`group relative bg-slate-900 border ${hasCedolare ? 'cedolare-glow border-emerald-500/50' : 'border-slate-700'} hover:border-primary-500/50 rounded-[2rem] p-8 transition-all duration-500 shadow-xl flex flex-col h-full cursor-pointer overflow-hidden`}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl ${hasCedolare ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800'} flex items-center justify-center text-white transition-all`}>
                                <User className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-white text-xl italic uppercase tracking-tighter leading-tight truncate">{clientName}</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <MapPin className="w-3 h-3 text-slate-600" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[150px]">{contract.propertyAddress}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === contract.id ? null : contract.id); }} className="p-2 text-slate-500 hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Tipologia</span>
                            <span className="text-white font-bold text-xs truncate max-w-[150px]">{contract.contractType}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Opzione Fiscale</span>
                           {hasCedolare ? (
                               <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase rounded-full border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-1">
                                 <Sparkles className="w-2.5 h-2.5" /> Cedolare Secca
                               </span>
                           ) : (
                               <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[9px] font-black uppercase rounded-full border border-slate-700">Regime Ordinario</span>
                           )}
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Canone Annuo</span>
                           <span className="text-white font-black italic text-sm">€ {contract.annualRent.toLocaleString('it-IT')}</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={(e) => { e.stopPropagation(); onOpenAI(contract); }} className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"><Sparkles className="w-4 h-4" /> Analisi IA</button>
                    </div>

                    {activeMenuId === contract.id && (
                        <div className="absolute right-8 top-20 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-20 py-3 w-56 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { onEditContract(contract); setActiveMenuId(null); }} className="w-full text-left px-5 py-3 text-sm text-slate-300 hover:bg-slate-900 flex items-center gap-3 transition-colors"><Edit className="w-4 h-4" /> Modifica Pratica</button>
                            <button onClick={() => { onDeleteContract(contract.id); setActiveMenuId(null); }} className="w-full text-left px-5 py-3 text-sm text-rose-400 hover:bg-rose-950 flex items-center gap-3 transition-colors"><Trash2 className="w-4 h-4" /> Elimina Asset</button>
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
