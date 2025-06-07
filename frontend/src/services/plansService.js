import supabase from '../supabase/supabaseClient';

/**
 * Service for managing academic plans with Supabase
 */
export const plansService = {
  /**
   * Save an academic plan to Supabase
   * @param {Object} planData - The plan data to save
   * @param {string} planData.name - Plan name
   * @param {string} planData.description - Plan description  
   * @param {Object} planData.plan - The actual course plan object
   * @param {number} planData.currentYear - Starting year
   * @param {Array} planData.years - Array of year offsets
   * @returns {Promise<Object>} The saved plan with ID
   */
  async savePlan(planData) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('User must be authenticated to save plans');
      }

      // Get the user from our custom users table
      const { data: customUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError || !customUser) {
        throw new Error('User not found in database');
      }

      const planRecord = {
        user_id: customUser.id, // Use the custom users table ID
        name: planData.name,
        description: planData.description || '',
        plan_data: planData.plan,
        start_year: planData.currentYear,
        planned_years: planData.years.length
      };

      const { data, error } = await supabase
        .from('Plan')
        .insert([planRecord])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving plan:', error);
      throw error;
    }
  },

  /**
   * Update an existing academic plan
   * @param {string} planId - ID of plan to update
   * @param {Object} planData - Updated plan data
   * @returns {Promise<Object>} The updated plan
   */
  async updatePlan(planId, planData) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('User must be authenticated to update plans');
      }

      // Get the user from our custom users table
      const { data: customUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError || !customUser) {
        throw new Error('User not found in database');
      }

      const updateRecord = {
        name: planData.name,
        description: planData.description || '',
        plan_data: planData.plan,
        start_year: planData.currentYear,
        planned_years: planData.years.length
      };

      const { data, error } = await supabase
        .from('Plan')
        .update(updateRecord)
        .eq('id', planId)
        .eq('user_id', customUser.id)  // ensure user owns the plan
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  },

  /**
   * Get all academic plans for the current user
   * @returns {Promise<Array>} Array of user's academic plans
   */
  async getUserPlans() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        return [];  // return empty array if not authenticated
      }

      // Get the user from our custom users table
      const { data: customUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError || !customUser) {
        return [];  // return empty array if user not found
      }

      const { data, error } = await supabase
        .from('Plan')
        .select('*')
        .eq('user_id', customUser.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user plans:', error);
      throw error;
    }
  },

  /**
   * Get a specific academic plan by ID
   * @param {string} planId - ID of the plan to retrieve
   * @returns {Promise<Object>} The academic plan
   */
  async getPlan(planId) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('User must be authenticated to access plans');
      }

      // Get the user from our custom users table
      const { data: customUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError || !customUser) {
        throw new Error('User not found in database');
      }

      const { data, error } = await supabase
        .from('Plan')
        .select('*')
        .eq('id', planId)
        .eq('user_id', customUser.id)  // ensure user owns the plan
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw error;
    }
  },

  /**
   * Delete an academic plan
   * @param {string} planId - ID of plan to delete
   * @returns {Promise<boolean>} Success status
   */
  async deletePlan(planId) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('User must be authenticated to delete plans');
      }

      // Get the user from our custom users table
      const { data: customUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError || !customUser) {
        throw new Error('User not found in database');
      }

      const { error } = await supabase
        .from('Plan')
        .delete()
        .eq('id', planId)
        .eq('user_id', customUser.id);  // ensure user owns the plan

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }
}; 