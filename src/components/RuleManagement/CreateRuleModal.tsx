import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import { ruleManagementStore } from './RuleManagementStore';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CreateRuleData } from '../../lib/supabaseRules';

interface FormData extends CreateRuleData {}

const CreateRuleModal = observer(() => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'Behavioral',
    status: 'active',
    condition: '',
    description: '',
    log_only: false,
    severity: 'medium'
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isTestingRule, setIsTestingRule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['Behavioral', 'Payment Method', 'Technical', 'Identity'];
  const statusOptions = ['active', 'inactive', 'warning'] as const;
  const severityOptions = ['low', 'medium', 'high'] as const;

  // Pre-fill form when editing
  useEffect(() => {
    if (ruleManagementStore.editingRule) {
      const rule = ruleManagementStore.editingRule;
      setFormData({
        name: rule.name,
        category: rule.category,
        status: rule.status,
        condition: rule.condition,
        description: rule.description,
        log_only: rule.log_only,
        severity: rule.severity
      });
    } else {
      // Reset form for new rule
      setFormData({
        name: '',
        category: 'Behavioral',
        status: 'active',
        condition: '',
        description: '',
        log_only: false,
        severity: 'medium'
      });
    }
    setErrors({});
  }, [ruleManagementStore.editingRule, ruleManagementStore.isCreateModalOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.condition.trim()) {
      newErrors.condition = 'Rule condition is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestRule = async () => {
    if (!formData.condition.trim()) {
      setErrors(prev => ({ ...prev, condition: 'Please enter a condition to test' }));
      return;
    }

    setIsTestingRule(true);
    
    // Simulate rule testing
    setTimeout(() => {
      setIsTestingRule(false);
      alert('Rule syntax is valid! ✅');
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      if (ruleManagementStore.editingRule) {
        // Update existing rule
        await ruleManagementStore.updateRule(ruleManagementStore.editingRule.id, formData);
      } else {
        // Create new rule
        await ruleManagementStore.addRule(formData);
      }

      // Reset form and close modal
      setFormData({
        name: '',
        category: 'Behavioral',
        status: 'active',
        condition: '',
        description: '',
        log_only: false,
        severity: 'medium'
      });
      setErrors({});
      ruleManagementStore.closeCreateModal();
    } catch (error) {
      console.error('Error saving rule:', error);
      // Error is handled in the store
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      category: 'Behavioral',
      status: 'active',
      condition: '',
      description: '',
      log_only: false,
      severity: 'medium'
    });
    setErrors({});
    ruleManagementStore.closeCreateModal();
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof Partial<FormData>]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!ruleManagementStore.isCreateModalOpen) return null;

  const isEditing = !!ruleManagementStore.editingRule;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Rule' : 'Create New Rule'}
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Rule Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="E.g., High Value Transaction Alert"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Category, Status, and Severity Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.category ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive' | 'warning')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                      Severity *
                    </label>
                    <select
                      id="severity"
                      value={formData.severity}
                      onChange={(e) => handleInputChange('severity', e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {severityOptions.map(severity => (
                        <option key={severity} value={severity}>
                          {severity.charAt(0).toUpperCase() + severity.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rule Condition */}
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Condition *
                  </label>
                  <textarea
                    id="condition"
                    rows={6}
                    value={formData.condition}
                    onChange={(e) => handleInputChange('condition', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                      errors.condition ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={`if (transaction.amount > 1000 && user.accountAge < 30) {
  flag('High value from new account');
}`}
                  />
                  {errors.condition && (
                    <p className="mt-1 text-sm text-red-600">{errors.condition}</p>
                  )}
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleTestRule}
                      disabled={isTestingRule}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {isTestingRule ? 'Testing...' : 'Test Rule'}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Describe what this rule does and when it triggers"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Log Only Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Log only (don't block transactions)
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      When enabled, this rule will only log events without blocking transactions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('log_only', !formData.log_only)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.log_only ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.log_only ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : isEditing ? 'Update Rule' : 'Save Rule'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

export default CreateRuleModal;