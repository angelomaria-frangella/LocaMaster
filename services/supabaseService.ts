
import { createClient } from '@supabase/supabase-js';
import { Contract } from '../types';
import { isCedolareActive } from '../utils/dateUtils';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && supabaseUrl.includes('supabase.co') && !!supabaseAnonKey;
};

const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const normalizeContract = (data: any): Contract => {
    if (!data) return {} as Contract;

    // Normalizzazione profonda per non perdere i dati estratti da Lia
    return {
        ...data,
        id: data.id || Math.random().toString(36).substr(2, 9),
        isActive: data.isActive !== undefined ? data.isActive : true,
        clientSide: data.clientSide || 'LOCATORE',
        ownerName: data.ownerName || (data.owners?.[0]?.name) || '',
        tenantName: data.tenantName || (data.tenants?.[0]?.name) || '',
        propertyAddress: data.propertyAddress || '',
        annualRent: Number(data.annualRent || 0),
        deposit: Number(data.deposit || 0),
        startDate: data.startDate || '',
        stipulationDate: data.stipulationDate || '',
        contractType: data.contractType || '',
        cedolareSecca: isCedolareActive(data.cedolareSecca),
        isCanoneConcordato: data.isCanoneConcordato === true || data.isCanoneConcordato === 'true',
        noticeMonthsOwner: Number(data.noticeMonthsOwner || 6),
        noticeMonthsTenant: Number(data.noticeMonthsTenant || 6),
        owners: Array.isArray(data.owners) ? data.owners : (data.owners ? [data.owners] : []),
        tenants: Array.isArray(data.tenants) ? data.tenants : (data.tenants ? [data.tenants] : []),
        registration: data.registration || {},
        cadastral: {
          foglio: data.cadastral?.foglio || '',
          particella: data.cadastral?.particella || '',
          subalterno: data.cadastral?.subalterno || '',
          categoria: data.cadastral?.categoria || '',
          rendita: Number(data.cadastral?.rendita || 0)
        }
    } as Contract;
};

export const fetchContracts = async (): Promise<Contract[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalizeContract);
  } catch (err) {
    return [];
  }
};

export const createContract = async (contract: Contract): Promise<Contract | null> => {
  if (!supabase) return null;
  try {
      const normalized = normalizeContract(contract);
      const { data, error } = await supabase.from('contracts').upsert([normalized]).select().single();
      if (error) throw error;
      return normalizeContract(data);
  } catch (err) {
      throw err;
  }
};

export const deleteContract = async (id: string): Promise<boolean> => {
    if(!supabase) return false;
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    return !error;
};
