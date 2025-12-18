
import { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  AlertTriangle, Euro, Briefcase, Zap, TrendingUp, 
  FilePlus, BrainCircuit, Clock, Database, ShieldAlert, Target, Activity, Key,
  Radio, Cpu, Globe, Crosshair, BarChart3
} from 'lucide-react';
import ReportGenerator from './ReportGenerator';
import { generatePortfolioInsights } from '../services/geminiService';
import { isSupabaseConfigured } from '../services/supabaseService';

declare var window: any;

interface DashboardProps {
  contracts: Contract[];
  deadlines: DeadlineEvent[];
  onAddContract: () => void;
  aiEnabled: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ contracts, deadlines, onAddContract, aiEnabled }) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<{category: string, text: string}[]>([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ db: false, ai: false, pro: false });
  const [missionTime, setMissionTime] = useState(new Date().toLocaleTimeString('it-IT', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
        setMissionTime(new Date().toLocaleTimeString('it-IT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const checkStatus = async () => {
        const isPro = window.aistudio?.hasSelectedApiKey ? await window.aistudio.hasSelectedApiKey() : false;
        setSystemStatus({
            db: isSupabaseConfigured(),
            ai: !!process.env.API_KEY,
            pro: isPro
        });
    };
    checkStatus();

    if (aiEnabled && contracts.length > 0 && process.env.API_KEY) {
      setIsInsightsLoading(true);
      generatePortfolioInsights(contracts).then(insights => {
        setAiInsights(insights);
        setIsInsightsLoading(false);
      }).catch(() => setIsInsightsLoading(false));
    }
    return () => clearInterval(timer);
  }, [contracts, aiEnabled]);

  const stats = useMemo(() => {
    const activeContracts = contracts.filter(c => c.isActive);
    const totalRevenue = activeContracts.reduce((sum, c) => sum + (Number(c.annualRent) || 0), 0);
    const criticalDeadlines = deadlines.filter(d => d.urgency === UrgencyLevel.CRITICAL || d.urgency === UrgencyLevel.HIGH).length;
    return { totalRevenue, activeCount: activeContracts.length, criticalDeadlines };
  }, [contracts, deadlines]);

  const workloadData = useMemo(() => {
    const monthNames = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];
    const results = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const count = deadlines.filter(deadline => {
            const date = new Date(deadline.date);
            return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
        }).length;
        results.push({ name: monthNames[d.getMonth()], value: count });
    }
    return results;
  }, [deadlines]);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-20">
      {isReportModalOpen && <ReportGenerator contracts={contracts} onClose={() => setIsReportModalOpen(false)} aiEnabled={aiEnabled} />}

      {/* --- PRIME COCKPIT INTERFACE --- */}
      <div className="relative p-1 rounded-[3.5rem] bg-slate-900 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-600/10 blur-[120px] rounded-full"></div>
          
          <div className="relative z-10 p-8 lg:p-12 flex flex-col xl:flex-row justify-between gap-10">
              <div className="space-y-8 flex-1">
                  <div className="flex flex-wrap items-center gap-4">
                      <div className="font-mono text-primary-400 bg-primary-950/50 border border-primary-500/30 px-4 py-1.5 rounded-lg text-lg font-bold tracking-tighter shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                          MISSION TIME: {missionTime}
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${systemStatus.db ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${systemStatus.db ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                          DB_LINK: {systemStatus.db ? 'STABLE' : 'OFFLINE'}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-[9px] font-black uppercase tracking-widest text-purple-400">
                          <Cpu className="w-3.5 h-3.5" /> COCKPIT_V1.9.0
                      </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h1 className="text-7xl lg:text-9xl font-black text-white tracking-tighter leading-none italic uppercase flex items-baseline gap-4">
                        PRIME<span className="text-primary-500 not-italic">.</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-lg uppercase tracking-[0.4em] ml-1">Command & Intelligence Center</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <HUDUnit label="LOAD" value="12%" color="emerald" />
                      <HUDUnit label="NODES" value="ACTIVE" color="indigo" />
                      <HUDUnit label="ASSETS" value={contracts.length.toString().padStart(2, '0')} color="primary" />
                      <HUDUnit label="CRITICAL" value={stats.criticalDeadlines.toString().padStart(2, '0')} color={stats.criticalDeadlines > 0 ? "rose" : "emerald"} />
                  </div>
              </div>

              <div className="flex flex-col gap-4 min-w-[320px] justify-center">
                  <button onClick={onAddContract} className="w-full py-10 bg-primary-600 hover:bg-primary-500 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group/btn border-t border-white/20">
                      <div className="flex items-center gap-4">
                        <FilePlus className="w-8 h-8 group-hover/btn:rotate-12 transition-transform" /> 
                        NEW PRATICA
                      </div>
                      <span className="text-[10px] opacity-60 tracking-[0.5em] font-black">SECURE UPLOAD</span>
                  </button>
                  <button onClick={() => setIsReportModalOpen(true)} className="w-full py-5 bg-slate-950/80 hover:bg-slate-900 text-slate-300 rounded-[1.5rem] font-bold text-md flex items-center justify-center gap-4 transition-all border border-white/5 backdrop-blur-xl group">
                      <Zap className="w-5 h-5 text-amber-500 group-hover:scale-125 transition-transform" /> GENERATE FISCAL INTEL
                  </button>
              </div>
          </div>
      </div>

      {/* --- INTELLIGENCE GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] relative overflow-hidden shadow-2xl backdrop-blur-3xl">
              <div className="flex items-center justify-between mb-10">
                  <h3 className="font-black text-white text-2xl uppercase tracking-tighter flex items-center gap-4 italic">
                      <Radio className="w-8 h-8 text-primary-500 animate-pulse" /> Neural Insights
                  </h3>
                  <div className="flex gap-1">
                      {[1,2,3,4].map(i => <div key={i} className="w-1 h-4 bg-primary-500/20 rounded-full"></div>)}
                  </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                  {isInsightsLoading ? (
                      [1,2].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>)
                  ) : aiInsights.length > 0 ? (
                      aiInsights.map((insight, i) => (
                          <div key={i} className={`p-6 rounded-3xl border flex gap-6 items-center transition-all hover:translate-x-2 ${insight.category === 'RISCHIO' ? 'bg-rose-500/5 border-rose-500/20 text-rose-100' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-100'}`}>
                              <div className={`p-4 rounded-2xl bg-black/40 ${insight.category === 'RISCHIO' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {insight.category === 'RISCHIO' ? <ShieldAlert className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                              </div>
                              <div className="flex-1">
                                  <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mb-1 block">{insight.category} ANALYTICS</span>
                                  <p className="text-lg font-bold leading-tight">{insight.text}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                    <div className="py-12 text-center opacity-20 italic font-bold">Scanning for anomalies...</div>
                  )}
              </div>
          </div>

          <div className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl backdrop-blur-3xl">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
               <span className="text-[10px] font-black text-slate-500 tracking-[0.5em] uppercase">SYSTEM HEALTH</span>
               <div className="relative py-8">
                   <div className="text-emerald-400 font-black text-[9rem] tracking-tighter leading-none relative z-10 drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">98</div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full"></div>
               </div>
               <div className="w-full space-y-3">
                   <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/5 p-0.5">
                       <div className="h-full bg-emerald-500 rounded-full w-[98%] shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                   </div>
                   <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-2">
                       <BarChart3 className="w-3 h-3" /> PEAK PERFORMANCE ACTIVE
                   </p>
               </div>
          </div>
      </div>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <KPICard title="Revenue Projection" value={`€ ${stats.totalRevenue.toLocaleString('it-IT')}`} icon={Euro} color="emerald" />
          <KPICard title="Portfolio Nodes" value={stats.activeCount} icon={Briefcase} color="primary" />
          <KPICard title="Active Threats" value={stats.criticalDeadlines} icon={AlertTriangle} color="rose" alert={stats.criticalDeadlines > 0} />
      </div>

      {/* DATA FLOW & RADAR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 p-10 bg-slate-900/60 border border-white/5 rounded-[3.5rem] shadow-2xl backdrop-blur-3xl">
              <h3 className="font-black text-white text-2xl mb-12 flex items-center gap-4 uppercase tracking-tighter italic">
                  <Activity className="w-8 h-8 text-primary-500"/> Activity Stream
              </h3>
              <div className="h-[22rem] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workloadData}>
                          <defs>
                              <linearGradient id="primeGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '900'}} dy={15} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '900'}} dx={-10} />
                          <Tooltip 
                            contentStyle={{backgroundColor: '#020617', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff'}}
                            cursor={{stroke: '#6366f1', strokeWidth: 2}}
                          />
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#primeGradient)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
          
          <div className="bg-slate-950 border border-white/5 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors"></div>
              <h3 className="font-black text-white text-2xl mb-10 flex items-center gap-4 uppercase tracking-tighter italic">
                  <Crosshair className="w-8 h-8 text-rose-500 animate-spin-slow"/> Radar Target
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-[18rem] pr-2 scrollbar-hide">
                  {deadlines.slice(0, 8).map(d => (
                      <div key={d.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all border-l-4 border-l-transparent hover:border-l-primary-500">
                          <div>
                              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{d.date}</p>
                              <p className="text-sm font-black text-white truncate uppercase max-w-[140px]">{d.type}</p>
                          </div>
                          <div className={`w-2.5 h-2.5 rounded-full ${d.urgency === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-primary-500/50'}`}></div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

const HUDUnit = ({ label, value, color }: any) => (
    <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center text-center">
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">{label}</span>
        <span className={`text-xl font-black tracking-tighter text-${color}-400 font-mono`}>{value}</span>
    </div>
);

const KPICard = ({ title, value, icon: Icon, color, alert }: any) => (
    <div className={`p-10 bg-slate-900 border rounded-[3rem] transition-all hover:scale-[1.02] group relative overflow-hidden ${alert ? 'border-rose-500/40 bg-rose-950/10 shadow-[0_20px_50px_rgba(244,63,94,0.1)]' : 'border-white/5 hover:border-primary-500/30'}`}>
        <div className="flex justify-between items-start mb-8 relative z-10">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">{title}</span>
            <div className={`p-4 rounded-2xl ${alert ? 'bg-rose-500 text-white' : `bg-${color}-500/10 text-${color}-400`}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <p className="text-5xl font-black text-white tracking-tighter relative z-10 uppercase italic">{value}</p>
    </div>
);

export default Dashboard;
