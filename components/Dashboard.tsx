
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
  onNavigate: (view: string) => void;
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

      <div className="relative p-10 rounded-[3rem] bg-slate-900 border border-white/5 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-scan opacity-20"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
              <div className="space-y-6">
                  <div className="flex gap-4">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter ${systemStatus.db ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          <Database className="w-3 h-3" /> System: {systemStatus.db ? 'CLOUD SYNC' : 'OFFLINE'}
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter ${systemStatus.ai ? 'bg-primary-500/10 border-primary-500/20 text-primary-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          <Wifi className="w-3 h-3" /> AI Core: {systemStatus.ai ? 'ACTIVE' : 'OFFLINE'}
                      </div>
                  </div>
                  <h1 className="text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none">
                      Executive<br/>
                      <span className="text-primary-500">Command.</span>
                  </h1>
                  <p className="text-slate-400 font-medium max-w-sm">Dott. Frangella, monitoraggio attivo su {contracts.length} asset.</p>
              </div>

              <div className="flex flex-col gap-4 min-w-[260px]">
                  <button onClick={onAddContract} className="w-full py-6 bg-primary-600 hover:bg-primary-500 text-white rounded-3xl font-black text-xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] flex items-center justify-center gap-4 transition-all active:scale-95">
                      <FilePlus className="w-7 h-7" /> NUOVA PRATICA
                  </button>
                  <button onClick={() => setIsReportModalOpen(true)} className="w-full py-4 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border border-white/5">
                      <Zap className="w-4 h-4 text-amber-400" /> SMART REPORT AI
                  </button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 bg-slate-900 border border-white/5 rounded-[3rem] relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-[100px] rounded-full"></div>
              <div className="relative z-10 space-y-6">
                  <h3 className="font-black text-white text-2xl uppercase tracking-widest flex items-center gap-3 italic">
                      <BrainCircuit className="w-8 h-8 text-primary-400 animate-pulse" /> Mission Intel Briefing
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                      {isInsightsLoading ? (
                          [1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>)
                      ) : (
                          aiInsights.map((insight, i) => (
                              <div key={i} className={`p-5 rounded-[2rem] border flex gap-5 items-start transition-all hover:translate-x-2 ${getInsightBg(insight.category)}`}>
                                  <div className="p-3 rounded-2xl bg-black/20 mt-1">{getInsightIcon(insight.category)}</div>
                                  <div className="flex-1">
                                      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-1 block">{insight.category}</span>
                                      <p className="text-sm font-bold leading-relaxed">{insight.text}</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] flex flex-col justify-between text-center relative overflow-hidden shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent"></div>
               <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase relative z-10">PORTFOLIO YIELD</span>
               <div className="relative z-10 py-8">
                   <div className="text-emerald-400 font-black text-8xl tracking-tighter">98<span className="text-3xl ml-1">.4%</span></div>
                   <div className="flex justify-center gap-2 mt-4 text-emerald-500 font-black text-[11px] tracking-widest uppercase">
                       <TrendingUp className="w-5 h-5" /> +1.2% VS PREV MONTH
                   </div>
               </div>
               <div className="space-y-4 relative z-10">
                   <div className="h-4 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-1">
                       <div className="h-full bg-gradient-to-r from-primary-600 to-emerald-400 rounded-full w-[98.4%] shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
                   </div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Optimized Assets Control</p>
               </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <KPICard title="Revenue Annuale" value={`€ ${stats.totalRevenue.toLocaleString('it-IT')}`} icon={Euro} color="emerald" />
          <KPICard title="Asset Attivi" value={stats.activeCount} icon={Briefcase} color="primary" />
          <KPICard title="Alert Critici" value={stats.criticalDeadlines} icon={AlertTriangle} color="rose" alert={stats.criticalDeadlines > 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 p-10 bg-slate-900 border border-white/5 rounded-[3rem] shadow-2xl">
              <h3 className="font-black text-white text-2xl mb-10 flex items-center gap-4 uppercase tracking-tighter italic">
                  <TrendingUp className="w-7 h-7 text-primary-500"/> Volume Adempimenti
              </h3>
              <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workloadData}>
                          <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '800'}} dy={15} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '800'}} allowDecimals={false} dx={-10} />
                          <Tooltip contentStyle={{backgroundColor: '#020617', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)'}} />
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={6} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
          
          <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 flex flex-col h-full shadow-2xl relative overflow-hidden">
              <h3 className="font-black text-white text-2xl mb-8 flex items-center gap-4 uppercase tracking-tighter italic">
                  <Clock className="w-7 h-7 text-rose-500"/> Radar Scadenze
              </h3>
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                  {deadlines.length > 0 ? (
                      deadlines.slice(0, 8).map(d => (
                          <div key={d.id} className="p-5 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between hover:bg-white/10 transition-all group">
                              <div className="flex-1 min-w-0 mr-4">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{new Date(d.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</p>
                                  <p className="text-sm font-black text-white truncate group-hover:text-primary-400 transition-colors">{d.type}</p>
                                  <p className="text-[10px] text-slate-500 truncate font-bold">{d.contractAddress}</p>
                              </div>
                              <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter ${d.urgency === 'critical' ? 'bg-rose-500 text-white animate-pulse' : 'bg-primary-500/20 text-primary-400'}`}>
                                  {d.urgency}
                              </div>
                          </div>
                      ))
                  ) : (
                      <p className="text-slate-500 text-sm italic text-center py-20">Radar pulito.</p>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color, alert }: any) => (
    <div className={`p-8 bg-slate-900 border rounded-[2.5rem] transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl group ${alert ? 'border-rose-500/50 bg-rose-950/5' : 'border-white/5'}`}>
        <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] group-hover:text-slate-300 transition-colors">{title}</span>
            <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-all`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <p className="text-4xl font-black text-white tracking-tighter transition-all">{value}</p>
    </div>
);

export default Dashboard;
