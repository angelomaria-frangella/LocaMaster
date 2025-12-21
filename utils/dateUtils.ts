
import { Contract, DeadlineEvent, DeadlineType, UrgencyLevel, ClientSide } from '../types';

export const isCedolareActive = (val: any): boolean => {
  if (val === true || val === 'true' || val === 1 || val === '1') return true;
  if (val === false || val === 'false' || val === 0 || val === '0') return false;
  const s = String(val).toLowerCase().trim();
  return ['true', '1', 'yes', 'si', 'cedolare'].includes(s);
};

const addYears = (date: Date, years: number): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
};

const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

export const calculateUrgency = (deadlineDate: Date): UrgencyLevel => {
  const today = new Date();
  const diffDays = Math.round((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return UrgencyLevel.CRITICAL; 
  if (diffDays <= 30) return UrgencyLevel.HIGH;    
  if (diffDays <= 90) return UrgencyLevel.MEDIUM;  
  return UrgencyLevel.LOW;
};

export const generateDeadlines = (contracts: Contract[]): DeadlineEvent[] => {
  let deadlines: DeadlineEvent[] = [];
  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  for (const contract of contracts) {
    if (!contract.isActive || !contract.startDate) continue;
    const start = new Date(contract.startDate);
    const hasCedolare = isCedolareActive(contract.cedolareSecca);
    
    let duration = 4;
    const cType = (contract.contractType || '').toLowerCase();
    if (cType.includes('3+2')) duration = 3;
    else if (cType.includes('6+6')) duration = 6;
    else if (cType.includes('transitorio')) duration = 1;

    let exp = addYears(start, duration);
    // Trova la prossima scadenza futura
    while (exp.getTime() < todayTime && duration > 0) {
        exp = addYears(exp, duration);
    }

    // SCADENZA RLI / REGISTRO
    const rliDate = new Date(exp);
    rliDate.setDate(rliDate.getDate() + 30);
    deadlines.push({
        id: `rli-${contract.id}-${rliDate.getTime()}`,
        contractId: contract.id,
        contractAddress: contract.propertyAddress,
        tenantName: contract.tenantName,
        ownerName: contract.ownerName,
        clientSide: contract.clientSide,
        date: rliDate.toISOString().split('T')[0],
        type: hasCedolare ? DeadlineType.RLI_OBLIGATION : DeadlineType.REGISTRATION_TAX,
        urgency: calculateUrgency(rliDate),
        description: hasCedolare ? "Proroga RLI (Esenzione Imposta)" : "Pagamento Imposta Registro Annuale",
        completed: false
    });

    // TERMINE DISDETTA (CRUCIALE)
    const noticeMonths = contract.clientSide === 'LOCATORE' ? (contract.noticeMonthsOwner || 6) : (contract.noticeMonthsTenant || 6);
    const noticeDate = addMonths(exp, -noticeMonths);
    deadlines.push({
        id: `notice-${contract.id}-${noticeDate.getTime()}`,
        contractId: contract.id,
        contractAddress: contract.propertyAddress,
        tenantName: contract.tenantName,
        ownerName: contract.ownerName,
        clientSide: contract.clientSide,
        date: noticeDate.toISOString().split('T')[0],
        type: DeadlineType.RESOLUTION_NOTICE,
        urgency: calculateUrgency(noticeDate),
        description: `TERMINE DISDETTA (${noticeMonths} mesi). Verificare intenzione del cliente.`,
        completed: false
    });

    // SCADENZA NATURALE
    deadlines.push({
        id: `exp-${contract.id}-${exp.getTime()}`,
        contractId: contract.id,
        contractAddress: contract.propertyAddress,
        tenantName: contract.tenantName,
        ownerName: contract.ownerName,
        clientSide: contract.clientSide,
        date: exp.toISOString().split('T')[0],
        type: DeadlineType.EXPIRATION,
        urgency: calculateUrgency(exp),
        description: `Fine periodo contrattuale corrente.`,
        completed: false
    });
  }
  return deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
