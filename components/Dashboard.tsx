
import { useMemo, useState, useEffect } from 'react';
import { Contract, DeadlineEvent, UrgencyLevel } from '../types';
import { 
  Plus, TrendingUp, AlertCircle, Calendar, ShieldCheck, Activity, FileText, Sparkles, Target, Zap, 
  ArrowUpRight, Landmark, Clock, MapPin, User, UserCheck, Building2
} from 'lucide-react';
import ReportGenerator from './ReportGenerator';
import { generatePortfolioInsights } from '../services/geminiService';
import { isCedolareActive } from '../utils/dateUtils';

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
    const cedolareCount = activeContracts.filter(c => isCedolareActive(c.cedolareSecca)).length;
    
    // Conteggio per lato assistito
    const locatoriAssistiti = activeContracts.filter(c => c.clientSide === 'LOCATORE').length;
    const conduttoriAssistiti = activeContracts.filter(c => c.clientSide === 'CONDUTTORE').length;

    return { totalRevenue, activeCount: activeContracts.length, criticalDeadlines, cedolareCount, locatoriAssistiti, conduttoriAssistiti };
  }, [contracts, deadlines]);

  return (
    <div className="space-y-8 pb-20 perspective-hud">
      {isReportModalOpen && <ReportGenerator contracts={contracts} onClose={() => setIsReportModalOpen(false)} aiEnabled={aiEnabled} />}

      {/* LOCAMASTER AI HUD HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rotate-hud">
        <div className="lg:col-span-2 p-10 hud-border rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8 overflow-hidden">
           <div className="relative">
              <div className="absolute -left-10 top-0 w-1 h-20 bg-primary-500 shadow-[0_0_20px_#3b82f6]"></div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase font-display glow-text leading-none">
                LocaMaster <span className="text-primary-500">AI</span>
              </h1>
              <div className="flex items-center gap-4 mt-4">
                 <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    <Activity className="w-3.5 h-3.5 animate-pulse" /> MONITORAGGIO ATTIVO
                 </div>
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">STUDIO COMMERCIALISTA V7.2</span>
              </div>
           </div>
           <div className="flex gap-4">
              <button onClick={() => setIsReportModalOpen(true)} className="px-8 py-5 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all flex items-center gap-3">
                 <FileText className="w-5 h-5 text-primary-400" /> REPORT FISCALE
              </button>
              <button onClick={onAddContract} className="px-10 py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-primary-600/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                 <Plus className="w-6 h-6" /> NUOVA PRATICA
              </button>
           </div>
        </div>

        <div className="p-10 hud-border rounded-3xl flex flex-col justify-center bg-slate-900/40 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <Landmark className="w-24 h-24 text-primary-500" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Volume Canoni Gestito</p>
            <div className="flex items-baseline gap-3">
                <span className="text-6xl font-black font-display text-white glow-text italic tracking-tighter">€{(stats.totalRevenue/1000).toFixed(1)}</span>
                <span className="text-primary-500 font-black text-3xl uppercase italic tracking-tighter">k</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                <TrendingUp className="w-3.5 h-3.5" /> PERFORMANCE PORTFOLIO
            </div>
        </div>
      </div>

      {/* STRUMENTAZIONE HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-8 hud-border rounded-3xl group hover:border-primary-500/60 transition-all">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Clienti Assistiti</p>
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-3xl font-black text-white">{stats.activeCount}</span>
                    <div className="flex gap-2 mt-1">
                        <span className="text-[8px] font-bold text-primary-400 flex items-center gap-1"><Building2 className="w-2 h-2"/> {stats.locatoriAssistiti} L</span>
                        <span className="text-[8px] font-bold text-indigo-400 flex items-center gap-1"><UserCheck className="w-2 h-2"/> {stats.conduttoriAssistiti} C</span>
                    </div>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-primary-500">
                    <ShieldCheck className="w-6 h-6" />
                </div>
            </div>
        </div>
        <HudMetric label="In Cedolare Secca" value={stats.cedolareCount} icon={Sparkles} color="text-emerald-400" />
        <HudMetric label="Radar Adempimenti" value={deadlines.length} icon={Calendar} />
        <HudMetric label="Alert Critici" value={stats.criticalDeadlines} icon={AlertCircle} isWarning={stats.criticalDeadlines > 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="p-10 hud-border rounded-[2.5rem] relative overflow-hidden group min-h-[500px]">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 blur-[150px] rounded-full -z-10 animate-pulse"></div>
            <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <Sparkles className="w-8 h-8 text-primary-500" /> Intelligence Tributaria Adattiva
                </h3>
            </div>
            <div className="space-y-6">
              {isInsightsLoading ? (
                [1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-[2rem] animate-pulse border border-white/5"></div>)
              ) : aiInsights.length > 0 ? (
                aiInsights.map((insight, i) => (
                  <div key={i} className={`p-8 border rounded-[2rem] flex items-start gap-8 transition-all ${insight.text.includes('CARENZA') || insight.text.includes('ERRORE') || insight.text.includes('RISCHIO') ? 'hazard-alert' : 'bg-slate-950/40 border-white/5 hover:border-primary-500/40 hover:bg-slate-900/60'}`}>
                    <div className={`p-5 rounded-2xl flex-shrink-0 ${insight.text.includes('CARENZA') || insight.text.includes('ERRORE') || insight.text.includes('RISCHIO') ? 'bg-rose-500 text-white shadow-[0_0_20px_#f43f5e]' : 'bg-primary-600/10 text-primary-500 border border-primary-500/30'}`}>
                      {insight.text.includes('CARENZA') || insight.text.includes('ERRORE') || insight.text.includes('RISCHIO') ? <AlertCircle className="w-8 h-8" /> : <Target className="w-8 h-8" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[11px] font-black uppercase tracking-[0.3em] mb-3 ${insight.text.includes('CARENZA') || insight.text.includes('ERRORE') || insight.text.includes('RISCHIO') ? 'text-rose-400' : 'text-primary-500'}`}>{insight.category}</p>
                      <p className="text-slate-100 font-bold text-xl leading-snug tracking-tight">{insight.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center border-4 border-dashed border-slate-800 rounded-[3rem]">
                    <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-600 italic font-black uppercase tracking-[0.4em] text-xs">Radar Strategico Online.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-10 hud-border rounded-[2.5rem] bg-slate-900/20 flex flex-col">
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-10 flex items-center justify-between">
            Radar Scadenze <span className="w-3 h-3 bg-primary-500 rounded-full animate-ping"></span>
          </h3>
          <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar pr-1">
            {deadlines.length > 0 ? deadlines.slice(0, 10).map((d, i) => (
              <div key={i} className="p-6 bg-slate-950/50 border border-white/5 rounded-2xl hover:border-primary-500/40 transition-all group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-primary-500 transition-colors"></div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-[11px] font-black text-primary-500 uppercase tracking-widest">{d.date}</span>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${d.clientSide === 'LOCATORE' ? 'bg-primary-500/20 text-primary-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    ASSISTITO: {d.clientSide}
                  </span>
                </div>
                <h4 className="font-black text-slate-100 group-hover:text-primary-400 transition-colors uppercase text-xs tracking-wider mb-2">{d.type}</h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    <User className="w-3 h-3 text-primary-500" />
                    <span className="truncate">Soggetto: {d.clientSide === 'LOCATORE' ? d.ownerName : d.tenantName}</span>
                </div>
                <p className="text-[10px] text-slate-500 italic mt-2 line-clamp-2 leading-relaxed">{d.description}</p>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 opacity-20 italic font-black uppercase text-xs tracking-[0.3em]">
                Nessun adempimento imminente
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HudMetric = ({ label, value, icon: Icon, isWarning, color = "text-white" }: any) => (
  <div className={`p-10 hud-border rounded-3xl relative overflow-hidden group transition-all duration-500 ${isWarning ? 'hazard-alert' : 'hover:border-primary-500/60'}`}>
    <div className="flex justify-between items-start">
      <div className="space-y-6">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</p>
        <p className={`text-5xl font-black font-display tracking-tighter leading-none ${isWarning ? 'text-rose-500 glow-text' : color}`}>{value}</p>
      </div>
      <div className={`p-5 rounded-2xl border-2 transition-all duration-500 ${isWarning ? 'bg-rose-500 text-white border-rose-400' : 'bg-slate-950 border-white/5 text-primary-500 group-hover:bg-primary-600 group-hover:text-white'}`}>
        <Icon className="w-7 h-7" />
      </div>
    </div>
  </div>
);

export default Dashboard;
