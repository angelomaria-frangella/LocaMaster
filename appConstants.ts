
import { Contract, ContractType } from './types';

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
    startDate: `${prevYear}-01-01`,
    annualRent: 12000,
    deposit: 3000,
    isActive: true,
    cedolareSecca: true,
    isCanoneConcordato: false,
    cadastral: { foglio: '12', particella: '45', categoria: 'A/2', rendita: 850 }
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
    startDate: `${prevYear}-02-01`,
    annualRent: 9600,
    deposit: 2400,
    isActive: true,
    cedolareSecca: true,
    isCanoneConcordato: true,
    cadastral: { foglio: '45', particella: '123', categoria: 'A/3', rendita: 620 }
  }
];

export const APP_NAME = "LocaMaster AI";
