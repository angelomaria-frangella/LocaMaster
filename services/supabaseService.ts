
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

/**
 * NORMALIZZAZIONE DETERMINISTICA (Inbound)
 */
export const normalizeContract = (data: any): Contract => {
    if (!data) return {} as Contract;

    const rawCedolare = data.cedolare_secca !== undefined ? data.cedolare_secca : data.cedolareSecca;
    
    return {
        ...data,
        id: data.id,
        isActive: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true),
        clientSide: data.client_side || data.clientSide || 'LOCATORE',
        ownerName: data.owner_name || data.ownerName || '',
        tenantName: data.tenant_name || data.tenantName || '',
        propertyAddress: data.property_address || data.propertyAddress || '',
        annualRent: Number(data.annual_rent || data.annualRent || 0),
        deposit: Number(data.deposit || 0),
        startDate: data.start_date || data.startDate || '',
        contractType: data.contract_type || data.contractType || '',
        cedolareSecca: isCedolareActive(rawCedolare),
        owners: Array.isArray(data.owners) ? data.owners : [],
        tenants: Array.isArray(data.tenants) ? data.tenants : [],
        registration: data.registration || {},
        cadastral: data.cadastral || {}
    } as Contract;
};

export const fetchContracts = async (): Promise<Contract[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalizeContract);
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
};

/**
 * SALVATAGGIO BLINDATO (Outbound)
 */
export const createContract = async (contract: Contract): Promise<Contract | null> => {
  if (!supabase) return null;
  try {
      const normalized = normalizeContract(contract);
      
      const dbPayload = {
          id: normalized.id,
          is_active: normalized.isActive,
          client_side: normalized.clientSide,
          owner_name: normalized.ownerName,
          tenant_name: normalized.tenantName,
          property_address: normalized.propertyAddress,
          annual_rent: normalized.annualRent,
          deposit: normalized.deposit,
          start_date: normalized.startDate,
          contract_type: normalized.contractType,
          cedolare_secca: isCedolareActive(normalized.cedolareSecca), 
          usage_type: normalized.usageType,
          first_expiration_date: normalized.firstExpirationDate,
          early_termination_date: normalized.earlyTerminationDate,
          owners: normalized.owners,
          tenants: normalized.tenants,
          cadastral: normalized.cadastral,
          registration: normalized.registration,
          drive_link: normalized.driveLink,
          notes: normalized.notes
      };

      const { data, error } = await supabase
        .from('contracts')
        .upsert([dbPayload])
        .select()
        .single();

      if (error) throw error;
      return normalizeContract(data);
  } catch (err) {
      console.error("Create error:", err);
      throw err;
  }
};

export const deleteContract = async (id: string): Promise<boolean> => {
    if(!supabase) return false;
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    return !error;
};
