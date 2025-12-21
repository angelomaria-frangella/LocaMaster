
import { Contract, DeadlineEvent, DeadlineType, UrgencyLevel, ClientSide } from '../types';

// --- PURE HELPER FUNCTIONS ---

/**
 * BLINDATURA FISCALE: Questa è la Single Source of Truth.
 */
export const isCedolareActive = (val: any): boolean => {
  if (val === true || val === 'true' || val === 1 || val === '1') return true;
  if (val === false || val === 'false' || val === 0 || val === '0') return false;
  if (val === null || val === undefined) return false;
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
 * GENERATORE DI SCADENZE ADATTIVO (CORE LOGIC)
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

    const hasCedolare = isCedolareActive(contract.cedolareSecca);
    const isClientLocatore = contract.clientSide === 'LOCATORE';
    
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
    
    // Descrizione adattiva per scadenza
    let expirationDesc = "";
    if (earlyTermDate) {
        expirationDesc = isClientLocatore ? "Rilascio immobile da parte del conduttore" : "Termine ultimo per rilascio e riconsegna chiavi";
    } else if (isNextEventRenewal) {
        expirationDesc = isClientLocatore ? "Proroga tacita contratto (Verifica canone)" : "Rinnovo automatico (Verifica invio disdetta se necessario)";
    } else {
        expirationDesc = "Fine definitiva locazione (No rinnovo)";
    }

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
        description: expirationDesc,
        completed: false
    });

    if (isNextEventRenewal) {
        const rliDeadlineDate = new Date(nextExpirationDate);
        rliDeadlineDate.setDate(rliDeadlineDate.getDate() + 30);
        
        let rliDesc = "";
        if (hasCedolare) {
            rliDesc = isClientLocatore 
                ? "Adempimento RLI Proroga (Opzione Cedolare Confermata). No imposta." 
                : "Verifica che il locatore comunichi la proroga in Cedolare.";
        } else {
            rliDesc = isClientLocatore 
                ? "Versamento Imposta Registro 30gg (Proroga). Calcola 2% o fisso." 
                : "Verifica avvenuto versamento imposta di registro da parte del locatore.";
        }

        deadlines.push({
            id: `rli-ren-${contract.id}-${rliDeadlineDate.getFullYear()}`,
            contractId: contract.id,
            contractAddress: contract.propertyAddress,
            tenantName: contract.tenantName,
            ownerName: contract.ownerName,
            clientSide: contract.clientSide,
            date: rliDeadlineDate.toISOString().split('T')[0],
            type: hasCedolare ? DeadlineType.RLI_OBLIGATION : DeadlineType.REGISTRATION_TAX,
            urgency: calculateUrgency(rliDeadlineDate),
            description: rliDesc,
            completed: false
        });
    }

    // Scadenze annuali imposta registro (solo se no cedolare)
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
                description: isClientLocatore 
                    ? `Versamento annualità registro ${paymentDeadline.getFullYear()} (Gestione F24 Elide)`
                    : `Controllo versamento annualità registro ${paymentDeadline.getFullYear()} (Quota 50% spettante)`,
                completed: false
            });
        }
    }

    // Termine disdetta
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
                description: isClientLocatore 
                    ? `Limite invio diniego rinnovo al conduttore (${noticeMonths} mesi)`
                    : `Limite invio disdetta per evitare rinnovo automatico (${noticeMonths} mesi)`,
                completed: false
            });
        }
    }
  }
  return deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
