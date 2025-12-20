
import { LayoutDashboard, FileText, Calendar, Settings as SettingsIcon, Bot, Building, LogOut, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({ currentView, setCurrentView, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contracts', label: 'Asset Contratti', icon: FileText },
    { id: 'calendar', label: 'Scadenzario', icon: Calendar },
    { id: 'properties', label: 'Patrimonio', icon: Building },
    { id: 'ai-advisor', label: 'Strategia IA', icon: Bot },
  ];

  return (
    <aside className="h-full w-24 lg:w-72 bg-slate-950 border-r border-white/5 flex flex-col shadow-2xl relative z-50">
      <div className="p-8">
        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-primary-600/40 mb-10 mx-auto lg:mx-0 transition-all hover:rotate-6 hover:scale-110">T</div>
        <div className="hidden lg:block">
            <h1 className="font-black text-2xl tracking-tighter text-white uppercase italic">Titan<span className="text-primary-500">_</span></h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Management Suite</p>
        </div>
      </div>

      <nav className="flex-1 py-10 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center p-4 rounded-2xl transition-all group relative
              ${currentView === item.id 
                ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20' 
                : 'text-slate-500 hover:bg-white/5 hover:text-white'}
            `}
          >
            <item.icon className={`w-6 h-6 transition-transform ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="hidden lg:block ml-4 font-bold text-sm tracking-tight">{item.label}</span>
            {currentView === item.id && <ChevronRight className="hidden lg:block ml-auto w-4 h-4 text-white/50" />}
          </button>
        ))}
      </nav>

      <div className="p-8 border-t border-white/5 space-y-4">
        <button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${currentView === 'settings' ? 'text-primary-400 bg-primary-400/10' : 'text-slate-500 hover:text-white'}`}>
            <SettingsIcon className="w-5 h-5" />
            <span className="hidden lg:block font-bold text-sm">Configurazione</span>
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-4 p-3 text-slate-600 hover:text-rose-500 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block font-bold text-sm">Esci</span>
        </button>
      </div>
    </aside>
  );
}
