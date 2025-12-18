import { useState, useMemo, useEffect } from 'react';
import { X, FileText, User, Building, Loader2, Download, Printer, Sparkles, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { Contract } from '../types';
import { generateFiscalReport } from '../services/geminiService';

interface ReportGeneratorProps {
  contracts: Contract[];
  onClose: () => void;
  aiEnabled?: boolean;
}

type ReportType = 'ALL' | 'CLIENT' | 'SINGLE';

export default function ReportGenerator({ contracts, onClose, aiEnabled = true }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('ALL');
  const [selectedId, setSelectedId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  
  // Dati studio locali
  const [studioSettings, setStudioSettings] = useState<{name: string, piva: string, city: string} | null>(null);

  useEffect(() => {
     // Carica impostazioni studio al mount
     const name = localStorage.getItem('studio_name');
     const piva = localStorage.getItem('studio_piva');
     const city = localStorage.getItem('studio_city');
     if (name) {
         setStudioSettings({ name, piva: piva || '', city: city || '' });
     }
  }, []);

  const clients = useMemo(() => {
    const owners = contracts.filter(c => c.clientSide === 'LOCATORE').map(c => c.ownerName);
    const tenants = contracts.filter(c => c.clientSide === 'CONDUTTORE').map(c => c.tenantName);
    return Array.from(new Set([...owners, ...tenants])).sort();
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
      subjectName = c ? `${c.propertyAddress} (${c.contractType || 'Contratto'})` : '';
    }

    const text = await generateFiscalReport(filteredContracts, reportType, subjectName, studioSettings);
    setGeneratedReport(text || "Errore nella generazione del report.");
    setIsGenerating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!generatedReport) return;
    
    // Generiamo un file HTML completo
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Fiscale - LocaMaster AI</title>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 40px; color: #1e293b; background: white; }
            h1 { font-family: 'Segoe UI', sans-serif; color: #0f172a; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #475569; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
            .footer { margin-top: 50px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; }
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${generatedReport}
          <div class="footer">
            Documento generato automaticamente da LocaMaster AI il ${new Date().toLocaleString('it-IT')}
          </div>
        </body>
      </html>
    `;

    const element = document.createElement("a");
    const file = new Blob([htmlContent], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `Report_LocaMaster_${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 animate-in fade-in duration-300 overflow-y-auto print:overflow-visible print:bg-white print:static print:p-0">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative ring-1 ring-white/10 print:shadow-none print:border-none print:max-h-none print:max-w-none print:rounded-none print:text-black print:bg-white">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 relative z-10 no-print">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-xl border border-primary-500/20">
                 <FileText className="w-6 h-6 text-primary-400" />
              </div>
              Generatore Report Fiscale
            </h2>
            <p className="text-sm text-slate-400 mt-1 pl-1">Crea report PDF professionali con un click.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide relative z-10 print:overflow-visible print:p-0">
          {!generatedReport ? (
            <div className="space-y-10 no-print">
              {!aiEnabled && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-amber-400 font-bold text-sm">Modalità Demo Attiva</h4>
                        <p className="text-amber-400/80 text-xs mt-1">Report generato con dati simulati.</p>
                    </div>
                </div>
              )}

              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-slate-400 border border-slate-700">1</span>
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Seleziona Tipologia</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        { id: 'ALL', icon: Building, label: 'Globale Studio', desc: 'Panoramica completa' },
                        { id: 'CLIENT', icon: User, label: 'Per Cliente', desc: 'Report verticale singolo locatore' },
                        { id: 'SINGLE', icon: FileText, label: 'Singolo Contratto', desc: 'Dettaglio specifico immobile' }
                    ].map((item) => (
                        <button 
                        key={item.id}
                        onClick={() => { setReportType(item.id as ReportType); setSelectedId(''); }}
                        className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 ${
                            reportType === item.id 
                            ? 'bg-primary-600/10 border-primary-500 ring-1 ring-primary-500/50' 
                            : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'
                        }`}
                        >
                        <div className={`p-3 rounded-xl w-fit mb-4 transition-colors ${reportType === item.id ? 'bg-primary-500 text-white' : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'}`}>
                           <item.icon className="w-6 h-6" />
                        </div>
                        <span className={`block font-bold text-lg mb-1 ${reportType === item.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{item.label}</span>
                        <span className="text-xs text-slate-500 group-hover:text-slate-400 leading-relaxed block pr-4">{item.desc}</span>
                        
                        {reportType === item.id && (
                            <div className="absolute top-4 right-4 text-primary-500 animate-in zoom-in">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        )}
                        </button>
                    ))}
                 </div>
              </div>

              <div className="min-h-[100px] transition-all duration-300">
                {reportType !== 'ALL' && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-slate-400 border border-slate-700">2</span>
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Specifica Dettagli</h3>
                        </div>
                        
                        {reportType === 'CLIENT' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">Seleziona Cliente</label>
                                <div className="relative group">
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
                                        value={selectedId}
                                        onChange={(e) => setSelectedId(e.target.value)}
                                    >
                                        <option value="">-- Seleziona un cliente --</option>
                                        {clients.map(client => (
                                        <option key={client} value={client}>{client}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none rotate-90" />
                                </div>
                            </div>
                        )}

                        {reportType === 'SINGLE' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">Seleziona Contratto</label>
                                <div className="relative group">
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
                                        value={selectedId}
                                        onChange={(e) => setSelectedId(e.target.value)}
                                    >
                                        <option value="">-- Seleziona un contratto --</option>
                                        {contracts.map(c => (
                                        <option key={c.id} value={c.id}>{c.propertyAddress} - {c.ownerName}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none rotate-90" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-800">
                 <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || (reportType !== 'ALL' && !selectedId)}
                    className="flex items-center gap-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                    {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    {isGenerating ? 'Generazione...' : 'Genera Report'}
                 </button>
              </div>
            </div>
          ) : (
            <div className="animate-in zoom-in-95 duration-500 h-full flex flex-col">
               <div className="hidden print:block mb-8 text-black">
                   <h1 className="text-2xl font-bold">LocaMaster AI - Report Fiscale</h1>
                   <p className="text-sm">Generato il {new Date().toLocaleDateString()}</p>
                   <hr className="my-4 border-black" />
               </div>

               {/* HTML CONTAINER - Renderizza l'HTML con la classe printable-report */}
               <div 
                   className="printable-report bg-white text-slate-900 p-10 rounded-2xl shadow-inner font-sans text-sm leading-relaxed overflow-y-auto min-h-[400px] border border-slate-200 print:shadow-none print:border-none print:p-0 print:overflow-visible prose max-w-none"
                   dangerouslySetInnerHTML={{ __html: generatedReport }}
               />
               
               <div className="flex justify-between items-center mt-8 no-print">
                 <button 
                   onClick={() => setGeneratedReport(null)}
                   className="text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-lg"
                 >
                   ← Indietro
                 </button>
                 <div className="flex gap-3">
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl transition-colors border border-slate-700 font-medium">
                        <Printer className="w-4 h-4" /> Stampa
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-primary-600/20 font-medium">
                        <Download className="w-4 h-4" /> Scarica (HTML)
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