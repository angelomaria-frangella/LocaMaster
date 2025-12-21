
import React, { useState } from 'react';
import { Contract } from '../types';
import { Building, MapPin, Search, X, User } from 'lucide-react';

interface PropertyListProps {
  contracts: Contract[];
}

const PropertyList: React.FC<PropertyListProps> = ({ contracts }) => {
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  const getClientName = (c: Contract) => {
    if (c.clientSide === 'LOCATORE') {
        return c.ownerName || (c.owners?.[0]?.name) || 'N/A';
    }
    return c.tenantName || (c.tenants?.[0]?.name) || 'N/A';
  };

  const getCounterpartyName = (c: Contract) => {
    if (c.clientSide === 'LOCATORE') {
        return c.tenantName || (c.tenants?.[0]?.name) || 'N/A';
    }
    return c.ownerName || (c.owners?.[0]?.name) || 'N/A';
  };

  const properties = contracts.map(c => ({
    address: c.propertyAddress,
    client: getClientName(c),
    counterparty: getCounterpartyName(c),
    rent: c.annualRent,
    isActive: c.isActive,
    type: c.contractType,
    clientSide: c.clientSide,
    contractId: c.id
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Patrimonio Assistiti</h2>
           <p className="text-slate-400">Controllo asset immobiliari per conto dei clienti dello studio.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Filtra indirizzo o cliente..." 
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 outline-none w-full sm:w-64 focus:border-primary-500"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop, idx) => (
          <div key={idx} className="group bg-slate-900 border border-slate-700 hover:border-primary-500/50 rounded-[2rem] transition-all duration-500 overflow-hidden">
            <div className="h-32 bg-slate-950 relative border-b border-slate-800 flex items-center justify-center">
               <Building className="w-10 h-10 text-primary-500/20 group-hover:text-primary-500/40 transition-all group-hover:scale-110" />
               <div className="absolute bottom-4 left-6 right-6">
                  <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest block mb-1">Indirizzo Immobile</span>
                  <div className="text-white font-bold truncate text-sm italic">{prop.address}</div>
               </div>
            </div>

            <div className="p-8 space-y-6">
               <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Assistito dallo Studio</span>
                  <p className="text-lg text-white font-black italic uppercase tracking-tighter truncate">{prop.client}</p>
                  <span className="text-[8px] px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full font-bold uppercase">{prop.clientSide}</span>
               </div>
               
               <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/50">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black">Controparte</span>
                    <p className="text-xs text-slate-300 font-bold truncate">{prop.counterparty}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black">Canone Annuo</span>
                    <p className="text-sm text-white font-black italic">€ {prop.rent.toLocaleString('it-IT')}</p>
                  </div>
               </div>
               
               <button 
                  onClick={() => setSelectedProperty(prop)}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-800"
               >
                  Dati Catastali e Fisco
               </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 animate-in fade-in" onClick={() => setSelectedProperty(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-[3rem] w-full max-w-xl p-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1 block">Dettagli Asset</span>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{selectedProperty.address}</h3>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="text-slate-500 hover:text-white"><X /></button>
            </div>
            <div className="space-y-6">
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Cliente Studio</p>
                    <p className="font-black text-white text-xl italic uppercase">{selectedProperty.client}</p>
                </div>
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Controparte Locatizia</p>
                    <p className="font-bold text-slate-200">{selectedProperty.counterparty}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyList;
