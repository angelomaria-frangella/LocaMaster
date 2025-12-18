
import { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  AlertTriangle, Euro, Briefcase, Zap, TrendingUp, 
  FilePlus, BrainCircuit, Clock, Database, ShieldAlert, Target, Activity, Key,
  Radio, Cpu, Layout, Globe
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

  useEffect(() => {
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

      {/* --- TITAN COCKPIT HEADER --- */}
      <div className="relative p-1 rounded-[4rem] bg-gradient-to-br from-slate-800 via-slate-950 to-slate-900 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-600/5 blur-[120px] rounded-full"></div>
          
          <div className="relative z-10 p-10 lg:p-14 flex flex-col xl:flex-row justify-between gap-12">
              <div className="space-y-8 flex-1">
                  <div className="flex flex-wrap gap-3">
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${systemStatus.db ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${systemStatus.db ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                          SYSTEM: {systemStatus.db ? 'ONLINE' : 'LOCAL_MODE'}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                          <Radio className="w-3 h-3 animate-pulse" /> ENGINE: {systemStatus.pro ? 'PRO_TITAN' : 'FLASH_CORE'}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/40 bg-primary-500/20 text-[9px] font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                          <Cpu className="w-3 h-3" /> V1.8.0 TITAN EDITION
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tighter leading-none italic uppercase">
                        Master<br/><span className="text-primary-500 not-italic">Cockpit.</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-primary-500/50 to-transparent"></div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.3em]">Telemetry Active Unit 01</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <TelemetryUnit label="DB SYNC" value={systemStatus.db ? "STABLE" : "OFF"} color={systemStatus.db ? "emerald" : "rose"} />
                      <TelemetryUnit label="IA CORES" value={systemStatus.pro ? "32x" : "8x"} color="indigo" />
                      <TelemetryUnit label="ASSETS" value={contracts.length.toString()} color="primary" />
                      <TelemetryUnit label="THREATS" value={stats.criticalDeadlines.toString()} color={stats.criticalDeadlines > 0 ? "rose" : "emerald"} />
                  </div>
              </div>

              <div className="flex flex-col gap-4 min-w-[340px] justify-center relative">
                  <div className="absolute -inset-4 bg-primary-500/5 blur-3xl rounded-full"></div>
                  <button onClick={onAddContract} className="relative w-full py-10 bg-primary-600 hover:bg-primary-500 text-white rounded-[3rem] font-black text-2xl shadow-[0_20px_40px_rgba(79,70,229,0.4)] flex items-center justify-center gap-6 transition-all active:scale-95 group/btn border-t border-white/20">
                      <FilePlus className="w-10 h-10 group-hover/btn:rotate-90 transition-transform duration-500" /> NUOVA PRATICA
                  </button>
                  <button onClick={() => setIsReportModalOpen(true)} className="relative w-full py-6 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-4 transition-all border border-white/10 backdrop-blur-md">
                      <Zap className="w-6 h-6 text-amber-400" /> SMART REPORT AI
                  </button>
              </div>
          </div>
      </div>

      {/* --- DASHBOARD GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI INSIGHTS BOX */}
          <div className="lg:col-span-2 p-10 bg-slate-900/40 border border-white/5 rounded-[4rem] relative overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="absolute top-0 right-0 p-8 opacity-10"><BrainCircuit className="w-32 h-32 text-primary-500" /></div>
              <h3 className="font-black text-white text-2xl uppercase tracking-tighter flex items-center gap-5 italic mb-10">
                  <Radio className="w-8 h-8 text-primary-400 animate-pulse" /> Mission Briefing
              </h3>
              <div className="grid grid-cols-1 gap-5">
                  {isInsightsLoading ? (
                      [1,2].map(i => <div key={i} className="h-24 bg-white/5 rounded-[2rem] animate-pulse"></div>)
                  ) : aiInsights.length > 0 ? (
                      aiInsights.map((insight, i) => (
                          <div key={i} className={`p-6 rounded-[2.5rem] border flex gap-6 items-center transition-all hover:bg-white/5 ${insight.category === 'RISCHIO' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                              <div className={`p-4 rounded-2xl bg-black/40 ${insight.category === 'RISCHIO' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {insight.category === 'RISCHIO' ? <ShieldAlert className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                              </div>
                              <div className="flex-1">
                                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-1 block">{insight.category}</span>
                                  <p className="text-lg font-bold text-white/90 leading-tight">{insight.text}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                    <div className="py-10 text-center opacity-30">In attesa di parametri di volo...</div>
                  )}
              </div>
          </div>

          {/* HEALTH INDICATOR */}
          <div className="p-10 bg-slate-900/40 border border-white/5 rounded-[4rem] flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl backdrop-blur-xl">
               <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent"></div>
               <span className="text-[10px] font-black text-slate-500 tracking-[0.5em] uppercase relative z-10">UNIT READINESS</span>
               <div className="relative py-10">
                   <div className="text-emerald-400 font-black text-9xl tracking-tighter leading-none relative z-10">98<span className="text-3xl">%</span></div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 blur-[50px] rounded-full animate-pulse"></div>
               </div>
               <div className="w-full space-y-4 relative z-10">
                   <div className="h-4 bg-black/50 rounded-full overflow-hidden p-1 border border-white/5">
                       <div className="h-full bg-emerald-500 rounded-full w-[98%] shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                   </div>
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Operational Capacity Optimized</p>
               </div>
          </div>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <KPICard title="Revenue" value={`€ ${stats.totalRevenue.toLocaleString('it-IT')}`} icon={Euro} color="emerald" />
          <KPICard title="Portfolio" value={stats.activeCount} icon={Briefcase} color="primary" />
          <KPICard title="Threats" value={stats.criticalDeadlines} icon={AlertTriangle} color="rose" alert={stats.criticalDeadlines > 0} />
      </div>

      {/* CHARTS AND RADAR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 p-10 bg-slate-900/40 border border-white/5 rounded-[4rem] shadow-3xl backdrop-blur-xl">
              <h3 className="font-black text-white text-2xl mb-10 flex items-center gap-4 uppercase tracking-tighter italic">
                  <Activity className="w-8 h-8 text-primary-500"/> Volume Projection
              </h3>
              <div className="h-[24rem] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workloadData}>
                          <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '900'}} dy={15} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '900'}} dx={-10} />
                          <Tooltip 
                            contentStyle={{backgroundColor: '#020617', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff'}}
                          />
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
          
          <div className="bg-slate-900/60 border border-white/5 rounded-[4rem] p-10 shadow-3xl backdrop-blur-xl">
              <h3 className="font-black text-white text-2xl mb-10 flex items-center gap-4 uppercase tracking-tighter italic">
                  <Target className="w-8 h-8 text-rose-500"/> Radar Scan
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-[20rem] scrollbar-hide">
                  {deadlines.slice(0, 6).map(d => (
                      <div key={d.id} className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all">
                          <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{d.date}</p>
                              <p className="text-sm font-black text-white truncate uppercase">{d.type}</p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${d.urgency === 'critical' ? 'bg-rose-500 animate-ping' : 'bg-primary-500'}`}></div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

const TelemetryUnit = ({ label, value, color }: any) => (
    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
        <span className={`text-lg font-black tracking-tighter text-${color}-400`}>{value}</span>
    </div>
);

const KPICard = ({ title, value, icon: Icon, color, alert }: any) => (
    <div className={`p-10 bg-slate-900 border rounded-[3rem] transition-all hover:scale-[1.02] group relative overflow-hidden ${alert ? 'border-rose-500/40 bg-rose-950/10' : 'border-white/5 hover:border-primary-500/30'}`}>
        <div className="flex justify-between items-start mb-8 relative z-10">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
            <div className={`p-4 rounded-2xl ${alert ? 'bg-rose-500 text-white' : `bg-${color}-500/10 text-${color}-400`}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <p className="text-5xl font-black text-white tracking-tighter relative z-10">{value}</p>
    </div>
);

export default Dashboard;
