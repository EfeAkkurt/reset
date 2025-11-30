//! Main insurance contract implementation

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Bytes, Map, Symbol, Vec, panic_with_error};

use crate::shared::{AccessControl, ContractError, PolicyStatus, ClaimStatus, ReentrancyGuard};
use crate::insurance::{
    types::{Policy, Claim, ClaimEvidence, CreatePolicyParams, PolicyStats},
};

/// Insurance contract for policy management, premium collection, and claim processing
#[contracttype]
pub struct InsuranceContract {
    /// Mapping from policy ID to Policy data
    policies: Map<Bytes, Policy>,
    /// Mapping from policy holder to their policies
    user_policies: Map<Address, Vec<Bytes>>,
    /// Mapping from claim ID to Claim data
    claims: Map<Bytes, Claim>,
    /// Global policy statistics
    stats: PolicyStats,
    /// Risk pool balance (for claims)
    risk_pool_balance: i128,
    /// Premium pool balance (collected premiums)
    premium_pool_balance: i128,
    /// Authorized administrators
    authorized_admins: Vec<Address>,
    /// Authorized claim processors
    authorized_processors: Vec<Address>,
    /// Reentrancy guard
    reentrancy_guard: ReentrancyGuard,
    /// Configuration
    config: InsuranceConfig,
}

/// Insurance contract configuration
#[derive(Clone, Debug)]
pub struct InsuranceConfig {
    /// Minimum coverage amount
    pub min_coverage: i128,
    /// Maximum coverage amount
    pub max_coverage: i128,
    /// Minimum policy duration in seconds (1 day)
    pub min_duration: u64,
    /// Maximum policy duration in seconds (365 days)
    pub max_duration: u64,
    /// Required approvals for claim processing
    pub claim_processing_approvals: u32,
    /// Maximum risk score (0-100)
    pub max_risk_score: u32,
}

impl InsuranceConfig {
    /// Get default configuration
    pub fn default(env: &Env) -> Self {
        Self {
            min_coverage: 100, // $1 minimum coverage
            max_coverage: 1000000, // $10,000 maximum coverage
            min_duration: 86400, // 1 day minimum
            max_duration: 31536000, // 365 days maximum
            claim_processing_approvals: 1, // Single approval required for Phase 1
            max_risk_score: 80, // Maximum acceptable risk score
        }
    }
}

#[contractimpl]
impl InsuranceContract {
    /// Initialize the insurance contract
    pub fn __constructor(env: Env, admin: Address) {
        let contract = Self {
            policies: Map::new(env),
            user_policies: Map::new(env),
            claims: Map::new(env),
            stats: PolicyStats {
                active_policies: 0,
                total_coverage: 0,
                total_premiums: 0,
                total_claims_paid: 0,
                pending_claims: 0,
            },
            risk_pool_balance: 0,
            premium_pool_balance: 0,
            authorized_admins: Vec::from_array(env, [admin]),
            authorized_processors: Vec::from_array(env, [admin]), // Admin can process claims initially
            reentrancy_guard: ReentrancyGuard::new(),
            config: InsuranceConfig::default(env),
        };

        contract.initialize(env);
    }

