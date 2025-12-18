
import { Contract, DeadlineEvent, DeadlineType, UrgencyLevel } from '../types';

// --- PURE HELPER FUNCTIONS ---

/**
 * BLINDATURA FISCALE: Questa è la Single Source of Truth.
 * Gestisce conversioni da stringa, null, undefined, booleano o nomi di colonna alternativi (DB).
 */
export const isCedolareActive = (val: any): boolean => {
  // Se il valore è già un booleano puro
  if (val === true || val === 'true' || val === 1 || val === '1') return true;
  if (val === false || val === 'false' || val === 0 || val === '0') return false;
  
  // Se il valore è null o undefined, per default è false
  if (val === null || val === undefined) return false;
  
  // Se è una stringa, puliamo e analizziamo (per sicurezza estrema)
  const s = String(val).toLowerCase().trim();
  const positiveValues = ['true', '1', 'yes', 'si', 'on', 'active', 'cedolare', 'cedolare_secca'];
  return positiveValues.includes(s);
};

const addYears = (date: Date, years: number): Date => {
  if (isNaN(date.getTime()) || years === 0) return date; 
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
};

const addMonths = (date: Date, months: number): Date => {
  if (isNaN(date.getTime())) return date;
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const getDiffDays = (date1: Date, date2: Date): number => {
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date1.getTime() - date2.getTime()) / oneDay);
};

export const calculateUrgency = (deadlineDate: Date): UrgencyLevel => {
  const today = new Date();
  const diffDays = getDiffDays(deadlineDate, today);

  if (diffDays < 0) return UrgencyLevel.CRITICAL; 
  if (diffDays <= 30) return UrgencyLevel.HIGH;    
  if (diffDays <= 60) return UrgencyLevel.MEDIUM;  
  return UrgencyLevel.LOW;
};

/**
 * GENERATORE DI SCADENZE (CORE LOGIC)
 */
