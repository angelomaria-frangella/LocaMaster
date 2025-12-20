
import { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  AlertTriangle, Euro, Briefcase, Zap, TrendingUp, 
  FilePlus, Clock, Database, ShieldAlert, Activity, 
  Radio, Cpu, Crosshair, BarChart3, Scan, Layers, Wifi
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
          {/* Subtle Radar Background Effect */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary-500/20 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary-500/10 rounded-full"></div>
          </div>
          
          <div className="relative z-10 p-10 lg:p-16 flex flex-col xl:flex-row justify-between gap-12">
              <div className="space-y-10 flex-1">
                  {/* Status Bar */}
                  <div className="flex flex-wrap items-center gap-6">
                      <div className="font-mono text-primary-400 bg-primary-950/40 border border-primary-500/20 px-5 py-2 rounded-xl text-xl font-black tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.1)] flex items-center gap-3">
                          <Clock className="w-5 h-5 text-primary-500 animate-pulse" />
                          MISSION: {missionTime}
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${systemStatus.db ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          <Wifi className={`w-3.5 h-3.5 ${systemStatus.db ? 'animate-pulse' : ''}`} />
                          CLOUD_LINK: {systemStatus.db ? 'ESTABLISHED' : 'LOCAL_MODE'}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <Layers className="w-3.5 h-3.5" /> OS: LOCAMASTER_V1.9.5
                      </div>
                  </div>
                  
                  {/* Hero Title */}
                  <div className="relative">
                    <h1 className="text-8xl lg:text-[11rem] font-black text-white tracking-tighter leading-[0.85] italic uppercase select-none">
                        PRIME<span className="text-primary-500 not-italic">.</span>
                    </h1>
                    <div className="absolute -bottom-4 left-2 flex items-center gap-3">
                        <div className="w-12 h-1 bg-primary-600"></div>
                        <p className="text-slate-400 font-bold text-xl uppercase tracking-[0.5em]">Command & Intel Hub</p>
                    </div>
                  </div>

                  {/* HUD Gauges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                      <HUDUnit label="SYS_LOAD" value="0.04" unit="ms" color="emerald" />
                      <HUDUnit label="NODES" value="ACTIVE" unit="" color="indigo" />
                      <HUDUnit label="ASSETS" value={contracts.length.toString().padStart(2, '0')} unit="PCS" color="primary" />
                      <HUDUnit label="CRITICAL" value={stats.criticalDeadlines.toString().padStart(2, '0')} unit="EVT" color={stats.criticalDeadlines > 0 ? "rose" : "emerald"} />
                  </div>
              </div>

              {/* Action Side */}
              <div className="flex flex-col gap-6 min-w-[360px] justify-center lg:items-end">
                  <button onClick={onAddContract} className="w-full group relative py-12 px-10 bg-primary-600 hover:bg-primary-500 text-white rounded-[3rem] font-black text-4xl shadow-2xl flex flex-col items-center justify-center gap-4 transition-all active:scale-95 border-t border-white/20 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center gap-5 relative z-10">
                        <FilePlus className="w-10 h-10 group-hover:rotate-12 transition-transform" /> 
                        NEW PRATICA
                      </div>
                      <span className="text-xs opacity-50 tracking-[0.6em] font-black relative z-10 uppercase">Security protocol enabled</span>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                      <button onClick={() => setIsReportModalOpen(true)} className="py-6 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-[2rem] font-black text-xs flex flex-col items-center justify-center gap-3 transition-all border border-white/5 backdrop-blur-xl group">
                          <Zap className="w-6 h-6 text-amber-500 group-hover:scale-125 transition-transform" /> FISCAL INTEL
                      </button>
                      <button className="py-6 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-[2rem] font-black text-xs flex flex-col items-center justify-center gap-3 transition-all border border-white/5 backdrop-blur-xl group">
                          <Cpu className="w-6 h-6 text-primary-500 group-hover:rotate-180 transition-transform duration-700" /> SYS DIAGNOSTIC
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
                    <h3 className="font-black text-white text-3xl uppercase tracking-tighter flex items-center gap-4 italic">
                        <Radio className="w-10 h-10 text-primary-500 animate-pulse" /> Neural Strategy
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black tracking-[0.3em] ml-14 uppercase">Predictive engine active</p>
                  </div>
                  <div className="flex gap-1.5 h-6">
                      {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 rounded-full ${i % 2 === 0 ? 'bg-primary-500/40 animate-bounce' : 'bg-primary-500/10'}`} style={{animationDelay: `${i * 0.2}s`}}></div>)}
                  </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                  {isInsightsLoading ? (
                      [1,2].map(i => <div key={i} className="h-28 bg-white/5 rounded-[2rem] animate-pulse"></div>)
                  ) : aiInsights.length > 0 ? (
                      aiInsights.map((insight, i) => (
                          <div key={i} className={`group p-8 rounded-[2.5rem] border flex gap-8 items-center transition-all hover:translate-x-3 ${insight.category === 'RISCHIO' ? 'bg-rose-500/5 border-rose-500/20 text-rose-100 hover:border-rose-500/40' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-100 hover:border-emerald-500/40'}`}>
                              <div className={`p-5 rounded-2xl transition-all duration-500 ${insight.category === 'RISCHIO' ? 'bg-rose-950 text-rose-400 group-hover:bg-rose-500 group-hover:text-white' : 'bg-emerald-950 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                                  {insight.category === 'RISCHIO' ? <ShieldAlert className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}
                              </div>
                              <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                      <span className={`text-[10px] font-black uppercase tracking-[0.4em] px-3 py-1 rounded-full border ${insight.category === 'RISCHIO' ? 'border-rose-500/30 text-rose-500' : 'border-emerald-500/30 text-emerald-500'}`}>{insight.category}</span>
                                      <div className="h-px flex-1 bg-white/5"></div>
                                  </div>
                                  <p className="text-xl font-bold leading-snug">{insight.text}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                    <div className="py-16 text-center text-slate-600 italic font-black text-xl tracking-tighter uppercase">Initializing global scanning...</div>
                  )}
              </div>
          </div>

          {/* System Health Gauge */}
          <div className="p-12 bg-slate-900 border border-white/5 rounded-[4rem] flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl backdrop-blur-3xl group">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
               <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-500 tracking-[0.6em] uppercase">SYSTEM PERFORMANCE</span>
                    <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Optimized</p>
               </div>
               
               <div className="relative py-12">
                   <div className="text-emerald-400 font-black text-[10rem] tracking-tighter leading-none relative z-10 drop-shadow-[0_0_40px_rgba(52,211,153,0.4)]">98</div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-emerald-500/10 blur-[80px] rounded-full animate-glow"></div>
                   <div className="absolute top-0 right-0 p-3 rounded-full bg-slate-850 border border-white/10 animate-spin-slow">
                        <Scan className="w-6 h-6 text-primary-400" />
                   </div>
               </div>
               
               <div className="w-full space-y-4">
                   <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-white/5 p-1">
                       <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full w-[98%] shadow-[0_0_25px_rgba(16,185,129,0.5)]"></div>
                   </div>
                   <div className="flex justify-between items-center px-2">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> PEAK ACTIVE
                        </p>
                        <p className="text-[10px] font-black text-slate-600 uppercase">UPTIME: 99.9%</p>
                   </div>
               </div>
          </div>
      </div>

      {/* KPI HUD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <KPICard title="Revenue Projection" value={`€ ${stats.totalRevenue.toLocaleString('it-IT')}`} icon={Euro} color="emerald" subtext="Calculated per annum" />
          <KPICard title="Portfolio Nodes" value={stats.activeCount} icon={Briefcase} color="primary" subtext="Live instances" />
          <KPICard title="Active Threats" value={stats.criticalDeadlines} icon={AlertTriangle} color="rose" alert={stats.criticalDeadlines > 0} subtext="Requires immediate action" />
      </div>

      {/* DATA FLOW & RADAR TARGETS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 p-12 bg-slate-900/40 border border-white/5 rounded-[4rem] shadow-2xl backdrop-blur-3xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-14">
                  <h3 className="font-black text-white text-3xl flex items-center gap-5 uppercase tracking-tighter italic">
                      <Activity className="w-10 h-10 text-primary-500"/> Activity Stream
                  </h3>
                  <div className="bg-slate-850 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 tracking-widest">REALTIME_TELEMETRY</div>
              </div>
              <div className="h-[26rem] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workloadData}>
                          <defs>
                              <linearGradient id="ultraGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: '900'}} dy={15} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: '900'}} dx={-10} />
                          <Tooltip 
                            contentStyle={{backgroundColor: '#020617', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '15px'}}
                            cursor={{stroke: '#6366f1', strokeWidth: 3, strokeDasharray: '5 5'}}
                          />
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={6} fillOpacity={1} fill="url(#ultraGradient)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
          
          <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)] opacity-50"></div>
              <h3 className="font-black text-white text-3xl mb-12 flex items-center gap-5 uppercase tracking-tighter italic relative z-10">
                  <Crosshair className="w-10 h-10 text-rose-500 animate-spin-slow"/> Radar Target
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-[22rem] pr-2 scrollbar-hide relative z-10">
                  {deadlines.slice(0, 10).map(d => (
                      <div key={d.id} className="p-5 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between group/item hover:bg-white/10 transition-all border-l-8 border-l-transparent hover:border-l-primary-500 shadow-lg">
                          <div className="flex gap-4 items-center">
                              <div className={`w-3 h-3 rounded-full ${d.urgency === 'critical' ? 'bg-rose-500 animate-pulse-fast' : 'bg-primary-500/30'}`}></div>
                              <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{d.date}</p>
                                  <p className="text-base font-black text-white truncate uppercase max-w-[160px] tracking-tight">{d.type}</p>
                              </div>
                          </div>
                          <div className="p-2 bg-slate-900 rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity">
                               <ArrowRight className="w-4 h-4 text-primary-500" />
                          </div>
                      </div>
                  ))}
                  {deadlines.length === 0 && <div className="py-20 text-center opacity-20 font-black uppercase tracking-widest italic">Clear Sky</div>}
              </div>
          </div>
      </div>
    </div>
  );
};

// Sub-components for better readability
const HUDUnit = ({ label, value, unit, color }: any) => (
    <div className="p-5 bg-black/50 border border-white/5 rounded-[1.5rem] flex flex-col items-center justify-center text-center shadow-inner group hover:border-primary-500/30 transition-colors">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black tracking-tighter text-${color}-400 font-mono group-hover:scale-110 transition-transform`}>{value}</span>
            {unit && <span className="text-[10px] font-bold text-slate-600 mb-1">{unit}</span>}
        </div>
    </div>
);

const KPICard = ({ title, value, icon: Icon, color, alert, subtext }: any) => (
    <div className={`p-12 bg-slate-900 border rounded-[3.5rem] transition-all hover:scale-[1.03] hover:-translate-y-2 group relative overflow-hidden shadow-2xl ${alert ? 'border-rose-500/40 bg-rose-950/10 shadow-[0_30px_60px_rgba(244,63,94,0.15)]' : 'border-white/5 hover:border-primary-500/40'}`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors"></div>
        <div className="flex justify-between items-start mb-10 relative z-10">
            <div className="space-y-1">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em]">{title}</span>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{subtext}</p>
            </div>
            <div className={`p-5 rounded-[1.8rem] shadow-2xl transition-all duration-500 group-hover:rotate-[360deg] ${alert ? 'bg-rose-500 text-white shadow-rose-500/40' : `bg-${color}-500 text-white shadow-${color}-500/40`}`}>
                <Icon className="w-8 h-8" />
            </div>
        </div>
        <p className={`text-6xl font-black text-white tracking-tighter relative z-10 uppercase italic transition-all duration-500 group-hover:translate-x-2 ${alert ? 'animate-pulse' : ''}`}>{value}</p>
    </div>
);

const ArrowRight = ({ className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

export default Dashboard;
