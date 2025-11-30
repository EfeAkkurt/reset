//! Simplified insurance contract for demonstration

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Bytes, Map, Symbol, Vec, panic_with_error};

use crate::shared::{ContractError};

/// Policy data structure
#[derive(Clone)]
#[contracttype]
pub struct Policy {
    pub holder: Address,
    pub premium: i128,
    pub coverage: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub active: bool,
}

/// Claim data structure
#[derive(Clone)]
#[contracttype]
pub struct Claim {
    pub policy_id: Bytes,
    pub amount: i128,
    pub evidence: Bytes,
    pub processed: bool,
    pub approved: bool,
}

/// Insurance contract storage structure
#[contracttype]
pub struct InsuranceContract {
    policies: Map<Bytes, Policy>,
    claims: Map<Bytes, Claim>,
    user_policies: Map<Address, Vec<Bytes>>,
    authorized_admins: Vec<Address>,
}

#[contractimpl]
impl InsuranceContract {
    /// Initialize the insurance contract
    pub fn __constructor(env: Env, admin: Address) {
        let contract = Self {
            policies: Map::new(&env),
            claims: Map::new(&env),
            user_policies: Map::new(&env),
            authorized_admins: Vec::from_array(&env, [admin]),
        };

        env.storage().instance().set(&Symbol::new(&env, "INSURANCE_CONTRACT"), &contract);
    }

    /// Create a new insurance policy
    pub fn create_policy(env: Env, holder: Address, premium: i128, coverage: i128, duration_days: u64) -> Bytes {
        // Get contract instance
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "INSURANCE_CONTRACT"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        // Generate policy ID (simplified - in production use proper hashing)
        let policy_id = Bytes::from_slice(&env, b"policy_").concat(&Bytes::from_slice(&env, &holder.to_string().as_bytes().to_vec()));

        // Create policy
        let current_time = env.ledger().timestamp();
        let policy = Policy {
            holder: holder.clone(),
            premium,
            coverage,
            start_time: current_time,
            end_time: current_time + (duration_days * 24 * 60 * 60),
            active: true,
        };

        // Store policy
        contract.policies.set(policy_id.clone(), policy);

        // Add to user policies
        let mut user_policies = contract.user_policies.get(holder).unwrap_or_else(|| Vec::new(&env));
        user_policies.push_back(policy_id.clone());
        contract.user_policies.set(holder, user_policies);

        // Save contract state
        env.storage().instance().set(&Symbol::new(&env, "INSURANCE_CONTRACT"), &contract);

        policy_id
    }

    /// Submit a claim
    pub fn submit_claim(env: Env, policy_id: Bytes, amount: i128, evidence: Bytes) -> Bytes {
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "INSURANCE_CONTRACT"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        // Check if policy exists and is active
        let policy = contract.policies.get(policy_id.clone())
            .unwrap_or_else(|| panic!("Policy not found"));

        if !policy.active {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        if amount > policy.coverage {
            panic_with_error!(&env, ContractError::InvalidClaimAmount);
        }

        // Generate claim ID
        let claim_id = Bytes::from_slice(&env, b"claim_").concat(&Bytes::from_slice(&env, &policy_id.to_vec()));

        // Create claim
        let claim = Claim {
            policy_id: policy_id.clone(),
            amount,
            evidence,
            processed: false,
            approved: false,
        };

        // Store claim
        contract.claims.set(claim_id.clone(), claim);

        // Save contract state
        env.storage().instance().set(&Symbol::new(&env, "INSURANCE_CONTRACT"), &contract);

        claim_id
    }

    /// Process a claim (admin only)
    pub fn process_claim(env: Env, claim_id: Bytes, approve: bool) {
        let caller = env.current_contract_address();
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "INSURANCE_CONTRACT"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        // Simple admin check (in production, use proper role management)
        if !contract.authorized_admins.contains(&caller) {
            panic_with_error!(&env, ContractError::Unauthorized);
        }

        // Get and update claim
        let mut claim = contract.claims.get(claim_id.clone())
            .unwrap_or_else(|| panic!("Claim not found"));

        if claim.processed {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        claim.processed = true;
        claim.approved = approve;

        // If approved, deactivate the policy
        if approve {
            let mut policy = contract.policies.get(claim.policy_id.clone())
                .unwrap_or_else(|| panic!("Policy not found"));
            policy.active = false;
            contract.policies.set(claim.policy_id, policy);
        }

        // Store updated claim
        contract.claims.set(claim_id, claim);

        // Save contract state
        env.storage().instance().set(&Symbol::new(&env, "INSURANCE_CONTRACT"), &contract);
    }

    /// Get policy information
    pub fn get_policy(env: Env, policy_id: Bytes) -> Policy {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "INSURANCE_CONTRACT"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.policies.get(policy_id)
            .unwrap_or_else(|| panic!("Policy not found"))
    }

    /// Get claim information
    pub fn get_claim(env: Env, claim_id: Bytes) -> Claim {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "INSURANCE_CONTRACT"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.claims.get(claim_id)
            .unwrap_or_else(|| panic!("Claim not found"))
    }

    /// Get all policies for a user
    pub fn get_user_policies(env: Env, user: Address) -> Vec<Bytes> {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "INSURANCE_CONTRACT"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.user_policies.get(user).unwrap_or_else(|| Vec::new(&env))
    }
}