
import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Menu, Loader2, Radio } from 'lucide-react';
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
      console.log("%c LocaMaster TITAN V2.0 - COCKPIT ACTIVATED ", "background: #6366f1; color: white; font-weight: bold; border-radius: 4px; padding: 4px 12px; font-size: 14px;");
      localStorage.setItem('locamaster_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    const loadData = async () => {
      if (isSupabaseConfigured()) {
        setIsLoading(true);
        try {
          const dbContracts = await fetchContracts(); 
          if (Array.isArray(dbContracts) && dbContracts.length > 0) {
              setContracts(dbContracts);
              setUsingRealDb(true);
          } else {
              console.log("Cloud Database Empty - Local Backup Active");
              setUsingRealDb(true);
          }
        } catch (error) {
          console.error("Infrastructural error:", error);
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
        alert(`Storage Error: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  }, [usingRealDb]);

  const handleDeleteContract = async (id: string) => {
    if (window.confirm("Confermi smantellamento asset definitivo?")) {
        if(usingRealDb) await deleteContract(id);
        setContracts(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleLogout = () => {
      if (confirm("Terminare sessione di comando sicura?")) {
          localStorage.removeItem('locamaster_contracts');
          window.location.reload();
      }
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-100 font-sans overflow-hidden">
        {isSidebarOpen && <div className="fixed inset-0 bg-black/90 z-40 lg:hidden backdrop-blur-md" onClick={() => setIsSidebarOpen(false)} />}
        <div className={`fixed lg:relative inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-700 ease-in-out h-full`}>
          <Sidebar currentView={currentView} setCurrentView={handleNavigation} onLogout={handleLogout} />
        </div>
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="lg:hidden flex items-center p-8 border-b border-white/10 bg-slate-950 z-30 justify-between">
            <button onClick={() => setIsSidebarOpen(true)} className="p-3 text-primary-500 bg-primary-500/10 rounded-2xl"><Menu className="w-10 h-10" /></button>
            <span className="font-black text-3xl tracking-tighter uppercase italic">TITAN <span className="text-primary-500">OS</span></span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-16 pb-48 scroll-smooth">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 font-black">
                  <div className="relative mb-12">
                      <Loader2 className="w-24 h-24 animate-spin text-primary-600" />
                      <Radio className="absolute inset-0 m-auto w-10 h-10 text-primary-400 animate-pulse" />
                  </div>
                  <span className="text-3xl tracking-[0.5em] uppercase italic animate-pulse">Initializing Titan Command Center...</span>
                </div>
              ) : isAddingContract ? (
                <AddContract initialData={editingContract} onConfirmSave={handleSaveContract} onCancel={() => setIsAddingContract(false)} />
              ) : (
                <>
                  {currentView === 'dashboard' && <Dashboard contracts={contracts} deadlines={deadlines} onAddContract={() => setIsAddingContract(true)} aiEnabled={true} />}
                  {currentView === 'contracts' && <ContractList contracts={contracts} onAddContract={() => setIsAddingContract(true)} onOpenAI={c => { setSelectedContractForAI(c); setCurrentView('ai-advisor'); }} onEditContract={handleEditContract} onDeleteContract={handleDeleteContract} />}
                  {currentView === 'properties' && <PropertyList contracts={contracts} />}
                  {currentView === 'ai-advisor' && <AIAdvisor contracts={contracts} focusedContract={selectedContractForAI} onClearFocus={() => setSelectedContractForAI(null)} />}
                  {currentView === 'calendar' && <CalendarView deadlines={deadlines} />}
                  {currentView === 'settings' && <Settings onNavigate={handleNavigation} />}
                </>
              )}
          </div>
        </main>
    </div>
  );
};
export default App;
