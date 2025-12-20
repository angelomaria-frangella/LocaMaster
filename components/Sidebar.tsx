
import { LayoutDashboard, FileText, Calendar, Settings as SettingsIcon, Bot, Building, LogOut, Shield } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({ currentView, setCurrentView, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contracts', label: 'Asset Archivio', icon: FileText },
    { id: 'calendar', label: 'Radar Scadenze', icon: Calendar },
    { id: 'properties', label: 'Immobili', icon: Building },
    { id: 'ai-advisor', label: 'IA Strategy', icon: Bot, isSpecial: true },
  ];

  return (
    <aside className="h-full w-24 lg:w-80 bg-black border-r border-white/5 flex flex-col shadow-2xl z-50 transition-all relative">
      <div className="p-8 border-b border-white/5">
        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl italic shadow-[0_0_30px_rgba(168,85,247,0.4)] mb-4 mx-auto lg:mx-0">T</div>
        <div className="hidden lg:block">
            <h1 className="font-black text-2xl tracking-tighter text-white italic">TITAN <span className="text-primary-500">ULTRA</span></h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantum Engine Online</span>
            </div>
        </div>
      </div>

      <nav className="flex-1 py-10 px-4 space-y-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center p-4 rounded-2xl transition-all group relative
              ${currentView === item.id ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-white'}
            `}
          >
            <item.icon className={`w-6 h-6 ${currentView === item.id ? 'text-white' : item.isSpecial ? 'text-primary-400' : 'text-slate-500'}`} />
            <span className="hidden lg:block ml-4 font-bold text-xs uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-4">
        <div className="hidden lg:block p-4 bg-primary-950/20 border border-primary-500/20 rounded-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Infrastruttura</p>
            <p className="text-primary-400 font-mono text-xs font-bold">CORE V 2.2.0-U</p>
        </div>
        <button onClick={() => setCurrentView('settings')} className="w-full flex items-center gap-4 p-3 text-slate-500 hover:text-white transition-colors">
            <SettingsIcon className="w-5 h-5" />
            <span className="hidden lg:block font-bold text-[10px] uppercase">Settings</span>
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-4 p-3 text-rose-500 hover:text-rose-400 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block font-bold text-[10px] uppercase">Shutdown</span>
        </button>
      </div>
    </aside>
  );
}
