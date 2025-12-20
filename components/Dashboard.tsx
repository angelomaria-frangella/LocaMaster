
import { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { 
  AlertTriangle, Euro, Briefcase, Zap, FilePlus, Clock, 
  Radio, Crosshair, Wifi, Terminal, ShieldAlert, Cpu
} from 'lucide-react';
import ReportGenerator from './ReportGenerator';
import { generatePortfolioInsights } from '../services/geminiService';

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
  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('it-IT'));
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
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {isReportModalOpen && <ReportGenerator contracts={contracts} onClose={() => setIsReportModalOpen(false)} aiEnabled={aiEnabled} />}

      {/* --- QUANTUM COCKPIT V2.2.0 --- */}
      <section className="relative p-12 lg:p-20 bg-black border border-primary-500/20 rounded-[4rem] overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 blur-[150px] rounded-full"></div>
          
          <div className="relative z-10 flex flex-col xl:flex-row justify-between gap-16">
              <div className="space-y-10 flex-1">
                  <div className="flex flex-wrap items-center gap-5">
                      <div className="bg-primary-500/20 border border-primary-500/30 px-6 py-2 rounded-2xl font-mono text-2xl font-black text-primary-400">
                          UTC: {time}
                      </div>
                      <div className="bg-slate-900 border border-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          BUILD: 2.2.0_ULTRA
                      </div>
                      <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-xl text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                          <Wifi className="w-4 h-4" /> UPLINK_STABLE
                      </div>
                  </div>
                  
                  <div className="relative">
                    <h1 className="text-[10rem] lg:text-[16rem] font-black text-white tracking-tighter leading-none italic uppercase">
                        TITAN<span className="text-primary-500">_</span>
                    </h1>
                    <p className="text-slate-500 font-black text-3xl uppercase tracking-[0.6em] ml-2 -mt-4">Ultra Protocol</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <HUDUnit label="ASSETS" value={contracts.length} color="primary" />
                      <HUDUnit label="LOAD" value="98%" color="primary" />
                      <HUDUnit label="REVENUE" value={`€${(stats.totalRevenue/1000).toFixed(0)}K`} color="cyan" />
                      <HUDUnit label="THREATS" value={stats.criticalDeadlines} color={stats.criticalDeadlines > 0 ? "rose" : "primary"} />
                  </div>
              </div>

              <div className="flex flex-col gap-6 min-w-[400px] justify-center">
                  <button onClick={onAddContract} className="w-full py-16 bg-primary-600 hover:bg-primary-500 text-white rounded-[3.5rem] font-black text-5xl shadow-[0_0_50px_rgba(168,85,247,0.3)] flex flex-col items-center justify-center gap-5 transition-all active:scale-95 border-t border-white/20">
                      <FilePlus className="w-14 h-14" />
                      NEW ASSET
                  </button>
                  <button onClick={() => setIsReportModalOpen(true)} className="w-full py-8 bg-slate-900 border border-white/10 text-slate-400 rounded-[2.5rem] font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-4">
                      <Zap className="w-7 h-7 text-amber-500" /> FISCAL ANALYSIS
                  </button>
              </div>
          </div>
      </section>

      {/* --- INTELLIGENCE GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 p-12 bg-slate-900 border border-white/5 rounded-[4rem] relative overflow-hidden">
              <h3 className="text-3xl font-black text-white mb-10 flex items-center gap-5 uppercase tracking-tighter italic">
                  <Radio className="w-10 h-10 text-primary-500 animate-pulse" /> Neural Feed 2.2.0
              </h3>
              <div className="space-y-6">
                  {isInsightsLoading ? (
                      <div className="h-40 bg-white/5 rounded-[3rem] animate-pulse"></div>
                  ) : aiInsights.length > 0 ? (
                      aiInsights.map((insight, i) => (
                          <div key={i} className="p-10 rounded-[3rem] bg-black border border-white/5 flex gap-10 items-center hover:translate-x-4 transition-transform">
                              <div className="p-6 rounded-[2rem] bg-primary-600 text-white">
                                  <ShieldAlert className="w-10 h-10" />
                              </div>
                              <div className="flex-1">
                                  <span className="text-xs font-black text-primary-500 uppercase tracking-widest mb-3 block">{insight.category}</span>
                                  <p className="text-2xl font-bold text-slate-100">{insight.text}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="py-24 text-center text-slate-700 italic font-black text-3xl uppercase tracking-widest animate-pulse">Synchronizing Nodes...</div>
                  )}
              </div>
          </div>

          <div className="p-12 bg-black border border-white/10 rounded-[4rem] flex flex-col justify-center items-center text-center relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-2 bg-primary-500 shadow-[0_0_20px_#a855f7]"></div>
               <h3 className="text-2xl font-black text-white mb-12 flex items-center gap-5 uppercase tracking-tighter italic">
                  <Crosshair className="w-10 h-10 text-rose-500 animate-radar" /> Radar
              </h3>
              <div className="space-y-4 w-full">
                  {deadlines.slice(0, 5).map(d => (
                      <div key={d.id} className="p-6 bg-slate-900 border border-white/5 rounded-3xl flex items-center justify-between">
                          <div className="text-left">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{d.date}</p>
                              <p className="text-lg font-black text-white truncate max-w-[140px] italic">{d.type}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full ${d.urgency === 'critical' ? 'bg-rose-500 animate-ping' : 'bg-primary-500'}`}></div>
                      </div>
                  ))}
                  {deadlines.length === 0 && <p className="opacity-20 italic font-black text-xl">Sector Clear</p>}
              </div>
          </div>
      </div>
    </div>
  );
};

const HUDUnit = ({ label, value, color }: any) => (
    <div className="p-8 bg-slate-900 border border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-primary-500/50 transition-all">
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">{label}</span>
        <span className={`text-4xl font-black tracking-tighter text-${color === 'cyan' ? 'cyan-400' : 'primary-400'} italic`}>{value}</span>
    </div>
);

export default Dashboard;
