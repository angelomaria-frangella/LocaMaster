
import { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  AlertTriangle, Euro, Briefcase, Zap, TrendingUp, 
  FilePlus, BrainCircuit, Clock, Database, ShieldAlert, Target, Activity, Key
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

  const getInsightIcon = (category: string) => {
    switch (category.toUpperCase()) {
        case 'RISCHIO': return <ShieldAlert className="w-5 h-5 text-rose-400" />;
        case 'RENDIMENTO': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
        default: return <Target className="w-5 h-5 text-primary-400" />;
    }
  };

  const getInsightBg = (category: string) => {
    switch (category.toUpperCase()) {
        case 'RISCHIO': return 'bg-rose-500/10 border-rose-500/20 text-rose-100';
        case 'RENDIMENTO': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100';
        default: return 'bg-primary-500/10 border-primary-500/20 text-primary-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-20">
      {isReportModalOpen && <ReportGenerator contracts={contracts} onClose={() => setIsReportModalOpen(false)} aiEnabled={aiEnabled} />}

      <div className="relative p-10 lg:p-16 rounded-[3rem] lg:rounded-[5rem] bg-slate-950 border border-white/10 shadow-3xl overflow-hidden group">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-12">
              <div className="space-y-10">
                  <div className="flex flex-wrap gap-4">
                      <div className={`flex items-center gap-2.5 px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${systemStatus.db ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          <Database className="w-3.5 h-3.5" /> CLOUD: {systemStatus.db ? 'CONNECTED' : 'LOCAL'}
                      </div>
                      <div className={`flex items-center gap-2.5 px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${systemStatus.pro ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                          <Key className="w-3.5 h-3.5" /> AI ENGINE: {systemStatus.pro ? 'PROFESSIONAL' : 'FREE TIER'}
                      </div>
                      <div className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 text-[10px] font-black uppercase tracking-widest text-primary-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                          <Activity className="w-3.5 h-3.5 text-primary-500 animate-pulse" /> V1.5.0 - STABLE MASTER
                      </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-7xl lg:text-9xl font-black text-white tracking-tighter leading-[0.85] italic drop-shadow-2xl">
                        Executive<br/><span className="text-primary-500 not-italic">Command.</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xl max-w-lg border-l-4 border-primary-500/40 pl-8 py-3 leading-relaxed">
                        Benvenuto, Dott. Frangella.<br/><span className="text-white">Radar attivo su {contracts.length} asset.</span>
                    </p>
                  </div>
              </div>

              <div className="flex flex-col gap-5 min-w-[320px] justify-center">
                  <button onClick={onAddContract} className="w-full py-8 bg-primary-600 hover:bg-primary-500 text-white rounded-[2.5rem] font-black text-2xl shadow-xl flex items-center justify-center gap-5 transition-all active:scale-95 group/btn">
                      <FilePlus className="w-10 h-10 group-hover/btn:rotate-12 transition-transform" /> NUOVA PRATICA
                  </button>
                  <button onClick={() => setIsReportModalOpen(true)} className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-4 transition-all border border-white/10 shadow-2xl">
                      <Zap className="w-6 h-6 text-amber-400 shadow-amber-400/50" /> SMART REPORT AI
                  </button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-12 bg-slate-900/50 border border-white/5 rounded-[4rem] relative overflow-hidden shadow-2xl backdrop-blur-xl">
              <h3 className="font-black text-white text-3xl uppercase tracking-tighter flex items-center gap-6 italic mb-10">
                  <BrainCircuit className="w-12 h-12 text-primary-400 animate-pulse" /> Mission Intel Briefing
              </h3>
              <div className="grid grid-cols-1 gap-6">
                  {isInsightsLoading ? (
                      [1,2,3].map(i => <div key={i} className="h-28 bg-white/5 rounded-[2.5rem] animate-pulse"></div>)
                  ) : aiInsights.length > 0 ? (
                      aiInsights.map((insight, i) => (
                          <div key={i} className={`p-8 rounded-[3rem] border flex gap-8 items-start transition-all hover:translate-x-4 hover:bg-white/5 ${getInsightBg(insight.category)} shadow-xl`}>
                              <div className="p-5 rounded-3xl bg-black/40 mt-1 shadow-2xl border border-white/5">{getInsightIcon(insight.category)}</div>
                              <div className="flex-1">
                                  <span className="text-[11px] font-black uppercase tracking-[0.5em] opacity-60 mb-3 block">{insight.category}</span>
                                  <p className="text-xl font-bold leading-relaxed text-white/95">{insight.text}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                    <div className="py-20 text-center space-y-6 opacity-40">
                        <ShieldAlert className="w-16 h-16 text-slate-700 mx-auto" />
                        <p className="text-slate-500 font-black italic uppercase tracking-[0.4em] text-sm">Parametri IA in fase di sincronizzazione...</p>
                    </div>
                  )}
              </div>
          </div>

          <div className="p-12 bg-slate-900/50 border border-white/10 rounded-[4rem] flex flex-col justify-between text-center relative overflow-hidden shadow-2xl backdrop-blur-xl">
               <span className="text-[12px] font-black text-slate-500 tracking-[0.6em] uppercase">PORTFOLIO HEALTH</span>
               <div className="py-12">
                   <div className="text-emerald-400 font-black text-[10rem] tracking-tighter leading-none drop-shadow-xl">98<span className="text-4xl ml-1">.4%</span></div>
                   <div className="flex justify-center gap-3 mt-8 text-emerald-500 font-black text-sm tracking-[0.3em] uppercase bg-emerald-500/10 py-3 px-6 rounded-full w-fit mx-auto border border-emerald-500/20">
                       <TrendingUp className="w-5 h-5" /> +1.2% VS PREV
                   </div>
               </div>
               <div className="space-y-8">
                   <div className="h-6 bg-slate-950 rounded-full overflow-hidden border border-white/10 p-1.5 shadow-2xl">
                       <div className="h-full bg-gradient-to-r from-primary-600 via-indigo-400 to-emerald-400 rounded-full w-[98.4%] shadow-lg"></div>
                   </div>
                   <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Readiness Status</p>
               </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <KPICard title="Revenue Annuale" value={`€ ${stats.totalRevenue.toLocaleString('it-IT')}`} icon={Euro} color="emerald" />
          <KPICard title="Asset Attivi" value={stats.activeCount} icon={Briefcase} color="primary" />
          <KPICard title="Alert Critici" value={stats.criticalDeadlines} icon={AlertTriangle} color="rose" alert={stats.criticalDeadlines > 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 p-12 bg-slate-900/50 border border-white/5 rounded-[4rem] shadow-3xl overflow-hidden relative backdrop-blur-xl">
              <h3 className="font-black text-white text-3xl mb-14 flex items-center gap-6 uppercase tracking-tighter italic">
                  <TrendingUp className="w-10 h-10 text-primary-500"/> Activity Forecast
              </h3>
              <div className="h-[28rem] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workloadData}>
                          <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: '900'}} dy={20} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: '900'}} allowDecimals={false} dx={-15} />
                          <Tooltip 
                            contentStyle={{backgroundColor: '#020617', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 30px 60px rgba(0,0,0,0.6)'}}
                            itemStyle={{color: '#818cf8', fontWeight: '900'}}
                          />
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={10} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
          
          <div className="bg-slate-900 border border-white/5 rounded-[4rem] p-12 flex flex-col h-full shadow-3xl relative overflow-hidden backdrop-blur-xl">
              <h3 className="font-black text-white text-3xl mb-12 flex items-center gap-6 uppercase tracking-tighter italic">
                  <Clock className="w-10 h-10 text-rose-500 animate-pulse-fast"/> Radar Scadenze
              </h3>
              <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                  {deadlines.length > 0 ? (
                      deadlines.slice(0, 8).map(d => (
                          <div key={d.id} className="p-7 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all duration-500 group">
                              <div className="flex-1 min-w-0 mr-6">
                                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">{new Date(d.date).toLocaleDateString('it-IT')}</p>
                                  <p className="text-xl font-black text-white truncate group-hover:text-primary-400 transition-colors uppercase tracking-tight">{d.type}</p>
                              </div>
                              <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-2xl border ${d.urgency === 'critical' ? 'bg-rose-600 text-white border-rose-400' : 'bg-primary-500/10 text-primary-400 border-primary-500/20'}`}>
                                  {d.urgency}
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-20 py-24">
                          <ShieldAlert className="w-20 h-20 text-slate-500" />
                          <p className="text-slate-500 text-sm font-black italic uppercase tracking-[0.5em]">Radar Clear</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color, alert }: any) => (
    <div className={`p-12 bg-slate-900 border rounded-[4rem] transition-all duration-700 hover:scale-[1.05] group relative overflow-hidden ${alert ? 'border-rose-500/50 bg-rose-950/10' : 'border-white/5 hover:border-primary-500/40'}`}>
        {alert && <div className="absolute inset-0 bg-rose-500/5 animate-pulse"></div>}
        <div className="flex justify-between items-start mb-10 relative z-10">
            <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] group-hover:text-slate-200 transition-colors">{title}</span>
            <div className={`p-5 rounded-3xl transition-all duration-700 ${alert ? 'bg-rose-500 text-white shadow-lg' : `bg-${color}-500/10 text-${color}-400 group-hover:scale-125 shadow-inner border border-${color}-500/20`}`}>
                <Icon className="w-8 h-8" />
            </div>
        </div>
        <p className={`text-6xl font-black tracking-tighter transition-all relative z-10 ${alert ? 'text-rose-400' : 'text-white group-hover:text-primary-400'}`}>{value}</p>
    </div>
);

export default Dashboard;
