
export enum ContractType {
  ABITATIVO_LIBERO_4_4 = 'Abitativo Libero (4+4)',
  ABITATIVO_CONCORDATO_3_2 = 'Abitativo Concordato (3+2)',
  TRANSITORIO = 'Transitorio',
  COMMERCIALE_6_6 = 'Commerciale (6+6)',
  STUDENTI = 'Studenti'
}

export enum DeadlineType {
  REGISTRATION_TAX = 'Imposta di Registro Annuale',
  RLI_OBLIGATION = 'Adempimento RLI',
  CONTRACT_RENEWAL = 'Rinnovo Contratto',
  RESOLUTION_NOTICE = 'Termine Disdetta',
  EXPIRATION = 'Scadenza Naturale',
  FIRST_REGISTRATION = 'Prima Registrazione',
  ISTAT_ADJUSTMENT = 'Adeguamento ISTAT',
  EARLY_TERMINATION = 'Risoluzione Anticipata'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export type ClientSide = 'LOCATORE' | 'CONDUTTORE';

export interface ContractAttachment {
  fileName: string;
  mimeType: string;
  data: string; // Base64 string
}

export interface CadastralData {
  foglio?: string;
  particella?: string;
  subalterno?: string;
  categoria?: string;
  rendita?: number;
}

export interface RegistrationData {
  date?: string;
  office?: string;
  series?: string;
  number?: string;
  taxPaid?: number; 
  stampDutyPaid?: number; 
}

export interface Party {
  id: string;
  name: string;
  taxCode?: string;
  address?: string;
  email?: string;
}

export interface Contract {
  id: string;
  created_at?: string;
  isActive: boolean;
  clientSide: ClientSide;
  attachment?: ContractAttachment;
  
  driveLink?: string;

  // 1. Dati Parti
  ownerName: string; 
  owners: Party[];   
  
  tenantName: string; 
  tenants: Party[];   

  ownerTaxCode?: string; 
  ownerAddress?: string; 
  tenantTaxCode?: string; 
  tenantAddress?: string; 

  // 2. Dati Immobile
  propertyAddress: string;
  cadastral?: CadastralData;
  apeRef?: string; 
  usageType?: string; 

  // 3. Condizioni Economiche
  annualRent: number;
  paymentMethod?: string; 
  deposit: number;
  expenses?: string; 
  istatRevaluation?: string; 
  
  // 4. Durata e Scadenze
  contractType: ContractType;
  stipulationDate?: string; 
  startDate: string; 
  firstExpirationDate?: string; 
  secondExpirationDate?: string; 
  earlyTerminationDate?: string; 
  noticeMonthsOwner?: number; 
  noticeMonthsTenant?: number; 

  // 5. Registrazione e Fisco
  cedolareSecca: boolean;
  isCanoneConcordato: boolean; 
  registration?: RegistrationData;
  
  // 6. Altro
  notes?: string;
}

export interface DeadlineEvent {
  id: string;
  contractId: string;
  contractAddress: string;
  ownerName: string;
  tenantName: string;
  clientSide: ClientSide; 
  date: string; 
  type: DeadlineType;
  urgency: UrgencyLevel;
  description: string;
  completed: boolean;
}

export interface DashboardStats {
  totalRevenue: number;
  activeContracts: number;
  pendingDeadlines: number;
  occupancyRate: number;
}
