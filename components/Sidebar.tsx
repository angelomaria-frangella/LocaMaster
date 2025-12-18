import { LayoutDashboard, FileText, Calendar, Settings as SettingsIcon, Bot, Building, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({ currentView, setCurrentView, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Cruscotto', icon: LayoutDashboard },
    { id: 'contracts', label: 'Archivio Contratti', icon: FileText },
    { id: 'calendar', label: 'Scadenziario', icon: Calendar },
    { id: 'properties', label: 'Asset Immobiliari', icon: Building },
    { id: 'ai-advisor', label: 'Consulenza IA', icon: Bot, isSpecial: true },
  ];

  const handleLogoutClick = () => {
      if (confirm("Confermi di voler terminare la sessione di lavoro sicura?")) {
          if (onLogout) onLogout();
          else window.location.reload();
      }
  };

  return (
    <aside className="h-full w-24 lg:w-80 bg-slate-950 border-r border-white/5 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-50 transition-all duration-300">
      {/* HEADER - LOGO MISSION CONTROL */}
      <div className="h-28 flex items-center justify-center lg:justify-start lg:px-10 border-b border-white/5 bg-black/30 flex-shrink-0">
        <div className="relative group cursor-pointer">
            <div className="absolute -inset-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-3xl shadow-2xl group-hover:scale-105 transition-transform">
              L
            </div>
        </div>
        <div className="hidden lg:block ml-6">
            <h1 className="font-black text-3xl tracking-tighter text-white leading-none">LocaMaster</h1>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                AI Control Center
            </p>
        </div>
      </div>

      {/* NAV ITEMS */}
      <nav className="flex-1 py-12 px-5 space-y-4 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center p-4 rounded-3xl transition-all duration-500 group relative overflow-hidden
                ${isActive 
                  ? 'bg-primary-600 text-white shadow-[0_15px_30px_rgba(99,102,241,0.3)] scale-[1.03]' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <div className={`flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : item.isSpecial ? 'text-primary-500' : 'text-slate-500 group-hover:text-white'}`} />
              </div>
              <span className={`hidden lg:block ml-5 font-black text-[13px] tracking-widest uppercase ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
                {item.label}
              </span>
              
              {isActive && (
                  <div className="absolute left-0 w-1.5 h-8 bg-white rounded-full"></div>
              )}
              
              {item.isSpecial && !isActive && (
                <div className="absolute right-6 w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* FOOTER ACTION PANEL */}
      <div className="p-8 border-t border-white/5 bg-black/20 flex-shrink-0 space-y-4">
        <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center justify-center lg:justify-start p-4 rounded-2xl transition-all border ${
                currentView === 'settings' 
                ? 'bg-slate-800 text-white border-white/20 shadow-lg' 
                : 'text-slate-500 border-transparent hover:text-white hover:bg-white/5'
            }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="hidden lg:block ml-5 font-black text-[11px] tracking-widest uppercase">Impostazioni</span>
        </button>

        <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center lg:justify-start p-4 rounded-2xl transition-all text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 font-black text-[11px] tracking-widest uppercase group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden lg:block ml-5">Esci dal Sistema</span>
        </button>
      </div>
    </aside>
  );
}