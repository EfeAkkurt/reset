//! Insurance contract types

use soroban_sdk::{Address, Bytes, Env, Map, Symbol, Vec};

use crate::shared::{PolicyStatus, ClaimStatus};

/// Policy structure representing an insurance policy
#[derive(Clone, Debug)]
pub struct Policy {
    /// Policy holder's address
    pub holder: Address,
    /// Total coverage amount
    pub coverage_amount: i128,
    /// Premium amount to be paid
    pub premium: i128,
    /// Start time of the policy
    pub start_time: u64,
    /// Duration of the policy in seconds
    pub duration: u64,
    /// Risk score from backend analysis (0-100)
    pub risk_score: u32,
    /// Current status of the policy
    pub status: PolicyStatus,
    /// Associated pool ID for yield generation
    pub pool_id: Bytes,
    /// Additional metadata
    pub metadata: Map<Symbol, Bytes>,
}

/// Claim structure for insurance claims
#[derive(Clone, Debug)]
pub struct Claim {
    /// Unique claim identifier
    pub claim_id: Bytes,
    /// Associated policy ID
    pub policy_id: Bytes,
    /// Claimant's address
    pub claimant: Address,
    /// Claim amount
    pub amount: i128,
    /// Current status of the claim
    pub status: ClaimStatus,
    /// Evidence supporting the claim
    pub evidence: ClaimEvidence,
    /// Timestamp when claim was submitted
    pub submitted_at: u64,
    /// Timestamp when claim was processed
    pub processed_at: Option<u64>,
    /// Processor who handled the claim
    pub processor: Option<Address>,
    /// Reason for claim approval/rejection
    pub reason: Symbol,
}

/// Evidence supporting an insurance claim
#[derive(Clone, Debug)]
pub struct ClaimEvidence {
    /// Type of evidence
    pub evidence_type: Symbol,
    /// Evidence data
    pub data: Bytes,
    /// Timestamp of evidence
    pub timestamp: u64,
    /// Additional notes
    pub notes: Symbol,
}

/// Policy creation parameters
#[derive(Clone, Debug)]
pub struct CreatePolicyParams {
    /// Policy holder
    pub holder: Address,
    /// Coverage amount requested
    pub coverage_amount: i128,
    /// Policy duration in seconds
    pub duration: u64,
    /// Risk score from backend analysis
    pub risk_score: u32,
    /// Associated pool for yield generation
    pub pool_id: Bytes,
    /// Premium amount calculated by backend
    pub premium: i128,
}

/// Policy statistics
#[derive(Clone, Debug)]
pub struct PolicyStats {
    /// Total number of active policies
    pub active_policies: u64,
    /// Total coverage amount across all policies
    pub total_coverage: i128,
    /// Total premium collected
    pub total_premiums: i128,
    /// Total claims paid out
    pub total_claims_paid: i128,
    /// Number of pending claims
    pub pending_claims: u64,
}

impl Policy {
    /// Create a new policy
    pub fn new(params: CreatePolicyParams, policy_id: Bytes, env: &Env) -> Self {
        let current_time = env.ledger().timestamp();

        Self {
            holder: params.holder,
            coverage_amount: params.coverage_amount,
            premium: params.premium,
            start_time: current_time,
            duration: params.duration,
            risk_score: params.risk_score,
            status: PolicyStatus::Active,
            pool_id: params.pool_id,
            metadata: Map::new(env),
        }
    }

    /// Get the expiry time of the policy
    pub fn expiry_time(&self) -> u64 {
        self.start_time + self.duration
    }

    /// Check if the policy is currently active
    pub fn is_active(&self, env: &Env) -> bool {
        self.status == PolicyStatus::Active && !self.is_expired(env)
    }

    /// Check if the policy has expired
    pub fn is_expired(&self, env: &Env) -> bool {
        env.ledger().timestamp() >= self.expiry_time()
    }

    /// Calculate remaining coverage based on risk score
    pub fn effective_coverage(&self) -> i128 {
        // Effective coverage is reduced by risk percentage
        let risk_reduction = (self.coverage_amount * self.risk_score as i128) / 100;
        self.coverage_amount - risk_reduction
    }

    /// Get the premium as a percentage of coverage
    pub fn premium_percentage(&self) -> u32 {
        if self.coverage_amount == 0 {
            return 0;
        }
        ((self.premium * 10000) / self.coverage_amount) as u32
    }
}

impl Claim {
    /// Create a new claim
    pub fn new(
        claim_id: Bytes,
        policy_id: Bytes,
        claimant: Address,
        amount: i128,
        evidence: ClaimEvidence,
        env: &Env,
    ) -> Self {
        Self {
            claim_id,
            policy_id,
            claimant,
            amount,
            status: ClaimStatus::Pending,
            evidence,
            submitted_at: env.ledger().timestamp(),
            processed_at: None,
            processor: None,
            reason: Symbol::new(&env, "pending"),
        }
    }

    /// Approve the claim
    pub fn approve(&mut self, processor: Address, reason: Symbol, env: &Env) {
        self.status = ClaimStatus::Approved;
        self.processed_at = Some(env.ledger().timestamp());
        self.processor = Some(processor);
        self.reason = reason;
    }

    /// Reject the claim
    pub fn reject(&mut self, processor: Address, reason: Symbol, env: &Env) {
        self.status = ClaimStatus::Rejected;
        self.processed_at = Some(env.ledger().timestamp());
        self.processor = Some(processor);
        self.reason = reason;
    }

    /// Mark claim as paid
    pub fn mark_as_paid(&mut self, env: &Env) {
        self.status = ClaimStatus::Paid;
        self.processed_at = Some(env.ledger().timestamp());
        self.reason = Symbol::new(&env, "paid");
    }

    /// Check if the claim is pending
    pub fn is_pending(&self) -> bool {
        self.status == ClaimStatus::Pending
    }

    /// Check if the claim has been processed
    pub fn is_processed(&self) -> bool {
        matches!(self.status, ClaimStatus::Approved | ClaimStatus::Rejected | ClaimStatus::Paid)
    }
}

impl ClaimEvidence {
    /// Create new evidence
    pub fn new(evidence_type: Symbol, data: Bytes, notes: Symbol, env: &Env) -> Self {
        Self {
            evidence_type,
            data,
            timestamp: env.ledger().timestamp(),
            notes,
        }
    }

    /// Create evidence for market loss
    pub fn market_loss_evidence(pool_data: Bytes, market_value: i128, env: &Env) -> Self {
        Self {
            evidence_type: Symbol::new(&env, "market_loss"),
            data: pool_data,
            timestamp: env.ledger().timestamp(),
            notes: Symbol::new(&env, "market_value_loss"),
        }
    }

    /// Create evidence for smart contract failure
    pub fn contract_failure_evidence(contract_data: Bytes, error_details: Symbol, env: &Env) -> Self {
        Self {
            evidence_type: Symbol::new(&env, "contract_failure"),
            data: contract_data,
            timestamp: env.ledger().timestamp(),
            notes: error_details,
        }
    }
}