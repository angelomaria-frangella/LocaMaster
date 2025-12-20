
import { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  AlertTriangle, Euro, Briefcase, Zap, FilePlus, Clock, 
  Activity, Radio, Cpu, Crosshair, Wifi, Terminal, ShieldCheck
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
  const [missionTime, setMissionTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setMissionTime(new Date().toLocaleTimeString('it-IT', { hour12: false }));
    }, 1000);
    
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

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      {isReportModalOpen && <ReportGenerator contracts={contracts} onClose={() => setIsReportModalOpen(false)} aiEnabled={aiEnabled} />}

      {/* --- MASTER COCKPIT V2.1.0 --- */}
      <section className="relative p-10 lg:p-16 bg-slate-950 border border-white/10 rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
          <div className="absolute inset-0 bg-grid opacity-20"></div>
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary-600/10 blur-[150px] rounded-full"></div>
          
          <div className="relative z-10 flex flex-col xl:flex-row justify-between gap-12">
              <div className="space-y-8 flex-1">
                  <div className="flex flex-wrap items-center gap-4">
                      <div className="bg-primary-950/50 border border-primary-500/30 px-5 py-2 rounded-xl font-mono text-xl font-black text-primary-400 shadow-neon">
                          TIME: {missionTime}
                      </div>
                      <div className="bg-slate-900 border border-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5" /> BUILD: 2.1.0_TITAN
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                          <Wifi className="w-3.5 h-3.5 animate-pulse" /> NETWORK: STABLE
                      </div>
                  </div>
                  
                  <div className="relative">
                    <h1 className="text-9xl lg:text-[14rem] font-black text-white tracking-tighter leading-none italic select-none">
                        TITAN<span className="text-primary-500">.</span>
                    </h1>
                    <p className="text-slate-500 font-black text-2xl uppercase tracking-[0.5em] ml-2 -mt-4">Command Center</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <HUDUnit label="ASSETS" value={contracts.length} color="primary" />
                      <HUDUnit label="NODES" value="ACTIVE" color="indigo" />
                      <HUDUnit label="REVENUE" value={`€${(stats.totalRevenue/1000).toFixed(1)}K`} color="emerald" />
                      <HUDUnit label="ALERTS" value={stats.criticalDeadlines} color={stats.criticalDeadlines > 0 ? "rose" : "primary"} />
                  </div>
              </div>

              <div className="flex flex-col gap-6 min-w-[360px] justify-center">
                  <button onClick={onAddContract} className="w-full py-12 bg-primary-600 hover:bg-primary-500 text-white rounded-[3rem] font-black text-4xl shadow-2xl flex flex-col items-center justify-center gap-4 transition-all active:scale-95 border-t border-white/20">
                      <FilePlus className="w-12 h-12" />
                      NEW ASSET
                  </button>
                  <button onClick={() => setIsReportModalOpen(true)} className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-[2rem] font-black text-sm border border-white/5 flex items-center justify-center gap-3">
                      <Zap className="w-6 h-6 text-amber-500" /> GENERATE FISCAL INTEL
                  </button>
              </div>
          </div>
      </section>

      {/* --- RADAR & INTELLIGENCE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 p-12 bg-slate-900/50 border border-white/5 rounded-[4rem] backdrop-blur-3xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black text-white flex items-center gap-4 uppercase tracking-tighter italic">
                      <Radio className="w-8 h-8 text-primary-500 animate-pulse" /> Neural Feed V2.1
                  </h3>
              </div>
              <div className="space-y-6">
                  {isInsightsLoading ? (
                      <div className="h-40 bg-white/5 rounded-3xl animate-pulse"></div>
                  ) : aiInsights.length > 0 ? (
                      aiInsights.map((insight, i) => (
                          <div key={i} className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 flex gap-8 items-center hover:translate-x-4 transition-transform">
                              <div className="p-5 rounded-2xl bg-primary-600 text-white shadow-lg">
                                  <ShieldCheck className="w-8 h-8" />
                              </div>
                              <div className="flex-1">
                                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-2 block">{insight.category}</span>
                                  <p className="text-xl font-bold text-slate-200">{insight.text}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="py-20 text-center text-slate-600 italic font-black text-2xl uppercase tracking-widest">Scanning system assets...</div>
                  )}
              </div>
          </div>

          <div className="p-12 bg-slate-950 border border-white/5 rounded-[4rem] shadow-2xl relative overflow-hidden group">
              <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4 uppercase tracking-tighter italic">
                  <Crosshair className="w-8 h-8 text-rose-500 animate-spin-slow" /> Radar Target
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {deadlines.slice(0, 8).map(d => (
                      <div key={d.id} className="p-6 bg-slate-900/80 border border-white/5 rounded-3xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                          <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{d.date}</p>
                              <p className="text-lg font-black text-white truncate max-w-[150px] uppercase italic">{d.type}</p>
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

const HUDUnit = ({ label, value, color }: any) => (
    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl flex flex-col items-center justify-center text-center">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{label}</span>
        <span className={`text-3xl font-black tracking-tighter text-${color}-400 italic`}>{value}</span>
    </div>
);

export default Dashboard;
