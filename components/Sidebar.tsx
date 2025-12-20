
import { LayoutDashboard, FileText, Calendar, Settings as SettingsIcon, Bot, Building, LogOut, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({ currentView, setCurrentView, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Cruscotto', icon: LayoutDashboard },
    { id: 'contracts', label: 'Archivio Asset', icon: FileText },
    { id: 'calendar', label: 'Radar Scadenze', icon: Calendar },
    { id: 'properties', label: 'Asset Immobiliari', icon: Building },
    { id: 'ai-advisor', label: 'Consulenza IA', icon: Bot, isSpecial: true },
  ];

  const handleLogoutClick = () => {
      if (confirm("Confermi di voler terminare il protocollo di comando?")) {
          if (onLogout) onLogout();
          else window.location.reload();
      }
  };

  return (
    <aside className="h-full w-28 lg:w-96 bg-slate-950 border-r border-white/10 flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.8)] z-50 transition-all duration-500 relative">
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

      {/* HEADER */}
      <div className="h-32 flex items-center justify-center lg:justify-start lg:px-12 border-b border-white/10 bg-black/40 relative z-10">
        <div className="relative group cursor-pointer">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative w-16 h-16 rounded-[1.5rem] bg-slate-900 border-2 border-primary-500 flex items-center justify-center text-white font-black text-4xl shadow-2xl group-hover:scale-110 transition-transform italic">
              T
            </div>
        </div>
        <div className="hidden lg:block ml-8">
            <h1 className="font-black text-4xl tracking-tighter text-white leading-none italic">TITAN</h1>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.5em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                ACTIVE COMMAND
            </p>
        </div>
      </div>

      {/* NAV ITEMS */}
      <nav className="flex-1 py-16 px-6 space-y-6 overflow-y-auto scrollbar-hide relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center p-5 rounded-[2rem] transition-all duration-700 group relative overflow-hidden
                ${isActive 
                  ? 'bg-primary-600 text-white shadow-[0_20px_40px_rgba(79,70,229,0.4)] scale-[1.05]' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <div className={`flex items-center justify-center transition-all duration-700 ${isActive ? 'scale-125' : 'group-hover:scale-125'}`}>
                <Icon className={`w-8 h-8 ${isActive ? 'text-white' : item.isSpecial ? 'text-primary-500' : 'text-slate-600 group-hover:text-white'}`} />
              </div>
              <span className={`hidden lg:block ml-8 font-black text-[14px] tracking-[0.2em] uppercase italic ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
                {item.label}
              </span>
              
              {isActive && (
                  <div className="absolute left-0 w-2 h-10 bg-white rounded-full"></div>
              )}
              
              {item.isSpecial && !isActive && (
                <div className="absolute right-8 w-3 h-3 rounded-full bg-primary-500 shadow-[0_0_15px_rgba(99,102,241,1)] animate-pulse"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-10 border-t border-white/10 bg-black/40 relative z-10 space-y-5">
        <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center justify-center lg:justify-start p-5 rounded-3xl transition-all border-2 ${
                currentView === 'settings' 
                ? 'bg-slate-800 text-white border-primary-500/50 shadow-2xl scale-[1.02]' 
                : 'text-slate-600 border-transparent hover:text-white hover:bg-white/5'
            }`}
        >
          <SettingsIcon className="w-6 h-6" />
          <span className="hidden lg:block ml-8 font-black text-[12px] tracking-[0.3em] uppercase italic">Settings</span>
        </button>

        <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center lg:justify-start p-5 rounded-3xl transition-all text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 font-black text-[12px] tracking-[0.3em] uppercase italic group"
        >
          <LogOut className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
          <span className="hidden lg:block ml-8">Shutdown System</span>
        </button>
      </div>
    </aside>
  );
}
