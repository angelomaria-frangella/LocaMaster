
import { useState, useMemo, useEffect } from 'react';
import { X, FileText, User, Building, Loader2, Download, Printer, Sparkles, Send, Mail, Clock } from 'lucide-react';
import { Contract, DeadlineEvent } from '../types';
import { generateFiscalReport } from '../services/geminiService';
import { sendEmailViaGmail } from '../services/googleService';
import { generateDeadlines } from '../utils/dateUtils';

interface ReportGeneratorProps {
  contracts: Contract[];
  onClose: () => void;
  aiEnabled?: boolean;
}

type ReportType = 'ALL' | 'CLIENT' | 'SINGLE' | 'MAIL_ADVISORY';

export default function ReportGenerator({ contracts, onClose, aiEnabled = true }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('ALL');
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{html: string, subject: string} | null>(null);
  
  const studioSettings = useMemo(() => ({
    name: localStorage.getItem('studio_name') || 'Studio Commercialista',
    city: localStorage.getItem('studio_city') || ''
  }), []);

  const clients = useMemo(() => {
    const parties = contracts.flatMap(c => [c.ownerName, c.tenantName]);
    return Array.from(new Set(parties)).filter(Boolean).sort();
  }, [contracts]);

  const deadlines = useMemo(() => generateDeadlines(contracts), [contracts]);
  
  const filteredDeadlines = useMemo(() => {
    if (reportType === 'MAIL_ADVISORY' && selectedId) {
      return deadlines.filter(d => d.ownerName === selectedId || d.tenantName === selectedId);
    }
    return [];
  }, [reportType, selectedId, deadlines]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let filtered = contracts;
      let subject = '';
      let deadline = null;

      if (reportType === 'CLIENT' || reportType === 'MAIL_ADVISORY') {
        filtered = contracts.filter(c => c.ownerName === selectedId || c.tenantName === selectedId);
        subject = selectedId;
        deadline = deadlines.find(d => d.id === selectedDeadlineId);
      } else if (reportType === 'SINGLE') {
        filtered = contracts.filter(c => c.id === selectedId);
        subject = filtered[0]?.propertyAddress || '';
      }

      const res = await generateFiscalReport(filtered, reportType, subject, studioSettings, deadline);
      setGeneratedReport(res);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMail = async () => {
    if (!generatedReport) return;
    setIsSending(true);
    try {
      await sendEmailViaGmail("cliente@esempio.it", generatedReport.subject, generatedReport.html);
      alert("Inviato con successo!");
    } catch (e) {
      alert("Configura l'ID Google nelle impostazioni.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <Mail className="w-7 h-7 text-primary-500" /> Centro Notifiche & Report
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          {!generatedReport ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'ALL', icon: Building, label: 'Globale' },
                  { id: 'CLIENT', icon: User, label: 'Per Cliente' },
                  { id: 'SINGLE', icon: FileText, label: 'Contratto' },
                  { id: 'MAIL_ADVISORY', icon: Mail, label: 'Email Avviso' }
                ].map((t) => (
                  <button key={t.id} onClick={() => { setReportType(t.id as ReportType); setSelectedId(''); }} className={`p-6 rounded-2xl border transition-all text-left ${reportType === t.id ? 'bg-primary-600/10 border-primary-500' : 'bg-slate-800/40 border-slate-700'}`}>
                    <t.icon className={`w-6 h-6 mb-3 ${reportType === t.id ? 'text-primary-400' : 'text-slate-500'}`} />
                    <span className="block font-black text-[10px] text-white uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>

              {(reportType !== 'ALL') && (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <select className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-bold" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                    <option value="">-- Seleziona --</option>
                    {(reportType === 'CLIENT' || reportType === 'MAIL_ADVISORY') ? clients.map(c => <option key={c} value={c}>{c}</option>) : contracts.map(c => <option key={c.id} value={c.id}>{c.propertyAddress}</option>)}
                  </select>

                  {reportType === 'MAIL_ADVISORY' && selectedId && (
                    <select className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-bold" value={selectedDeadlineId} onChange={e => setSelectedDeadlineId(e.target.value)}>
                      <option value="">-- Seleziona Scadenza Radar --</option>
                      {filteredDeadlines.map(d => <option key={d.id} value={d.id}>{d.date} - {d.type}</option>)}
                    </select>
                  )}
                </div>
              )}

              <button onClick={handleGenerate} disabled={isGenerating || (reportType !== 'ALL' && !selectedId)} className="w-full py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />} Genera Documento
              </button>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="bg-white text-slate-900 p-10 rounded-2xl min-h-[400px] prose max-w-none shadow-inner" dangerouslySetInnerHTML={{ __html: generatedReport.html }} />
               <div className="flex gap-4">
                 <button onClick={() => setGeneratedReport(null)} className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Indietro</button>
                 <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Stampa</button>
                 <button onClick={handleSendMail} disabled={isSending} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                    {isSending ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />} Invia via Gmail
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
