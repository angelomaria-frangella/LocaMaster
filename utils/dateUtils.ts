
import { Contract, DeadlineEvent, DeadlineType, UrgencyLevel, ClientSide } from '../types';

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

export const generateDeadlines = (contracts: Contract[]): DeadlineEvent[] => {
  let deadlines: DeadlineEvent[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStripped = stripTime(today);

  for (const contract of contracts) {
    if (!contract.isActive) continue;
    const start = new Date(contract.startDate);
    if (isNaN(start.getTime())) continue; 

    const hasCedolare = isCedolareActive(contract.cedolareSecca);
    const isClientLocatore = contract.clientSide === 'LOCATORE';
    
    let initialDuration = 4;
    let renewalDuration = 4;
    const cType = (contract.contractType || '').toLowerCase();
    if (cType.includes('3+2') || cType.includes('concordato')) { initialDuration = 3; renewalDuration = 2; } 
    else if (cType.includes('6+6') || cType.includes('commerciale')) { initialDuration = 6; renewalDuration = 6; }
    else if (cType.includes('transitorio')) { initialDuration = 1; renewalDuration = 0; }

    let expirationCursor = contract.firstExpirationDate ? new Date(contract.firstExpirationDate) : addYears(start, initialDuration);
    if (isNaN(expirationCursor.getTime())) continue;

    // Loop per trovare la prossima scadenza reale
    while (stripTime(expirationCursor) < todayStripped && renewalDuration > 0) {
        expirationCursor = addYears(expirationCursor, renewalDuration);
    }

    // SCADENZA CONTRATTUALE
    deadlines.push({
        id: `exp-${contract.id}`,
        contractId: contract.id,
        contractAddress: contract.propertyAddress,
        tenantName: contract.tenantName,
        ownerName: contract.ownerName,
        clientSide: contract.clientSide,
        date: expirationCursor.toISOString().split('T')[0],
        type: DeadlineType.EXPIRATION,
        urgency: calculateUrgency(expirationCursor),
        description: `Fine periodo contrattuale. Verifica necessità di rinnovo o rilascio.`,
        completed: false
    });

    // TERMINE DISDETTA (CRUCIALE)
    let noticeMonths = isClientLocatore ? (contract.noticeMonthsOwner || 6) : (contract.noticeMonthsTenant || 6);
    const noticeDeadline = addMonths(expirationCursor, -noticeMonths);
    
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
        description: `TERMINE ULTIMO DISDETTA (${noticeMonths} mesi). Oltre questa data il contratto si rinnoverà tacitamente.`,
        completed: false
    });

    // IMPOSTA REGISTRO / RLI
    const rliDate = new Date(expirationCursor);
    rliDate.setDate(rliDate.getDate() + 30);
    deadlines.push({
        id: `rli-${contract.id}`,
        contractId: contract.id,
        contractAddress: contract.propertyAddress,
        tenantName: contract.tenantName,
        ownerName: contract.ownerName,
        clientSide: contract.clientSide,
        date: rliDate.toISOString().split('T')[0],
        type: hasCedolare ? DeadlineType.RLI_OBLIGATION : DeadlineType.REGISTRATION_TAX,
        urgency: calculateUrgency(rliDate),
        description: hasCedolare ? "Comunicazione RLI Proroga (Esenzione Imposta)" : "Versamento Imposta Registro Annuale/Proroga",
        completed: false
    });
  }
  return deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
