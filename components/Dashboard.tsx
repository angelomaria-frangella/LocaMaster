
import { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  AlertTriangle, Euro, Briefcase, Zap, TrendingUp, 
  FilePlus, Clock, Database, ShieldAlert, Activity, 
  Radio, Cpu, Crosshair, BarChart3, Scan, Layers, Wifi, Terminal, ChevronRight
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
  const [missionTime, setMissionTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setMissionTime(now.toLocaleTimeString('it-IT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

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
    <div className="space-y-10 animate-in fade-in duration-1000 pb-24">
      {isReportModalOpen && <ReportGenerator contracts={contracts} onClose={() => setIsReportModalOpen(false)} aiEnabled={aiEnabled} />}

      {/* --- ELITE COCKPIT SECTION --- */}
      <section className="relative p-1 rounded-[4rem] bg-slate-950 border border-white/10 shadow-[0_60px_120px_-20px_rgba(0,0,0,1)] overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-primary-600/5 blur-[120px] rounded-full"></div>
          
          <div className="relative z-10 p-10 lg:p-16 flex flex-col xl:flex-row justify-between gap-12">
              <div className="space-y-12 flex-1">
                  {/* Status Bar */}
                  <div className="flex flex-wrap items-center gap-6">
                      <div className="font-mono text-primary-400 bg-primary-950/50 border border-primary-500/20 px-6 py-2.5 rounded-2xl text-2xl font-black tracking-tighter shadow-[0_0_25px_rgba(99,102,241,0.2)] flex items-center gap-4">
                          <Clock className="w-6 h-6 text-primary-500 animate-pulse" />
                          {missionTime}
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${systemStatus.db ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          <Wifi className={`w-3.5 h-3.5 ${systemStatus.db ? 'animate-pulse' : ''}`} />
                          CLOUD_STATUS: {systemStatus.db ? 'CONNECTED' : 'STANDALONE'}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <Terminal className="w-3.5 h-3.5" /> TITAN_OS_V2.0
                      </div>
                  </div>
                  
                  {/* Hero Title */}
                  <div className="relative">
                    <h1 className="text-8xl lg:text-[12rem] font-black text-white tracking-tighter leading-[0.8] italic uppercase select-none drop-shadow-[0_10px_30px_rgba(0,0,0,1)]">
                        TITAN<span className="text-primary-500 not-italic">.</span>
                    </h1>
                    <div className="absolute -bottom-6 left-2 flex items-center gap-4">
                        <div className="w-16 h-1.5 bg-primary-600"></div>
                        <p className="text-slate-400 font-bold text-2xl uppercase tracking-[0.4em]">Strategic Control Hub</p>
                    </div>
                  </div>

                  {/* HUD Gauges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16">
                      <HUDUnit label="SYS_TELEMETRY" value="OPTIMIZED" color="emerald" />
                      <HUDUnit label="NODES_LINK" value="SECURE" color="indigo" />
                      <HUDUnit label="ASSETS_DB" value={contracts.length.toString().padStart(2, '0')} color="primary" />
                      <HUDUnit label="CRITICAL_ALERTS" value={stats.criticalDeadlines.toString().padStart(2, '0')} color={stats.criticalDeadlines > 0 ? "rose" : "emerald"} />
                  </div>
              </div>

              {/* Action Side */}
              <div className="flex flex-col gap-8 min-w-[380px] justify-center lg:items-end">
                  <button onClick={onAddContract} className="w-full group relative py-14 px-10 bg-primary-600 hover:bg-primary-500 text-white rounded-[3.5rem] font-black text-5xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] flex flex-col items-center justify-center gap-4 transition-all active:scale-95 border-t border-white/20 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center gap-5 relative z-10 italic">
                        <FilePlus className="w-12 h-12 group-hover:rotate-12 transition-transform" /> 
                        NEW ASSET
                      </div>
                      <span className="text-xs opacity-50 tracking-[0.6em] font-black relative z-10 uppercase italic">Initialization sequence ready</span>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-5 w-full">
                      <button onClick={() => setIsReportModalOpen(true)} className="py-8 bg-slate-900 border border-white/10 hover:border-amber-500/50 text-slate-300 rounded-[2.5rem] font-black text-sm flex flex-col items-center justify-center gap-3 transition-all hover:bg-slate-800 group">
                          <Zap className="w-8 h-8 text-amber-500 group-hover:scale-125 transition-transform" /> FISCAL INTEL
                      </button>
                      <button className="py-8 bg-slate-900 border border-white/10 hover:border-primary-500/50 text-slate-300 rounded-[2.5rem] font-black text-sm flex flex-col items-center justify-center gap-3 transition-all hover:bg-slate-800 group">
                          <Cpu className="w-8 h-8 text-primary-500 group-hover:rotate-180 transition-transform duration-1000" /> DIAGNOSTICS
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* --- INTELLIGENCE GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* AI Neural Analysis */}
          <div className="lg:col-span-2 p-12 bg-slate-900 border border-white/5 rounded-[4rem] relative overflow-hidden shadow-2xl backdrop-blur-3xl">
              <div className="flex items-center justify-between mb-12">
                  <div className="space-y-1">
                    <h3 className="font-black text-white text-3xl uppercase tracking-tighter flex items-center gap-5 italic">
                        <Radio className="w-10 h-10 text-primary-500 animate-pulse" /> Neural Strategy
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black tracking-[0.4em] ml-16 uppercase italic">Generative engine: Gemini 2.5 Flash</p>
                  </div>
                  <div className="flex gap-2 h-8 items-end">
                      {[1,2,3,4,5,6].map(i => <div key={i} className={`w-2 rounded-full ${i % 2 === 0 ? 'bg-primary-500 animate-bounce' : 'bg-primary-500/20'}`} style={{height: `${10 + Math.random() * 20}px`, animationDelay: `${i * 0.1}s`}}></div>)}
                  </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                  {isInsightsLoading ? (
                      [1,2].map(i => <div key={i} className="h-32 bg-white/5 rounded-[2.5rem] animate-pulse"></div>)
                  ) : aiInsights.length > 0 ? (
                      aiInsights.map((insight, i) => (
                          <div key={i} className={`group p-8 rounded-[3rem] border flex gap-10 items-center transition-all hover:translate-x-4 ${insight.category === 'RISCHIO' ? 'bg-rose-500/5 border-rose-500/20 text-rose-100 hover:border-rose-500/40' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-100 hover:border-emerald-500/40'}`}>
                              <div className={`p-6 rounded-[2rem] transition-all duration-700 ${insight.category === 'RISCHIO' ? 'bg-rose-950 text-rose-400 group-hover:bg-rose-500 group-hover:text-white' : 'bg-emerald-950 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                                  {insight.category === 'RISCHIO' ? <ShieldAlert className="w-10 h-10" /> : <TrendingUp className="w-10 h-10" />}
                              </div>
                              <div className="flex-1">
                                  <div className="flex items-center gap-4 mb-3">
                                      <span className={`text-[10px] font-black uppercase tracking-[0.5em] px-4 py-1.5 rounded-full border ${insight.category === 'RISCHIO' ? 'border-rose-500/30 text-rose-500' : 'border-emerald-500/30 text-emerald-500'}`}>{insight.category} ANALYTICS</span>
                                      <div className="h-px flex-1 bg-white/10"></div>
                                  </div>
                                  <p className="text-2xl font-bold leading-tight tracking-tight">{insight.text}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                    <div className="py-24 text-center text-slate-700 italic font-black text-2xl tracking-widest uppercase animate-pulse">Scanning global markets...</div>
                  )}
              </div>
          </div>

          {/* System Performance */}
          <div className="p-12 bg-slate-900 border border-white/5 rounded-[4rem] flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl backdrop-blur-3xl group">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
               <div className="space-y-1">
                    <span className="text-[12px] font-black text-slate-500 tracking-[0.6em] uppercase">SYSTEM_LOAD</span>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Efficiency: 99.8%</p>
               </div>
               
               <div className="relative py-14">
                   <div className="text-emerald-400 font-black text-[12rem] tracking-tighter leading-none relative z-10 drop-shadow-[0_0_50px_rgba(52,211,153,0.5)] italic">98</div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[90px] rounded-full animate-glow"></div>
                   <div className="absolute -top-4 -right-4 p-4 rounded-3xl bg-slate-850 border border-white/10 animate-spin-slow">
                        <Scan className="w-8 h-8 text-primary-400" />
                   </div>
               </div>
               
               <div className="w-full space-y-5">
                   <div className="h-5 bg-black rounded-full overflow-hidden border border-white/10 p-1">
                       <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full w-[98%] shadow-[0_0_30px_rgba(16,185,129,0.5)]"></div>
                   </div>
                   <div className="flex justify-between items-center px-2">
                        <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> STATUS_OK
                        </p>
                        <p className="text-[11px] font-black text-slate-600 uppercase">UPTIME: 24/7</p>
                   </div>
               </div>
          </div>
      </div>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <KPICard title="Revenue Flow" value={`€ ${stats.totalRevenue.toLocaleString('it-IT')}`} icon={Euro} color="emerald" sub="Projected Annual" />
          <KPICard title="Active Nodes" value={stats.activeCount} icon={Briefcase} color="primary" sub="Live Contracts" />
          <KPICard title="Critical Targets" value={stats.criticalDeadlines} icon={AlertTriangle} color="rose" alert={stats.criticalDeadlines > 0} sub="Requires Action" />
      </div>

      {/* RADAR & ACTIVITY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 p-12 bg-slate-900/60 border border-white/5 rounded-[4rem] shadow-2xl backdrop-blur-3xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-16">
                  <h3 className="font-black text-white text-3xl flex items-center gap-6 uppercase tracking-tighter italic">
                      <Activity className="w-12 h-12 text-primary-500 animate-pulse"/> Activity Stream
                  </h3>
                  <div className="bg-slate-850 border border-white/10 px-6 py-2 rounded-full text-[11px] font-black text-slate-500 tracking-widest uppercase">Telemetry v2.0</div>
              </div>
              <div className="h-[30rem] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workloadData}>
                          <defs>
                              <linearGradient id="primeGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="5 5" stroke="#ffffff08" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: '900'}} dy={20} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: '900'}} dx={-15} />
                          <Tooltip 
                            contentStyle={{backgroundColor: '#020617', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}
                            cursor={{stroke: '#6366f1', strokeWidth: 4, strokeDasharray: '10 10'}}
                          />
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={8} fillOpacity={1} fill="url(#primeGradient)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
          
          <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px]"></div>
              <h3 className="font-black text-white text-3xl mb-14 flex items-center gap-6 uppercase tracking-tighter italic relative z-10">
                  <Crosshair className="w-12 h-12 text-rose-500 animate-spin-slow"/> Radar Target
              </h3>
              <div className="space-y-5 overflow-y-auto max-h-[25rem] pr-3 scrollbar-hide relative z-10">
                  {deadlines.slice(0, 10).map(d => (
                      <div key={d.id} className="p-6 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-between group/item hover:bg-white/10 transition-all border-l-8 border-l-transparent hover:border-l-primary-500 shadow-xl">
                          <div className="flex gap-5 items-center">
                              <div className={`w-4 h-4 rounded-full ${d.urgency === 'critical' ? 'bg-rose-500 animate-pulse-fast' : 'bg-primary-500/40'}`}></div>
                              <div>
                                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">{d.date}</p>
                                  <p className="text-lg font-black text-white truncate uppercase max-w-[180px] tracking-tight italic">{d.type}</p>
                              </div>
                          </div>
                          <div className="p-3 bg-slate-900 rounded-2xl opacity-0 group-hover/item:opacity-100 transition-all group-hover/item:translate-x-1">
                               <ChevronRight className="w-5 h-5 text-primary-500" />
                          </div>
                      </div>
                  ))}
                  {deadlines.length === 0 && <div className="py-24 text-center opacity-20 font-black uppercase tracking-[0.5em] italic">Sector Clear</div>}
              </div>
          </div>
      </div>
    </div>
  );
};

const HUDUnit = ({ label, value, color }: any) => (
    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner group hover:border-primary-500/30 transition-all">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">{label}</span>
        <span className={`text-2xl font-black tracking-tighter text-${color}-400 font-mono group-hover:scale-110 transition-transform italic`}>{value}</span>
    </div>
);

const KPICard = ({ title, value, icon: Icon, color, alert, sub }: any) => (
    <div className={`p-12 bg-slate-900 border rounded-[3.5rem] transition-all hover:scale-[1.03] hover:-translate-y-2 group relative overflow-hidden shadow-2xl ${alert ? 'border-rose-500/40 bg-rose-950/20 shadow-[0_40px_80px_rgba(244,63,94,0.2)]' : 'border-white/5 hover:border-primary-500/40'}`}>
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-white/5 rounded-full blur-[80px] group-hover:bg-primary-500/10 transition-colors"></div>
        <div className="flex justify-between items-start mb-12 relative z-10">
            <div className="space-y-1">
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.6em]">{title}</span>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{sub}</p>
            </div>
            <div className={`p-6 rounded-[2rem] shadow-2xl transition-all duration-700 group-hover:rotate-[360deg] ${alert ? 'bg-rose-500 text-white shadow-rose-500/50' : `bg-${color}-500 text-white shadow-${color}-500/50`}`}>
                <Icon className="w-10 h-10" />
            </div>
        </div>
        <p className={`text-7xl font-black text-white tracking-tighter relative z-10 uppercase italic transition-all duration-700 group-hover:translate-x-3 ${alert ? 'animate-pulse' : ''}`}>{value}</p>
    </div>
);

export default Dashboard;