export const generateDeadlines = (contracts: Contract[]): DeadlineEvent[] => {
  let deadlines: DeadlineEvent[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStripped = stripTime(today);
  const MAX_EVENTS = 300; 

  for (const contract of contracts) {
    if (deadlines.length >= MAX_EVENTS) break;
    if (!contract.isActive) continue;

    const start = new Date(contract.startDate);
    if (isNaN(start.getTime())) continue; 

    // BLINDATURA: Anche nel calcolo delle scadenze forziamo la normalizzazione
    const hasCedolare = isCedolareActive(contract.cedolareSecca);
    
    const earlyTermDate = contract.earlyTerminationDate ? new Date(contract.earlyTerminationDate) : null;

    let initialDuration = 4;
    let renewalDuration = 4;
    const cType = (contract.contractType || '').toLowerCase();

    if (cType.includes('3+2') || cType.includes('concordato')) {
        initialDuration = 3; renewalDuration = 2; 
    } else if (cType.includes('6+6') || cType.includes('commerciale')) {
        initialDuration = 6; renewalDuration = 6;
    } else if (cType.includes('transitorio')) {
        initialDuration = 1; renewalDuration = 0; 
    }

    let expirationCursor: Date;
    if (contract.firstExpirationDate && contract.firstExpirationDate.trim() !== '') {
        expirationCursor = new Date(contract.firstExpirationDate);
    } else {
        expirationCursor = addYears(start, initialDuration);
    }

    if (isNaN(expirationCursor.getTime())) continue;

    let loopGuard = 0;
    if (renewalDuration > 0 && (!earlyTermDate || isNaN(earlyTermDate.getTime()))) {
        while (stripTime(expirationCursor) < todayStripped) {
            if (loopGuard > 15) break; 
            expirationCursor = addYears(expirationCursor, renewalDuration);
            loopGuard++;
        }
    }

    const nextExpirationDate = earlyTermDate || expirationCursor;
    const isNextEventRenewal = !earlyTermDate && renewalDuration > 0;
    
    deadlines.push({
        id: `exp-${contract.id}-${nextExpirationDate.getFullYear()}`,
        contractId: contract.id,
        contractAddress: contract.propertyAddress,
        tenantName: contract.tenantName,
        ownerName: contract.ownerName,
        clientSide: contract.clientSide,
        date: nextExpirationDate.toISOString().split('T')[0],
        type: isNextEventRenewal ? DeadlineType.CONTRACT_RENEWAL : DeadlineType.EXPIRATION,
        urgency: calculateUrgency(nextExpirationDate),
        description: isNextEventRenewal ? "Scadenza Periodo (Rinnovo Tacito)" : (earlyTermDate ? "Data di Risoluzione / Rilascio" : "Scadenza Naturale Definitiva"),
        completed: false
    });

    if (isNextEventRenewal) {
        const rliDeadlineDate = new Date(nextExpirationDate);
        rliDeadlineDate.setDate(rliDeadlineDate.getDate() + 30);
        const rliDesc = hasCedolare
             ? "SCADENZA INVIO RLI (Proroga). ESENTE IMPOSTA (Cedolare)."
             : "SCADENZA RLI + IMPOSTA (Proroga). Versamento entro 30gg.";
        const rliType = hasCedolare ? DeadlineType.RLI_OBLIGATION : DeadlineType.REGISTRATION_TAX;

        deadlines.push({
            id: `rli-ren-${contract.id}-${rliDeadlineDate.getFullYear()}`,
            contractId: contract.id,
            contractAddress: contract.propertyAddress,
            tenantName: contract.tenantName,
            ownerName: contract.ownerName,
            clientSide: contract.clientSide,
            date: rliDeadlineDate.toISOString().split('T')[0],
            type: rliType, 
            urgency: calculateUrgency(rliDeadlineDate),
            description: rliDesc,
            completed: false
        });
    }

    if (!hasCedolare && !earlyTermDate) {
        const contractMonth = start.getMonth();
        const contractDay = start.getDate();
        let paymentDeadline = new Date(currentYear, contractMonth, contractDay);
        paymentDeadline.setDate(paymentDeadline.getDate() + 30); 

        if (getDiffDays(paymentDeadline, today) < -180) {
            paymentDeadline = new Date(currentYear + 1, contractMonth, contractDay);
            paymentDeadline.setDate(paymentDeadline.getDate() + 30);
        }

        const distToExpiration = Math.abs(getDiffDays(paymentDeadline, nextExpirationDate));
        if (distToExpiration > 60) {
             deadlines.push({
                id: `tax-${contract.id}-${paymentDeadline.getFullYear()}`,
                contractId: contract.id,
                contractAddress: contract.propertyAddress,
                tenantName: contract.tenantName,
                ownerName: contract.ownerName,
                clientSide: contract.clientSide,
                date: paymentDeadline.toISOString().split('T')[0],
                type: DeadlineType.REGISTRATION_TAX,
                urgency: calculateUrgency(paymentDeadline),
                description: `Pagamento imposta registro annualità ${paymentDeadline.getFullYear()}`,
                completed: false
            });
        }
    }

    if (!earlyTermDate) {
        let noticeMonths = contract.clientSide === 'LOCATORE' 
            ? (contract.noticeMonthsOwner || 6) 
            : (contract.noticeMonthsTenant || 6);

        const noticeDeadline = addMonths(nextExpirationDate, -noticeMonths);
        if (!isNaN(noticeDeadline.getTime()) && getDiffDays(noticeDeadline, today) < 365 && getDiffDays(noticeDeadline, today) > -60) {
            deadlines.push({
                id: `notice-${contract.id}`,
                contractId: contract.id,
                contractAddress: contract.propertyAddress,
                tenantName: contract.tenantName,
                ownerName: contract.ownerName,
                clientSide: contract.clientSide,
                date: noticeDeadline.toISOString().split('T')[0],
                type: DeadlineType.RESOLUTION_NOTICE,
                urgency: calculateUrgency(noticeDeadline),
                description: `Termine ultimo per disdetta (${noticeMonths} mesi)`,
                completed: false
            });
        }
    }
  }
  return deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
