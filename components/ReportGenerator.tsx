
import { useState, useMemo, useEffect } from 'react';
import { X, FileText, User, Building, Loader2, Download, Printer, Sparkles, CheckCircle2, ChevronRight, AlertTriangle, Send, Mail } from 'lucide-react';
import { Contract, DeadlineEvent } from '../types';
import { generateFiscalReport } from '../services/geminiService';
import { sendEmailViaGmail } from '../services/googleService';

interface ReportGeneratorProps {
  contracts: Contract[];
  onClose: () => void;
  aiEnabled?: boolean;
}

type ReportType = 'ALL' | 'CLIENT' | 'SINGLE' | 'MAIL_ADVISORY';

export default function ReportGenerator({ contracts, onClose, aiEnabled = true }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('ALL');
  const [selectedId, setSelectedId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [studioSettings, setStudioSettings] = useState<{name: string, piva: string, city: string} | null>(null);

  useEffect(() => {
     const name = localStorage.getItem('studio_name');
     const piva = localStorage.getItem('studio_piva');
     const city = localStorage.getItem('studio_city');
     if (name) setStudioSettings({ name, piva: piva || '', city: city || '' });
  }, []);

  const clients = useMemo(() => {
    const owners = contracts.map(c => c.ownerName);
    const tenants = contracts.map(c => c.tenantName);
    return Array.from(new Set([...owners, ...tenants])).filter(n => n && n.length > 0).sort();
  }, [contracts]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    let filteredContracts = contracts;
    let subjectName = '';

    if (reportType === 'CLIENT') {
      filteredContracts = contracts.filter(c => c.ownerName === selectedId || c.tenantName === selectedId);
      subjectName = selectedId;
    } else if (reportType === 'SINGLE') {
      filteredContracts = contracts.filter(c => c.id === selectedId);
      const c = filteredContracts[0];
      subjectName = c ? c.propertyAddress : '';
    }

    const text = await generateFiscalReport(filteredContracts, reportType, subjectName, studioSettings);
    setGeneratedReport(text);
    setIsGenerating(false);
  };

  const handleSendMail = async () => {
    if (!generatedReport || !selectedId) return;
    setIsSending(true);
    try {
        const clientEmail = "info@studiocommercialista.it"; // Placeholder: In un'app reale prenderemmo l'email dall'anagrafica Party
        await sendEmailViaGmail(clientEmail, `LocaMaster AI - Report Fiscale: ${selectedId}`, generatedReport);
        alert("Email inviata con successo tramite il tuo account Google Workspace Business!");
    } catch (e) {
        alert("Errore nell'invio email. Verifica la configurazione Google nelle impostazioni.");
    } finally { setIsSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/20">
                 <FileText className="w-6 h-6 text-primary-400" />
              </div>
              Protocollo Comunicazioni Studio
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {!generatedReport ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { id: 'ALL', icon: Building, label: 'Globale' },
                  { id: 'CLIENT', icon: User, label: 'Per Cliente' },
                  { id: 'SINGLE', icon: FileText, label: 'Contratto' },
                  { id: 'MAIL_ADVISORY', icon: Mail, label: 'Email Avviso' }
                ].map((item) => (
                  <button key={item.id} onClick={() => setReportType(item.id as ReportType)} className={`p-5 rounded-2xl border text-left transition-all ${reportType === item.id ? 'bg-primary-600/10 border-primary-500' : 'bg-slate-800/40 border-slate-700'}`}>
                    <item.icon className={`w-6 h-6 mb-3 ${reportType === item.id ? 'text-primary-400' : 'text-slate-500'}`} />
                    <span className="block font-bold text-sm text-white">{item.label}</span>
                  </button>
                ))}
              </div>

              {reportType !== 'ALL' && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Selezione Soggetto/Contratto</label>
                    <select className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-primary-500" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                        <option value="">-- Seleziona --</option>
                        {reportType === 'CLIENT' || reportType === 'MAIL_ADVISORY' ? clients.map(c => <option key={c} value={c}>{c}</option>) : contracts.map(c => <option key={c.id} value={c.id}>{c.propertyAddress}</option>)}
                    </select>
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-slate-800">
                 <button onClick={handleGenerate} disabled={isGenerating || (reportType !== 'ALL' && !selectedId)} className="flex items-center gap-3 bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50 transition-all">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Analisi e Generazione
                 </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
               <div className="prose prose-invert max-w-none bg-white text-slate-900 p-10 rounded-2xl min-h-[400px]" dangerouslySetInnerHTML={{ __html: generatedReport }} />
               <div className="flex justify-between items-center mt-8 gap-4">
                 <button onClick={() => setGeneratedReport(null)} className="text-slate-400 hover:text-white uppercase font-black text-[10px] tracking-widest">← Indietro</button>
                 <div className="flex gap-3">
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl border border-slate-700 font-black text-[10px] uppercase tracking-widest transition-all"><Printer className="w-4 h-4" /> Stampa</button>
                    <button onClick={handleSendMail} disabled={isSending} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all">
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Invia via Gmail Workspace
                    </button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
