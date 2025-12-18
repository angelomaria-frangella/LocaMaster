
import React, { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  AlertTriangle, Euro, Briefcase, Zap, TrendingUp, 
  FilePlus, BrainCircuit, Clock, Database, Wifi, ShieldAlert, Target
} from 'lucide-react';
import ReportGenerator from './ReportGenerator';
import { generatePortfolioInsights } from '../services/geminiService';
import { isSupabaseConfigured } from '../services/supabaseService';

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
  const [systemStatus, setSystemStatus] = useState({ db: false, ai: false });

  useEffect(() => {
    setSystemStatus({
        db: isSupabaseConfigured(),
        ai: !!process.env.API_KEY
    });

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
        case 'FISCO': 
        case 'FISCALE': return <Target className="w-5 h-5 text-primary-400" />;
        default: return <Zap className="w-5 h-5 text-amber-400" />;
    }
  };

  const getInsightBg = (category: string) => {
    switch (category.toUpperCase()) {
        case 'RISCHIO': return 'bg-rose-500/10 border-rose-500/20 text-rose-100';
        case 'RENDIMENTO': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100';
        case 'FISCO': 
        case 'FISCALE': return 'bg-primary-500/10 border-primary-500/20 text-primary-100';
        default: return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {isReportModalOpen && <ReportGenerator contracts={contracts} onClose={() => setIsReportModalOpen(false)} aiEnabled={aiEnabled} />}

      {/* COMMAND CENTER HERO */}
      <div className="relative p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[4rem] bg-slate-950 border border-white/5 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-scan opacity-30"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-600/10 blur-[120px] rounded-full"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-10">
              <div className="space-y-8">
                  <div className="flex flex-wrap gap-4">
                      <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${systemStatus.db ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          <Database className="w-3.5 h-3.5" /> DB Engine: {systemStatus.db ? 'Synced' : 'Local'}
                      </div>
                      <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${systemStatus.ai ? 'bg-primary-500/10 border-primary-500/20 text-primary-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          <Wifi className="w-3.5 h-3.5" /> AI Core: {systemStatus.ai ? 'Active' : 'Offline'}
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tighter leading-none italic">
                        Executive<br/>
                        <span className="text-primary-500 not-italic">Command.</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-lg max-w-md border-l-2 border-primary-500/30 pl-6 py-2">
                        Dott. Frangella, il sistema sta monitorando <span className="text-white">{contracts.length} asset</span> in tempo reale.
                    </p>
                  </div>
              </div>

              <div className="flex flex-col gap-4 min-w-[280px] justify-center">
                  <button onClick={onAddContract} className="w-full py-7 bg-primary-600 hover:bg-primary-500 text-white rounded-[2rem] font-black text-xl shadow-[0_25px_50px_rgba(79,70,229,0.4)] flex items-center justify-center gap-4 transition-all active:scale-95 group/btn">
                      <FilePlus className="w-8 h-8 group-hover/btn:rotate-12 transition-transform" /> NUOVA PRATICA
                  </button>
                  <button onClick={() => setIsReportModalOpen(true)} className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 transition-all border border-white/10 hover:border-primary-500/50 shadow-xl">
                      <Zap className="w-5 h-5 text-amber-400" /> SMART REPORT AI
                  </button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* INTEL BRIEFING */}
          <div className="lg:col-span-2 p-10 bg-slate-900 border border-white/5 rounded-[3rem] relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/5 blur-[100px] rounded-full"></div>
              <div className="relative z-10 space-y-8">
                  <h3 className="font-black text-white text-2xl uppercase tracking-tighter flex items-center gap-4 italic">
                      <BrainCircuit className="w-10 h-10 text-primary-400 animate-pulse" /> Mission Intel Briefing
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                      {isInsightsLoading ? (
                          [1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse"></div>)
                      ) : aiInsights.length > 0 ? (
                          aiInsights.map((insight, i) => (
                              <div key={i} className={`p-6 rounded-[2.5rem] border flex gap-6 items-start transition-all hover:translate-x-3 hover:bg-white/5 ${getInsightBg(insight.category)}`}>
                                  <div className="p-4 rounded-2xl bg-black/30 mt-1 shadow-inner">{getInsightIcon(insight.category)}</div>
                                  <div className="flex-1">
                                      <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2 block">{insight.category}</span>
                                      <p className="text-base font-bold leading-relaxed text-white/90">{insight.text}</p>
                                  </div>
                              </div>
                          ))
                      ) : (
                        <div className="py-12 text-center space-y-4">
                            <ShieldAlert className="w-12 h-12 text-slate-700 mx-auto" />
                            <p className="text-slate-500 font-bold italic uppercase tracking-widest text-xs">In attesa di parametri d'ingresso per l'analisi</p>
                        </div>
                      )}
                  </div>
              </div>
          </div>

          {/* PERFORMANCE MONITOR */}
          <div className="p-10 bg-slate-900 border border-white/5 rounded-[3rem] flex flex-col justify-between text-center relative overflow-hidden shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent opacity-50"></div>
               <span className="text-[11px] font-black text-slate-500 tracking-[0.5em] uppercase relative z-10">PORTFOLIO YIELD</span>
               <div className="relative z-10 py-10">
                   <div className="text-emerald-400 font-black text-9xl tracking-tighter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">98<span className="text-4xl ml-1">.4%</span></div>
                   <div className="flex justify-center gap-2 mt-6 text-emerald-500 font-black text-xs tracking-[0.2em] uppercase bg-emerald-500/10 py-2 px-4 rounded-full w-fit mx-auto">
                       <TrendingUp className="w-5 h-5" /> +1.2% vs prev
                   </div>
               </div>
               <div className="space-y-6 relative z-10">
                   <div className="h-5 bg-slate-950 rounded-full overflow-hidden border border-white/10 p-1 shadow-inner">
                       <div className="h-full bg-gradient-to-r from-primary-600 via-indigo-400 to-emerald-400 rounded-full w-[98.4%] shadow-[0_0_25px_rgba(99,102,241,0.5)]"></div>
                   </div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Readiness Status</p>
               </div>
          </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <KPICard title="Revenue Annuale" value={`€ ${stats.totalRevenue.toLocaleString('it-IT')}`} icon={Euro} color="emerald" />
          <KPICard title="Asset Attivi" value={stats.activeCount} icon={Briefcase} color="primary" />
          <KPICard title="Alert Critici" value={stats.criticalDeadlines} icon={AlertTriangle} color="rose" alert={stats.criticalDeadlines > 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* VOLUME CHART */}
          <div className="xl:col-span-2 p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-grid opacity-10"></div>
              <h3 className="font-black text-white text-2xl mb-12 flex items-center gap-5 uppercase tracking-tighter italic relative z-10">
                  <TrendingUp className="w-8 h-8 text-primary-500"/> Activity Forecast
              </h3>
              <div className="h-96 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workloadData}>
                          <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: '900'}} dy={15} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: '900'}} allowDecimals={false} dx={-10} />
                          <Tooltip 
                            contentStyle={{backgroundColor: '#020617', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}
                            itemStyle={{color: '#818cf8', fontWeight: '900'}}
                          />
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={8} fillOpacity={1} fill="url(#colorValue)" animationDuration={2000} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
          
          {/* RADAR SCADENZE */}
          <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-10 flex flex-col h-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/20 to-transparent"></div>
              <h3 className="font-black text-white text-2xl mb-10 flex items-center gap-5 uppercase tracking-tighter italic">
                  <Clock className="w-8 h-8 text-rose-500 animate-pulse"/> Radar Scadenze
              </h3>
              <div className="space-y-5 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                  {deadlines.length > 0 ? (
                      deadlines.slice(0, 8).map(d => (
                          <div key={d.id} className="p-6 bg-white/5 border border-white/5 rounded-[2.2rem] flex items-center justify-between hover:bg-white/10 transition-all duration-300 group cursor-default">
                              <div className="flex-1 min-w-0 mr-4">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{new Date(d.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                  <p className="text-base font-black text-white truncate group-hover:text-primary-400 transition-colors uppercase tracking-tight">{d.type}</p>
                                  <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-widest">{d.contractAddress}</p>
                              </div>
                              <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-tighter shadow-lg ${d.urgency === 'critical' ? 'bg-rose-600 text-white animate-pulse' : 'bg-primary-500/20 text-primary-400 border border-primary-500/20'}`}>
                                  {d.urgency}
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30 py-20">
                          <ShieldAlert className="w-16 h-16 text-slate-500" />
                          <p className="text-slate-500 text-sm font-black italic uppercase tracking-[0.3em]">Radar Pulito</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color, alert }: any) => (
    <div className={`p-10 bg-slate-900 border rounded-[3rem] transition-all duration-500 hover:scale-[1.03] hover:shadow-3xl group relative overflow-hidden ${alert ? 'border-rose-500/50 bg-rose-950/10' : 'border-white/5 hover:border-primary-500/30'}`}>
        {alert && <div className="absolute inset-0 bg-rose-500/5 animate-pulse"></div>}
        <div className="flex justify-between items-start mb-8 relative z-10">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-slate-300 transition-colors">{title}</span>
            <div className={`p-4 rounded-2xl transition-all duration-500 ${alert ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : `bg-${color}-500/10 text-${color}-400 group-hover:scale-110 shadow-inner`}`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
        <p className={`text-5xl font-black tracking-tighter transition-all relative z-10 ${alert ? 'text-rose-400' : 'text-white'}`}>{value}</p>
    </div>
);

export default Dashboard;
