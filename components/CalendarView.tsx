
import React, { useState, useMemo, useEffect } from 'react';
// Added 'Calendar' to the imports from lucide-react
import { ChevronLeft, ChevronRight, Check, RefreshCw, User, MapPin, AlertCircle, Calendar } from 'lucide-react';
import { DeadlineEvent, UrgencyLevel } from '../types';
import { initGoogleLibrary, syncToGoogleCalendar } from '../services/googleService';

interface CalendarViewProps {
  deadlines: DeadlineEvent[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ deadlines }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasClientId, setHasClientId] = useState(false);

  useEffect(() => {
    const cid = localStorage.getItem('google_client_id');
    if (cid && cid.length > 10) {
        setHasClientId(true);
        initGoogleLibrary(cid).catch(console.error);
    }
  }, []);

  const cleanDeadlines = useMemo(() => {
     return deadlines;
  }, [deadlines]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleConnectGoogle = async () => {
    if (!hasClientId) {
        alert("Configurazione Mancante: Devi prima inserire il tuo 'Google Client ID' nelle Impostazioni > Workspace Integration.");
        return;
    }
    
    setIsSyncing(true);
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const futureDeadlines = cleanDeadlines
            .filter(d => d.date >= todayStr)
            .slice(0, 20);

        await syncToGoogleCalendar(futureDeadlines);
        setIsGoogleConnected(true);
        alert("Sincronizzazione completata! Troverai le scadenze sul tuo Google Calendar.");
    } catch (e: any) {
        console.error(e);
        alert("Errore durante la sincronizzazione con Google. Verifica il Client ID e i permessi del tuo account.");
    } finally {
        setIsSyncing(false);
    }
  };

  const getDeadlinesForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return cleanDeadlines.filter(d => d.date === dateStr);
  };

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case UrgencyLevel.CRITICAL: return 'bg-rose-500';
      case UrgencyLevel.HIGH: return 'bg-orange-500';
      case UrgencyLevel.MEDIUM: return 'bg-yellow-500';
      case UrgencyLevel.LOW: return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  const selectedDayEvents = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return cleanDeadlines.filter(d => d.date === dateStr);
  }, [selectedDate, cleanDeadlines]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 gap-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white">Scadenziario Integrato</h2>
           <p className="text-slate-400">Pianificazione adempimenti e sync cloud.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex items-center gap-2">
            {!isGoogleConnected ? (
                <div className="flex items-center gap-2">
                    {!hasClientId && (
                        <div className="hidden md:flex items-center gap-1.5 px-3 text-[10px] text-amber-500 font-bold bg-amber-500/10 py-1.5 rounded-lg border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" /> Configurazione Workspace Richiesta
                        </div>
                    )}
                    <button 
                        onClick={handleConnectGoogle}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${!hasClientId ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg active:scale-95'}`}
                    >
                        {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : (
                            <svg className="w-3 h-3" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                        )}
                        {isSyncing ? 'Sincronizzazione...' : 'Sincronizza Google Calendar'}
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <Check className="w-3 h-3" />
                        Sincronizzato
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white capitalize">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-400 transition-colors border border-transparent hover:border-slate-700">
                        Oggi
                    </button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-4">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
                {Array.from({ length: startingDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayDeadlines = getDeadlinesForDay(day);
                    const isToday = 
                        day === new Date().getDate() && 
                        currentDate.getMonth() === new Date().getMonth() && 
                        currentDate.getFullYear() === new Date().getFullYear();
                    
                    const isSelected = 
                        day === selectedDate.getDate() && 
                        currentDate.getMonth() === selectedDate.getMonth() && 
                        currentDate.getFullYear() === selectedDate.getFullYear();

                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                            className={`
                                relative p-2 rounded-xl border transition-all flex flex-col items-center justify-start gap-1 min-h-[80px]
                                ${isSelected 
                                    ? 'bg-primary-900/20 border-primary-500 ring-1 ring-primary-500 z-10' 
                                    : 'bg-slate-800/30 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                                }
                                ${isToday ? 'bg-slate-800' : ''}
                            `}
                        >
                            <span className={`
                                text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                                ${isToday ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'text-slate-300'}
                            `}>
                                {day}
                            </span>
                            
                            <div className="flex flex-wrap justify-center gap-1 w-full px-1">
                                {dayDeadlines.slice(0, 4).map((d, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-1.5 h-1.5 rounded-full ${getUrgencyColor(d.urgency)}`}
                                    />
                                ))}
                                {dayDeadlines.length > 4 && (
                                    <span className="text-[9px] text-slate-500 leading-none">+</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-xl">
             <div className="mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-lg font-semibold text-white">
                    {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                    {selectedDayEvents.length} eventi in programma
                </p>
             </div>

             <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                {selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map(event => {
                        const clientName = event.clientSide === 'LOCATORE' ? event.ownerName : event.tenantName;
                        const clientRole = event.clientSide === 'LOCATORE' ? 'Proprietario' : 'Inquilino';

                        return (
                            <div key={event.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className={`w-1 h-full min-h-[50px] rounded-full ${getUrgencyColor(event.urgency)}`}></div>
                                    <div className="w-full">
                                        <h4 className="text-white font-medium text-sm leading-tight mb-2">{event.type}</h4>
                                        
                                        <div className="flex items-center gap-2 mb-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                                            <div className="p-1.5 bg-primary-900/30 rounded-full text-primary-400">
                                                <User className="w-3 h-3" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-semibold">Cliente ({clientRole})</p>
                                                <p className="text-sm font-bold text-white">{clientName}</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-400 mb-2 leading-relaxed">{event.description}</p>
                                        
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate">{event.contractAddress}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                        {/* Fixed: Replaced the undefined CalendarIcon with the imported Calendar icon */}
                        <Calendar className="w-12 h-12 mb-3 opacity-20" />
                        <p>Nessuna scadenza per questa data.</p>
                        <button className="mt-4 text-primary-400 text-sm hover:text-primary-300">
                            + Aggiungi evento manuale
                        </button>
                    </div>
                )}
             </div>

             {isGoogleConnected && (
                 <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] font-bold text-center text-emerald-500/80 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2"><Check className="w-3 h-3" /> SINCRO GOOGLE CALENDAR ATTIVA</div>
                    <button onClick={() => setIsGoogleConnected(false)} className="text-slate-500 hover:text-rose-400 underline uppercase">Disconnetti</button>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;