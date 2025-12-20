
import { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { 
  Plus, TrendingUp, AlertCircle, Calendar, ShieldCheck, Activity, FileText, Sparkles
} from 'lucide-react';
import ReportGenerator from './ReportGenerator';
import { generatePortfolioInsights } from '../services/geminiService';

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

  useEffect(() => {
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

  return (
    <div className="space-y-10 animate-cockpit pb-20">
      {isReportModalOpen && <ReportGenerator contracts={contracts} onClose={() => setIsReportModalOpen(false)} aiEnabled={aiEnabled} />}

      {/* Header Strategico */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight font-display">
            COMMAND <span className="text-primary-500 italic uppercase">Center</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> Asset Locativi Sincronizzati • Cloud V3.0
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsReportModalOpen(true)} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all border border-white/10 group">
             <FileText className="w-5 h-5 text-slate-400 group-hover:text-white" /> Report Fiscale
          </button>
          <button onClick={onAddContract} className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-primary-600/30 hover:-translate-y-1">
             <Plus className="w-6 h-6" /> Registra Asset
          </button>
        </div>
      </div>

      {/* Grid delle Metriche (HUD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Patrimonio Gestito" value={contracts.length} icon={ShieldCheck} trend="+2 Assets" />
        <MetricCard label="Rendimento Annuo" value={`€${(stats.totalRevenue/1000).toFixed(1)}k`} icon={TrendingUp} color="text-emerald-400" />
        <MetricCard label="Alert Critici" value={stats.criticalDeadlines} icon={AlertCircle} color={stats.criticalDeadlines > 0 ? "text-rose-500" : "text-slate-400"} />
        <MetricCard label="Scadenzario" value={deadlines.length} icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Intelligence Feed */}
        <div className="xl:col-span-2 space-y-6">
          <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] group-hover:bg-primary-500/10 transition-all duration-1000"></div>
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
               <Sparkles className="w-6 h-6 text-primary-500" /> Intelligence Strategica
            </h3>
            
            <div className="space-y-4">
              {isInsightsLoading ? (
                [1,2].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse border border-white/5"></div>)
              ) : aiInsights.length > 0 ? (
                aiInsights.map((insight, i) => (
                  <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-start gap-6 hover:bg-white/[0.08] transition-all cursor-default group/card">
                    <div className="p-4 bg-primary-600/10 rounded-2xl text-primary-500 border border-primary-500/20 group-hover/card:bg-primary-600 group-hover/card:text-white transition-all">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-primary-500 tracking-[0.2em] mb-2">{insight.category}</p>
                      <p className="text-slate-200 font-semibold text-lg leading-snug">{insight.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                    <p className="text-slate-500 italic font-medium">In attesa di dati per l'elaborazione neurale...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Radar */}
        <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] h-fit shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white">Action Radar</h3>
            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
          </div>
          <div className="space-y-4">
            {deadlines.slice(0, 5).map((d, i) => (
              <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-white/20 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{d.date}</span>
                  <div className={`w-2 h-2 rounded-full ${d.urgency === 'critical' ? 'bg-rose-500' : 'bg-primary-500'}`}></div>
                </div>
                <h4 className="font-bold text-slate-100 truncate group-hover:text-primary-400 transition-colors">{d.type}</h4>
                <p className="text-xs text-slate-500 mt-1 truncate">{d.contractAddress}</p>
              </div>
            ))}
            {deadlines.length === 0 && (
                 <p className="text-center py-10 text-slate-600 italic">Nessuna scadenza imminente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, trend, color = "text-white" }: any) => (
  <div className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] relative overflow-hidden group shadow-xl hover:border-primary-500/30 transition-all">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
        <p className={`text-4xl font-black font-display tracking-tighter ${color}`}>{value}</p>
      </div>
      <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-primary-600 transition-all duration-500 group-hover:text-white text-primary-500 border border-white/5">
        <Icon className="w-7 h-7" />
      </div>
    </div>
    {trend && (
      <div className="mt-5 flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full w-fit border border-emerald-400/20">
        {trend}
      </div>
    )}
  </div>
);

export default Dashboard;
