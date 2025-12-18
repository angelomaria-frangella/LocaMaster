
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContractList from './components/ContractList';
import PropertyList from './components/PropertyList';
import AIAdvisor from './components/AIAdvisor';
import CalendarView from './components/CalendarView';
import AddContract from './components/AddContract';
import Settings from './components/Settings';
import { MOCK_CONTRACTS } from './appConstants';
import { generateDeadlines, isCedolareActive } from './utils/dateUtils';
import { Menu, Loader2 } from 'lucide-react';
import { Contract } from './types';
import { fetchContracts, createContract, isSupabaseConfigured, deleteContract, normalizeContract } from './services/supabaseService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [contracts, setContracts] = useState<Contract[]>(() => {
      const saved = localStorage.getItem('locamaster_contracts');
      const rawContracts = saved ? JSON.parse(saved) : MOCK_CONTRACTS;
      return rawContracts.map(normalizeContract);
  });
  
  const [isAddingContract, setIsAddingContract] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [usingRealDb, setUsingRealDb] = useState(false);
  const [selectedContractForAI, setSelectedContractForAI] = useState<Contract | null>(null);

  useEffect(() => {
      localStorage.setItem('locamaster_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    const loadData = async () => {
      if (isSupabaseConfigured()) {
        setIsLoading(true);
        try {
          const dbContracts = await fetchContracts(); 
          if (Array.isArray(dbContracts)) {
              setContracts(dbContracts);
              setUsingRealDb(true);
          }
        } catch (error) {
          console.error("Cloud sync error:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData();
  }, []);

  const deadlines = useMemo(() => {
      return generateDeadlines(contracts);
  }, [contracts]);

  const handleNavigation = (view: string) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
    setIsAddingContract(false);
    setEditingContract(undefined); 
    if (view !== 'ai-advisor') setSelectedContractForAI(null); 
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setIsAddingContract(true);
  };

  const handleSaveContract = useCallback(async (newContract: Contract, openAi: boolean = false) => {
    setIsLoading(true);
    const contractToSave = {
        ...normalizeContract(newContract),
        cedolareSecca: isCedolareActive(newContract.cedolareSecca) 
    };

    try {
        if (usingRealDb) {
            const saved = await createContract(contractToSave);
            if (saved) {
               setContracts(prev => {
                   const exists = prev.find(c => c.id === saved.id);
                   return exists ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved];
               });
            }
        } else {
            setContracts(prev => {
                const exists = prev.find(c => c.id === contractToSave.id);
                return exists ? prev.map(c => c.id === contractToSave.id ? contractToSave : c) : [...prev, contractToSave];
            });
        }
        setIsAddingContract(false);
        setEditingContract(undefined);
        if (openAi) {
            setSelectedContractForAI(contractToSave);
            setCurrentView('ai-advisor');
        } else {
            setCurrentView('contracts');
        }
    } catch (e: any) {
        alert(`Errore: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  }, [usingRealDb]);

  const handleDeleteContract = async (id: string) => {
    if (window.confirm("Attenzione: procedere con l'eliminazione?")) {
        if(usingRealDb) await deleteContract(id);
        setContracts(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleLogout = () => {
      if (confirm("Uscire dal sistema?")) {
          localStorage.removeItem('locamaster_contracts');
          window.location.reload();
      }
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 font-black animate-pulse">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-6" />
        Sincronizzazione in corso...
      </div>
    );
    
    if (isAddingContract) return <AddContract initialData={editingContract} onConfirmSave={handleSaveContract} onCancel={() => setIsAddingContract(false)} />;

    switch (currentView) {
      case 'dashboard': return <Dashboard contracts={contracts} deadlines={deadlines} onAddContract={() => setIsAddingContract(true)} aiEnabled={true} />;
      case 'contracts': return <ContractList contracts={contracts} onAddContract={() => setIsAddingContract(true)} onOpenAI={c => { setSelectedContractForAI(c); setCurrentView('ai-advisor'); }} onEditContract={handleEditContract} onDeleteContract={handleDeleteContract} />;
      case 'properties': return <PropertyList contracts={contracts} />;
      case 'ai-advisor': return <AIAdvisor contracts={contracts} focusedContract={selectedContractForAI} onClearFocus={() => setSelectedContractForAI(null)} />;
      case 'calendar': return <CalendarView deadlines={deadlines} />;
      case 'settings': return <Settings onNavigate={handleNavigation} />;
      default: return <Dashboard contracts={contracts} deadlines={deadlines} onAddContract={() => setIsAddingContract(true)} aiEnabled={true} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-100 font-sans overflow-hidden">
        {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
        <div className={`fixed lg:relative inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-500 ease-in-out h-full`}>
          <Sidebar currentView={currentView} setCurrentView={handleNavigation} onLogout={handleLogout} />
        </div>
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="lg:hidden flex items-center p-6 border-b border-white/5 bg-slate-950 z-30 justify-between">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-primary-500"><Menu className="w-8 h-8" /></button>
            <span className="font-black text-xl tracking-tighter uppercase">LocaMaster AI</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-12 pb-40">
              {renderContent()}
          </div>
        </main>
    </div>
  );
};
export default App;
