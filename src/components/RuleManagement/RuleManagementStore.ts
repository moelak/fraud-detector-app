import { makeAutoObservable, runInAction } from "mobx";
import { SupabaseRulesService, Rule as SupabaseRule, CreateRuleData, UpdateRuleData } from "../../lib/supabaseRules";

export interface Rule extends SupabaseRule {
  // Convert database rule to store format
}

export class RuleManagementStore {
  rules: Rule[] = [];
  activeTab: 'active' | 'all' | 'attention' = 'all';
  searchQuery = '';
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isChargebackAnalysisOpen = false;
  editingRule: Rule | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadRules();
  }

  // Load rules from Supabase
  loadRules = async () => {
    try {
      this.isLoading = true;
      this.error = null;
      const rules = await SupabaseRulesService.getRules();
      runInAction(() => {
        this.rules = rules;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to load rules';
        console.error('Error loading rules:', error);
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  setActiveTab = (tab: 'active' | 'all' | 'attention') => {
    this.activeTab = tab;
  }

  setSearchQuery = (query: string) => {
    this.searchQuery = query;
  }

  openCreateModal = () => {
    this.isCreateModalOpen = true;
    this.editingRule = null;
  }

  closeCreateModal = () => {
    this.isCreateModalOpen = false;
    this.editingRule = null;
  }

  openChargebackAnalysis = () => {
    this.isChargebackAnalysisOpen = true;
  }

  closeChargebackAnalysis = () => {
    this.isChargebackAnalysisOpen = false;
  }

  editRule = (id: string) => {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      this.editingRule = rule;
      this.isEditModalOpen = true;
      this.isCreateModalOpen = true; // Reuse the same modal
    }
  }

  closeEditModal = () => {
    this.isEditModalOpen = false;
    this.editingRule = null;
    this.isCreateModalOpen = false;
  }

  viewRuleHistory = (id: string) => {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      console.log('Viewing history for rule:', rule.name);
      // TODO: Implement rule history functionality
    }
  }

  deleteRule = async (id: string) => {
    try {
      await SupabaseRulesService.deleteRule(id);
      // Remove from local state
      runInAction(() => {
        this.rules = this.rules.filter(rule => rule.id !== id);
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
      this.error = error instanceof Error ? error.message : 'Failed to delete rule';
    }
  }

  toggleRuleStatus = async (id: string) => {
    try {
      const updatedRule = await SupabaseRulesService.toggleRuleStatus(id);
      // Update local state
      runInAction(() => {
        const index = this.rules.findIndex(r => r.id === id);
        if (index !== -1) {
          this.rules[index] = updatedRule;
        }
      });
    } catch (error) {
      console.error('Error toggling rule status:', error);
      this.error = error instanceof Error ? error.message : 'Failed to toggle rule status';
    }
  }

  addRule = async (ruleData: CreateRuleData) => {
    try {
      const newRule = await SupabaseRulesService.createRule(ruleData);
      // Add to local state
      runInAction(() => {
        this.rules.unshift(newRule);
      });
      return newRule;
    } catch (error) {
      console.error('Error creating rule:', error);
      this.error = error instanceof Error ? error.message : 'Failed to create rule';
      throw error;
    }
  }

  updateRule = async (id: string, updates: UpdateRuleData) => {
    try {
      const updatedRule = await SupabaseRulesService.updateRule(id, updates);
      // Update local state
      runInAction(() => {
        const index = this.rules.findIndex(r => r.id === id);
        if (index !== -1) {
          this.rules[index] = updatedRule;
        }
      });
      return updatedRule;
    } catch (error) {
      console.error('Error updating rule:', error);
      this.error = error instanceof Error ? error.message : 'Failed to update rule';
      throw error;
    }
  }

  searchRules = async (query: string) => {
    try {
      this.isLoading = true;
      const rules = await SupabaseRulesService.searchRules(query);
      runInAction(() => {
        this.rules = rules;
      });
    } catch (error) {
      console.error('Error searching rules:', error);
      this.error = error instanceof Error ? error.message : 'Failed to search rules';
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  get filteredRules() {
    let filtered = this.rules;

    // Filter by tab
    if (this.activeTab === 'active') {
      filtered = filtered.filter(rule => rule.status === 'active');
    } else if (this.activeTab === 'attention') {
      filtered = filtered.filter(rule => 
        rule.status === 'warning' || 
        rule.effectiveness < 70 || 
        rule.false_positives > 100
      );
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query) ||
        rule.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  get activeRulesCount() {
    return this.rules.filter(rule => rule.status === 'active').length;
  }

  get needsAttentionCount() {
    return this.rules.filter(rule => 
      rule.status === 'warning' || 
      rule.effectiveness < 70 || 
      rule.false_positives > 100
    ).length;
  }

  getRulesByCategory = (category: string) => {
    return this.rules.filter(rule => rule.category === category);
  }

  getRulesByStatus = (status: 'active' | 'inactive' | 'warning') => {
    return this.rules.filter(rule => rule.status === status);
  }

  getRulesBySeverity = (severity: 'low' | 'medium' | 'high') => {
    return this.rules.filter(rule => rule.severity === severity);
  }

  // Clear any errors
  clearError = () => {
    this.error = null;
  }
}

export const ruleManagementStore = new RuleManagementStore();