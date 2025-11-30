//! Very simple insurance contract that demonstrates basic Soroban patterns

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, Symbol, Vec};

/// Policy data structure
#[derive(Clone)]
#[contracttype]
pub struct Policy {
    pub holder: Address,
    pub amount: i128,
    pub active: bool,
}

// Contract storage keys - created at runtime

#[contract]
pub struct SimpleInsurance;

#[contractimpl]
impl SimpleInsurance {
    /// Create a new policy
    pub fn create_policy(env: Env, holder: Address, amount: i128) -> u32 {
        // Simple ID generation - in production use proper hashing
        let policy_id = env.ledger().sequence() as u32;

        // Create policy
        let policy = Policy {
            holder: holder.clone(),
            amount,
            active: true,
        };

        // Store policy
        let mut policies: Map<u32, Policy> = env.storage().instance()
            .get(&Symbol::new(&env, "POLICIES"))
            .unwrap_or(Map::new(&env));

        policies.set(policy_id, policy.clone());
        env.storage().instance().set(&Symbol::new(&env, "POLICIES"), &policies);

        // Add to user policies
        let mut user_policies: Map<Address, Vec<u32>> = env.storage().instance()
            .get(&Symbol::new(&env, "USER_POLICIES"))
            .unwrap_or(Map::new(&env));

        let mut policies_vec = user_policies.get(holder.clone()).unwrap_or(Vec::new(&env));
        policies_vec.push_back(policy_id);
        user_policies.set(holder, policies_vec);
        env.storage().instance().set(&Symbol::new(&env, "USER_POLICIES"), &user_policies);

        policy_id
    }

    /// Get policy information
    pub fn get_policy(env: Env, policy_id: u32) -> Policy {
        let policies: Map<u32, Policy> = env.storage().instance()
            .get(&Symbol::new(&env, "POLICIES"))
            .unwrap_or(Map::new(&env));

        policies.get(policy_id).unwrap_or_else(|| panic!("Policy not found"))
    }

    /// Get all policies for a user
    pub fn get_user_policies(env: Env, user: Address) -> Vec<u32> {
        let user_policies: Map<Address, Vec<u32>> = env.storage().instance()
            .get(&Symbol::new(&env, "USER_POLICIES"))
            .unwrap_or(Map::new(&env));

        user_policies.get(user).unwrap_or(Vec::new(&env))
    }

    /// Deactivate a policy (simplified - anyone can deactivate for now)
    pub fn deactivate_policy(env: Env, policy_id: u32) {
        let mut policies: Map<u32, Policy> = env.storage().instance()
            .get(&Symbol::new(&env, "POLICIES"))
            .unwrap_or(Map::new(&env));

        let mut policy = policies.get(policy_id).unwrap_or_else(|| panic!("Policy not found"));
        policy.active = false;
        policies.set(policy_id, policy);
        env.storage().instance().set(&Symbol::new(&env, "POLICIES"), &policies);
    }
}