    /// Create a new insurance policy
    ///
    /// # Arguments
    /// * `policy_id` - Unique identifier for the policy
    /// * `params` - Policy creation parameters
    pub fn create_policy(env: Env, policy_id: Bytes, params: CreatePolicyParams) {
        // Validate inputs
        Self::validate_create_policy_params(&env, &params);

        // Check if policy already exists
        if env.storage().instance().has(&Symbol::new(&env, "policies"), &policy_id) {
            panic_with_error!(&env, ContractError::PolicyAlreadyExists);
        }

        // Create and store the policy
        let mut policy = Policy::new(params.clone(), policy_id.clone(), &env);

        // Calculate premium based on risk score (already calculated by backend)
        let required_premium = params.premium;

        // Store the policy
        env.storage().instance().set(&Symbol::new(&env, "policies"), &policy_id, &policy);

        // Add to user's policy list
        let mut user_policies = env.storage().instance()
            .get(&Symbol::new(&env, "user_policies"), &params.holder)
            .unwrap_or_else(|| Vec::new(&env));

        user_policies.push_back(policy_id);
        env.storage().instance().set(&Symbol::new(&env, "user_policies"), &params.holder, &user_policies);

        // Update statistics
        let mut stats = Self::get_stats(&env);
        stats.active_policies += 1;
        stats.total_coverage += policy.coverage_amount;
        stats.total_premiums += required_premium;
        Self::set_stats(&env, stats);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "policy_created"),
            policy_id,
            policy.holder,
            policy.coverage_amount,
            policy.premium,
            policy.risk_score,
        ));
    }

    /// Pay premium for a policy
    ///
    /// # Arguments
    /// * `policy_id` - ID of the policy to pay premium for
    /// * `amount` - Premium amount to pay
    pub fn pay_premium(env: Env, policy_id: Bytes, amount: i128) {
        // Get the policy
        let mut policy = Self::get_policy(&env, &policy_id);

        // Check if policy is active
        if !policy.is_active(&env) {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        // Validate premium amount
        if amount != policy.premium {
            panic_with_error!(&env, ContractError::InvalidInput);
        }

        // Update premium pool balance
        let current_balance = Self::get_premium_pool_balance(&env);
        let new_balance = current_balance + amount;
        Self::set_premium_pool_balance(&env, new_balance);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "premium_paid"),
            policy_id,
            policy.holder,
            amount,
            new_balance,
        ));
    }

    /// Submit an insurance claim
    ///
    /// # Arguments
    /// * `claim_id` - Unique identifier for the claim
    /// * `policy_id` - ID of the policy being claimed
    /// * `amount` - Claim amount
    /// * `evidence` - Evidence supporting the claim
    pub fn submit_claim(env: Env, claim_id: Bytes, policy_id: Bytes, amount: i128, evidence: ClaimEvidence) {
        // Get the policy
        let policy = Self::get_policy(&env, &policy_id);

        // Check if policy is active
        if !policy.is_active(&env) {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        // Validate claim amount doesn't exceed effective coverage
        if amount > policy.effective_coverage() {
            panic_with_error!(&env, ContractError::InvalidClaimAmount);
        }

        // Check if claim already exists
        if env.storage().instance().has(&Symbol::new(&env, "claims"), &claim_id) {
            panic_with_error!(&env, ContractError::InvalidInput);
        }

        // Create and store the claim
        let claim = Claim::new(
            claim_id.clone(),
            policy_id.clone(),
            policy.holder,
            amount,
            evidence,
            &env,
        );

        env.storage().instance().set(&Symbol::new(&env, "claims"), &claim_id, &claim);

        // Update statistics
        let mut stats = Self::get_stats(&env);
        stats.pending_claims += 1;
        Self::set_stats(&env, stats);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "claim_submitted"),
            claim_id,
            policy_id,
            policy.holder,
            amount,
        ));
    }

    /// Process a claim (approve or reject)
    ///
    /// # Arguments
    /// * `claim_id` - ID of the claim to process
    /// * `approved` - Whether to approve the claim
    /// * `processor` - Address of the claim processor
    /// * `reason` - Reason for the decision
    pub fn process_claim(env: Env, claim_id: Bytes, approved: bool, processor: Address, reason: Symbol) {
        // Check if processor is authorized
        let processors = Self::get_authorized_processors(&env);
        if !processors.contains(&processor) {
            panic_with_error!(&env, ContractError::Unauthorized);
        }

        // Get the claim
        let mut claim = Self::get_claim(&env, &claim_id);

        // Check if claim is pending
        if !claim.is_pending() {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        if approved {
            // Approve the claim
            claim.approve(processor.clone(), reason, &env);

            // Check if risk pool has sufficient balance
            let risk_pool_balance = Self::get_risk_pool_balance(&env);
            if risk_pool_balance < claim.amount {
                panic_with_error!(&env, ContractError::InsufficientBalance);
            }

            // Update risk pool balance
            let new_balance = risk_pool_balance - claim.amount;
            Self::set_risk_pool_balance(&env, new_balance);

            // Update statistics
            let mut stats = Self::get_stats(&env);
            stats.total_claims_paid += claim.amount;
            stats.pending_claims -= 1;
            Self::set_stats(&env, stats);

            // Emit event
            env.events().publish((
                Symbol::new(&env, "claim_approved"),
                claim_id,
                claim.amount,
                processor,
                reason,
            ));
        } else {
            // Reject the claim
            claim.reject(processor, reason, &env);

            // Update statistics
            let mut stats = Self::get_stats(&env);
            stats.pending_claims -= 1;
            Self::set_stats(&env, stats);

            // Emit event
            env.events().publish((
                Symbol::new(&env, "claim_rejected"),
                claim_id,
                processor,
                reason,
            ));
        }

        // Store updated claim
        env.storage().instance().set(&Symbol::new(&env, "claims"), &claim_id, &claim);
    }

    /// Get policy information
    pub fn get_policy(env: Env, policy_id: Bytes) -> Policy {
        env.storage().instance()
            .get(&Symbol::new(&env, "policies"), &policy_id)
            .unwrap_or_else(|| panic_with_error!(&env, ContractError::PolicyNotFound))
    }

    /// Get claim information
    pub fn get_claim(env: Env, claim_id: Bytes) -> Claim {
        env.storage().instance()
            .get(&Symbol::new(&env, "claims"), &claim_id)
            .unwrap_or_else(|| panic!("Claim not found"))
    }

    /// Get all policies for a user
    pub fn get_user_policies(env: Env, user: Address) -> Vec<Bytes> {
        env.storage().instance()
            .get(&Symbol::new(&env, "user_policies"), &user)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Get global statistics
    pub fn get_stats(env: Env) -> PolicyStats {
        env.storage().instance()
            .get(&Symbol::new(&env, "stats"))
            .unwrap_or_else(|| PolicyStats {
                active_policies: 0,
                total_coverage: 0,
                total_premiums: 0,
                total_claims_paid: 0,
                pending_claims: 0,
            })
    }

    /// Add funds to the risk pool (admin only)
    pub fn fund_risk_pool(env: Env, admin: Address, amount: i128) {
        Self::require_admin(&env, admin);

        let current_balance = Self::get_risk_pool_balance(&env);
        let new_balance = current_balance + amount;
        Self::set_risk_pool_balance(&env, new_balance);

        env.events().publish((
            Symbol::new(&env, "risk_pool_funded"),
            admin,
            amount,
            new_balance,
        ));
    }

    /// Get current risk pool balance
    pub fn get_risk_pool_balance(env: Env) -> i128 {
        env.storage().instance()
            .get(&Symbol::new(&env, "risk_pool_balance"))
            .unwrap_or(0)
    }

    /// Get current premium pool balance
    pub fn get_premium_pool_balance(env: Env) -> i128 {
        env.storage().instance()
            .get(&Symbol::new(&env, "premium_pool_balance"))
            .unwrap_or(0)
    }

    /// Get authorized administrators
    pub fn get_authorized_admins(env: Env) -> Vec<Address> {
        env.storage().instance()
            .get(&Symbol::new(&env, "authorized_admins"))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Get authorized claim processors
    pub fn get_authorized_processors(env: Env) -> Vec<Address> {
        env.storage().instance()
            .get(&Symbol::new(&env, "authorized_processors"))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Add an authorized claim processor (admin only)
    pub fn add_authorized_processor(env: Env, admin: Address, processor: Address) {
        Self::require_admin(&env, admin);

        let mut processors = Self::get_authorized_processors(&env);
        if !processors.contains(&processor) {
            processors.push_back(processor);
        }

        env.storage().instance().set(&Symbol::new(&env, "authorized_processors"), &processors);
    }

    /// Remove an authorized claim processor (admin only)
    pub fn remove_authorized_processor(env: Env, admin: Address, processor: Address) {
        Self::require_admin(&env, admin);

        let mut processors = Self::get_authorized_processors(&env);
        // Remove processor from the vector
        let mut i = 0;
        while i < processors.len() {
            if processors.get(i).unwrap() == &processor {
                processors.remove(i);
            } else {
                i += 1;
            }
        }

        env.storage().instance().set(&Symbol::new(&env, "authorized_processors"), &processors);
    }

    // Private helper methods

    fn initialize(env: Env) {
        // Set initial empty data
        env.storage().instance().set(&Symbol::new(&env, "policies"), &Map::new(&env));
        env.storage().instance().set(&Symbol::new(&env, "user_policies"), &Map::new(&env));
        env.storage().instance().set(&Symbol::new(&env, "claims"), &Map::new(&env));
        env.storage().instance().set(&Symbol::new(&env, "risk_pool_balance"), &0);
        env.storage().instance().set(&Symbol::new(&env, "premium_pool_balance"), &0);
    }

    fn require_admin(env: &Env, caller: Address) {
        let admins = Self::get_authorized_admins(env);
        if !admins.contains(&caller) {
            panic_with_error!(env, ContractError::Unauthorized);
        }
    }

    fn validate_create_policy_params(env: &Env, params: &CreatePolicyParams) {
        // Validate coverage amount
        if params.coverage_amount <= 0 {
            panic!("Coverage amount must be positive");
        }

        // Validate duration
        if params.duration == 0 {
            panic!("Duration must be positive");
        }

        // Validate risk score
        if params.risk_score > 100 {
            panic!("Risk score cannot exceed 100");
        }

        // Validate premium
        if params.premium < 0 {
            panic!("Premium cannot be negative");
        }
    }

    fn set_stats(env: &Env, stats: PolicyStats) {
        env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);
    }

    fn set_risk_pool_balance(env: &Env, balance: i128) {
        env.storage().instance().set(&Symbol::new(&env, "risk_pool_balance"), &balance);
    }

    fn set_premium_pool_balance(env: &Env, balance: i128) {
        env.storage().instance().set(&Symbol::new(&env, "premium_pool_balance"), &balance);
    }
}