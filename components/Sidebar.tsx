
import { LayoutDashboard, FileText, Calendar, Settings as SettingsIcon, Bot, Building, LogOut, Terminal } from 'lucide-react';

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
    <aside className="h-full w-24 lg:w-80 bg-slate-950 border-r border-white/5 flex flex-col shadow-2xl z-50 transition-all relative">
      <div className="p-8 border-b border-white/5 flex flex-col items-center lg:items-start">
        <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg shadow-primary-500/30 mb-4">T</div>
        <div className="hidden lg:block">
            <h1 className="font-black text-2xl tracking-tighter text-white italic">TITAN <span className="text-primary-500">COCKPIT</span></h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Online</span>
            </div>
        </div>
      </div>

      <nav className="flex-1 py-10 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center p-4 rounded-xl transition-all group relative
              ${currentView === item.id ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-white'}
            `}
          >
            <item.icon className="w-6 h-6" />
            <span className="hidden lg:block ml-4 font-bold text-xs uppercase tracking-widest">{item.label}</span>
            {item.isSpecial && currentView !== item.id && (
                <div className="absolute right-4 w-2 h-2 bg-primary-500 rounded-full animate-ping"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-4">
        <div className="hidden lg:block p-4 bg-slate-900/50 border border-white/5 rounded-xl">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Current Version</p>
            <p className="text-primary-400 font-mono text-xs font-bold">V 2.1.0 - NEON TITAN</p>
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
