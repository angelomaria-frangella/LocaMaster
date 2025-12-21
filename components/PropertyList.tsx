
import React, { useState } from 'react';
import { Contract } from '../types';
import { Building, MapPin, Search, X, User } from 'lucide-react';

interface PropertyListProps {
  contracts: Contract[];
}

const PropertyList: React.FC<PropertyListProps> = ({ contracts }) => {
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  const getOwnersName = (c: Contract) => {
    if (c.owners && c.owners.length > 0) {
        return c.owners.map(o => o.name).filter(n => !!n).join(', ');
    }
    return c.ownerName || 'Non specificato';
  };

  const getTenantsName = (c: Contract) => {
    if (c.tenants && c.tenants.length > 0) {
        return c.tenants.map(t => t.name).filter(n => !!n).join(', ');
    }
    return c.tenantName || 'Non specificato';
  };

  const properties = contracts.map(c => ({
    address: c.propertyAddress,
    tenant: getTenantsName(c),
    rent: c.annualRent,
    isActive: c.isActive,
    owner: getOwnersName(c),
    type: c.contractType,
    contractId: c.id
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Patrimonio Immobiliare</h2>
           <p className="text-slate-400">Controllo centralizzato degli asset di Studio.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Filtra indirizzo..." 
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 outline-none w-full sm:w-64"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop, idx) => (
          <div key={idx} className="group bg-slate-900 border border-slate-700 hover:border-primary-500/50 rounded-2xl transition-all duration-300">
            <div className="h-28 bg-slate-950 relative border-b border-slate-800 flex items-center justify-center">
               <MapPin className="w-8 h-8 text-primary-500/20 group-hover:text-primary-500/40 transition-colors" />
               <div className="absolute bottom-4 left-4 right-4 text-white font-bold truncate text-sm">
                  {prop.address}
               </div>
            </div>

            <div className="p-5 space-y-4">
               <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Proprietà</span>
                  <p className="text-xs text-slate-300 font-bold leading-snug">{prop.owner}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black">Conduttore</span>
                    <p className="text-[11px] text-white font-medium truncate">{prop.tenant}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black">Canone Annuo</span>
                    <p className="text-[11px] text-white font-black italic">€ {prop.rent.toLocaleString('it-IT')}</p>
                  </div>
               </div>
               
               <button 
                  onClick={() => setSelectedProperty(prop)}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors border border-slate-800"
               >
                  Dettagli Fiscali
               </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setSelectedProperty(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-6">
                <h3 className="text-xl font-black text-white uppercase italic">{selectedProperty.address}</h3>
                <button onClick={() => setSelectedProperty(null)} className="text-slate-500"><X /></button>
            </div>
            <div className="space-y-4 text-sm text-slate-300">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Anagrafica Proprietari</p>
                    <p className="font-bold text-white">{selectedProperty.owner}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Anagrafica Conduttori</p>
                    <p className="font-bold text-white">{selectedProperty.tenant}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyList;
