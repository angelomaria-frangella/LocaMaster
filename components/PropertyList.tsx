import React, { useState } from 'react';
import { Contract } from '../types';
import { Building, MapPin, Euro, Search, Filter, X, Home, Ruler, Zap } from 'lucide-react';

interface PropertyListProps {
  contracts: Contract[];
}

const PropertyList: React.FC<PropertyListProps> = ({ contracts }) => {
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  const properties = contracts.map(c => ({
    address: c.propertyAddress,
    tenant: c.tenantName,
    rent: c.annualRent,
    isActive: c.isActive,
    owner: c.ownerName,
    type: c.contractType,
    contractId: c.id
  }));

  const handleOpenDetail = (prop: any) => {
    setSelectedProperty(prop);
  };

  const handleCloseDetail = () => {
    setSelectedProperty(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white">Immobili Gestiti</h2>
           <p className="text-slate-400">Elenco degli immobili e stato occupazionale.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Cerca indirizzo..." 
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-full sm:w-64"
                />
            </div>
            <button className="p-2 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors">
                <Filter className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop, idx) => (
          // FIX: Solid bg, no opacity
          <div key={idx} className="group overflow-hidden bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="h-32 bg-slate-950 relative border-b border-slate-800">
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-50" />
               <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center"></div>
               
               <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
                  <div className="flex items-center gap-2 text-white font-semibold shadow-black drop-shadow-md">
                     <MapPin className="w-4 h-4 text-primary-400" />
                     <span className="truncate max-w-[180px]">{prop.address.split(',')[0]}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border shadow-sm ${prop.isActive ? 'bg-emerald-950 text-emerald-400 border-emerald-900' : 'bg-rose-950 text-rose-400 border-rose-900'}`}>
                    {prop.isActive ? 'Locato' : 'Sfitto'}
                  </span>
               </div>
            </div>

            <div className="p-5 space-y-4">
               <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <div className="text-sm">
                     <span className="text-slate-500 block">Proprietario</span>
                     <span className="text-slate-300 font-medium">{prop.owner}</span>
                  </div>
                  <Building className="w-5 h-5 text-slate-600" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Inquilino</span>
                    <p className="text-sm text-white font-medium truncate">{prop.tenant}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Rendimento</span>
                    <p className="text-sm text-white font-medium flex items-center gap-1">
                       <Euro className="w-3 h-3 text-slate-400" />
                       {prop.rent.toLocaleString('it-IT')}
                       <span className="text-xs text-slate-500">/anno</span>
                    </p>
                  </div>
               </div>
               
               <div className="pt-2">
                 <button 
                    onClick={() => handleOpenDetail(prop)}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-sm font-medium rounded-lg border border-slate-800 transition-colors flex items-center justify-center gap-2"
                 >
                    <Home className="w-4 h-4" />
                    Scheda Immobile
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="relative h-48 bg-slate-950">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                
                <button 
                  onClick={handleCloseDetail}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-6 left-6">
                   <div className="flex items-center gap-2 text-primary-400 font-medium mb-1">
                      <MapPin className="w-5 h-5" />
                      {selectedProperty.address.split(',')[1] || 'Città'}
                   </div>
                   <h2 className="text-3xl font-bold text-white">{selectedProperty.address}</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 
                 <div className="md:col-span-2 space-y-6">
                    
                    <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
                       <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                          <Ruler className="w-5 h-5 text-indigo-400" />
                          Dati Tecnici & Catastali
                       </h3>
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                             <p className="text-xs text-slate-500 uppercase">Superficie</p>
                             <p className="text-lg font-medium text-white">110 <span className="text-sm text-slate-500">mq</span></p>
                          </div>
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                             <p className="text-xs text-slate-500 uppercase">Vani</p>
                             <p className="text-lg font-medium text-white">4.5</p>
                          </div>
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                             <p className="text-xs text-slate-500 uppercase">Piano</p>
                             <p className="text-lg font-medium text-white">3°</p>
                          </div>
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                             <p className="text-xs text-slate-500 uppercase">Categoria</p>
                             <p className="text-lg font-medium text-white">A/2</p>
                          </div>
                       </div>
                    </div>

                 </div>

                 <div className="space-y-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                       <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                          <Zap className="w-5 h-5 text-yellow-400" />
                          APE
                       </h3>
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                             C
                          </div>
                          <div>
                             <p className="text-xs text-slate-400">EPgl,nren</p>
                             <p className="text-white font-medium">120.45 kWh/m²</p>
                             <p className="text-[10px] text-slate-500">Scadenza: 12/2030</p>
                          </div>
                       </div>
                    </div>
                 </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PropertyList;