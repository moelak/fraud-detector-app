import { supabase } from './supabase';

export interface Rule {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'warning';
  log_only: boolean;
  catches: number;
  false_positives: number;
  effectiveness: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleData {
  name: string;
  description: string;
  category: string;
  condition: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'warning';
  log_only: boolean;
}

export interface UpdateRuleData extends Partial<CreateRuleData> {
  catches?: number;
  false_positives?: number;
  effectiveness?: number;
}

export class SupabaseRulesService {
  // Get all rules for the current user (excluding soft-deleted)
  static async getRules(): Promise<Rule[]> {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rules:', error);
      throw error;
    }

    return data || [];
  }

  // Get a specific rule by ID (only if it belongs to current user)
  static async getRule(id: string): Promise<Rule | null> {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Rule not found
      }
      console.error('Error fetching rule:', error);
      throw error;
    }

    return data;
  }

  // Create a new rule
  static async createRule(ruleData: CreateRuleData): Promise<Rule> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('rules')
      .insert({
        ...ruleData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rule:', error);
      throw error;
    }

    return data;
  }

  // Update an existing rule
  static async updateRule(id: string, updates: UpdateRuleData): Promise<Rule> {
    const { data, error } = await supabase
      .from('rules')
      .update(updates)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Error updating rule:', error);
      throw error;
    }

    return data;
  }

  // Soft delete a rule
  static async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('rules')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      console.error('Error deleting rule:', error);
      throw error;
    }
  }

  // Toggle rule status between active and inactive
  static async toggleRuleStatus(id: string): Promise<Rule> {
    // First get the current rule to determine new status
    const currentRule = await this.getRule(id);
    if (!currentRule) {
      throw new Error('Rule not found');
    }

    const newStatus = currentRule.status === 'active' ? 'inactive' : 'active';
    
    return this.updateRule(id, { status: newStatus });
  }

  // Get rules by category
  static async getRulesByCategory(category: string): Promise<Rule[]> {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('category', category)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rules by category:', error);
      throw error;
    }

    return data || [];
  }

  // Get rules by status
  static async getRulesByStatus(status: 'active' | 'inactive' | 'warning'): Promise<Rule[]> {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('status', status)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rules by status:', error);
      throw error;
    }

    return data || [];
  }

  // Search rules by name or description
  static async searchRules(query: string): Promise<Rule[]> {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('is_deleted', false)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching rules:', error);
      throw error;
    }

    return data || [];
  }

  // Update rule statistics (catches, false positives, effectiveness)
  static async updateRuleStats(
    id: string, 
    stats: { catches?: number; false_positives?: number; effectiveness?: number }
  ): Promise<Rule> {
    return this.updateRule(id, stats);
  }
}