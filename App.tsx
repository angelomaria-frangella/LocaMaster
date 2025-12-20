
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
      console.log("%c [SYSTEM] TITAN COCKPIT V2.1.0 ACTIVATED ", "background: #6366f1; color: white; font-weight: bold; padding: 5px;");
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
          }
        } catch (error) {
          console.error("Cloud Error:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData();
  }, []);

  const deadlines = useMemo(() => generateDeadlines(contracts), [contracts]);

  const handleNavigation = (view: string) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
    setIsAddingContract(false);
    setEditingContract(undefined); 
    if (view !== 'ai-advisor') setSelectedContractForAI(null); 
  };

  const handleSaveContract = useCallback(async (newContract: Contract, openAi: boolean = false) => {
    setIsLoading(true);
    const contractToSave = { ...normalizeContract(newContract), cedolareSecca: isCedolareActive(newContract.cedolareSecca) };
    try {
        if (usingRealDb) {
            const saved = await createContract(contractToSave);
            if (saved) setContracts(prev => prev.find(c => c.id === saved.id) ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved]);
        } else {
            setContracts(prev => prev.find(c => c.id === contractToSave.id) ? prev.map(c => c.id === contractToSave.id ? contractToSave : c) : [...prev, contractToSave]);
        }
        setIsAddingContract(false);
        if (openAi) { setSelectedContractForAI(contractToSave); setCurrentView('ai-advisor'); } 
        else setCurrentView('contracts');
    } finally {
        setIsLoading(false);
    }
  }, [usingRealDb]);

  const handleLogout = () => {
      if (confirm("Shutdown Mission Control?")) {
          localStorage.removeItem('locamaster_contracts');
          window.location.reload();
      }
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-100 font-sans overflow-hidden">
        <div className={`fixed lg:relative inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-500 ease-in-out h-full`}>
          <Sidebar currentView={currentView} setCurrentView={handleNavigation} onLogout={handleLogout} />
        </div>
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="lg:hidden flex items-center p-6 border-b border-white/5 bg-slate-950 z-30 justify-between">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-primary-500"><Menu className="w-10 h-10" /></button>
            <span className="font-black text-2xl tracking-tighter uppercase italic text-white">TITAN <span className="text-primary-500">OS</span></span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-12 pb-40">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-16 h-16 animate-spin text-primary-500 mb-6" />
                  <span className="text-2xl font-black uppercase tracking-widest italic animate-pulse">Syncing Titan Cockpit...</span>
                </div>
              ) : isAddingContract ? (
                <AddContract initialData={editingContract} onConfirmSave={handleSaveContract} onCancel={() => setIsAddingContract(false)} />
              ) : (
                <>
                  {currentView === 'dashboard' && <Dashboard contracts={contracts} deadlines={deadlines} onAddContract={() => setIsAddingContract(true)} aiEnabled={true} />}
                  {currentView === 'contracts' && <ContractList contracts={contracts} onAddContract={() => setIsAddingContract(true)} onOpenAI={c => { setSelectedContractForAI(c); setCurrentView('ai-advisor'); }} onEditContract={(c) => { setEditingContract(c); setIsAddingContract(true); }} onDeleteContract={async id => { if(confirm("Confirm deletion?")) { if(usingRealDb) await deleteContract(id); setContracts(prev => prev.filter(c => c.id !== id)); } }} />}
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
