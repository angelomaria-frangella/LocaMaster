
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
import { Menu, Loader2, Sparkles } from 'lucide-react';
import { Contract } from './types';
import { normalizeContract } from './services/supabaseService';

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
  const [selectedContractForAI, setSelectedContractForAI] = useState<Contract | null>(null);

  useEffect(() => {
      localStorage.setItem('locamaster_contracts', JSON.stringify(contracts));
  }, [contracts]);

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
        setContracts(prev => prev.find(c => c.id === contractToSave.id) ? prev.map(c => c.id === contractToSave.id ? contractToSave : c) : [...prev, contractToSave]);
        setIsAddingContract(false);
        if (openAi) { setSelectedContractForAI(contractToSave); setCurrentView('ai-advisor'); } 
        else setCurrentView('contracts');
    } finally {
        setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <div className={`fixed lg:relative inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-500 ease-in-out`}>
          <Sidebar currentView={currentView} setCurrentView={handleNavigation} onLogout={() => window.location.reload()} />
        </div>

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-6 border-b border-white/5 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-800 rounded-lg"><Menu className="w-6 h-6" /></button>
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <span className="font-bold text-lg tracking-tight uppercase">Titan Dashboard</span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
                  <span className="text-slate-400 font-medium animate-pulse">Aggiornamento in corso...</span>
                </div>
              ) : isAddingContract ? (
                <AddContract initialData={editingContract} onConfirmSave={handleSaveContract} onCancel={() => setIsAddingContract(false)} />
              ) : (
                <>
                  {currentView === 'dashboard' && <Dashboard contracts={contracts} deadlines={deadlines} onAddContract={() => setIsAddingContract(true)} aiEnabled={true} />}
                  {currentView === 'contracts' && <ContractList contracts={contracts} onAddContract={() => setIsAddingContract(true)} onOpenAI={c => { setSelectedContractForAI(c); setCurrentView('ai-advisor'); }} onEditContract={(c) => { setEditingContract(c); setIsAddingContract(true); }} onDeleteContract={id => setContracts(p => p.filter(c => c.id !== id))} />}
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
