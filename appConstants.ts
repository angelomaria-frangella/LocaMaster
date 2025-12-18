import { Contract, ContractType } from './types';

// Helper per generare date dinamiche relative all'anno corrente
// Questo assicura che il dashboard sia sempre "vivo" indipendentemente da quando lo avvii
const currentYear = new Date().getFullYear();
const prevYear = currentYear - 1;

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: '1',
    ownerName: 'Giuseppe Verdi',
    owners: [{ id: '1', name: 'Giuseppe Verdi' }],
    tenantName: 'Mario Rossi',
    tenants: [{ id: '2', name: 'Mario Rossi' }],
    clientSide: 'LOCATORE',
    propertyAddress: 'Via Roma 10, Milano',
    contractType: ContractType.ABITATIVO_LIBERO_4_4,
    startDate: `${prevYear}-01-01`, // Scadenza imposta registro sarà a Gennaio quest'anno
    annualRent: 12000,
    deposit: 3000,
    isActive: true,
    cedolareSecca: true,
  },
  {
    id: '2',
    ownerName: 'Immobiliare Navigli SRL',
    owners: [{ id: '3', name: 'Immobiliare Navigli SRL' }],
    tenantName: 'Giulia Bianchi',
    tenants: [{ id: '4', name: 'Giulia Bianchi' }],
    clientSide: 'LOCATORE',
    propertyAddress: 'Corso Italia 5, Firenze',
    contractType: ContractType.COMMERCIALE_6_6,
    startDate: `${currentYear}-05-15`, // Contratto recente
    annualRent: 24000,
    deposit: 6000,
    isActive: true,
    cedolareSecca: false,
  },
  {
    id: '3',
    ownerName: 'Luigi Pirandello',
    owners: [{ id: '5', name: 'Luigi Pirandello' }],
    tenantName: 'Luca Verdi',
    tenants: [{ id: '6', name: 'Luca Verdi' }],
    clientSide: 'LOCATORE',
    propertyAddress: 'Piazza Navona 2, Roma',
    contractType: ContractType.ABITATIVO_CONCORDATO_3_2,
    startDate: `${prevYear}-02-01`, // Scadenza annualità a breve
    annualRent: 9600,
    deposit: 2400,
    isActive: true,
    cedolareSecca: true,
  },
  {
    id: '4',
    ownerName: 'Giuseppe Verdi',
    owners: [{ id: '1', name: 'Giuseppe Verdi' }],
    tenantName: 'Sofia Neri',
    tenants: [{ id: '7', name: 'Sofia Neri' }],
    clientSide: 'CONDUTTORE', 
    propertyAddress: 'Via Po 22, Torino',
    contractType: ContractType.TRANSITORIO,
    startDate: `${currentYear}-09-01`,
    annualRent: 8400,
    deposit: 1400,
    isActive: true,
    cedolareSecca: true,
  },
  {
    id: '5',
    ownerName: 'Investimenti Immobiliari SpA',
    owners: [{ id: '8', name: 'Investimenti Immobiliari SpA' }],
    tenantName: 'Tech Solutions SRL',
    tenants: [{ id: '9', name: 'Tech Solutions SRL' }],
    clientSide: 'LOCATORE',
    propertyAddress: 'Viale Europa 100, Roma',
    contractType: ContractType.COMMERCIALE_6_6,
    startDate: `${currentYear - 5}-11-01`, // Scadenza naturale 6 anni vicina (tra 1 anno)
    annualRent: 45000,
    deposit: 11250,
    isActive: true,
    cedolareSecca: false,
  }
];

export const APP_NAME = "LocaMaster AI";