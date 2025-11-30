//! Shared types and utilities used across all contracts

use soroban_sdk::{Address, Env, Error, Vec, panic_with_error};

/// Role-based access control system
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug)]
#[repr(u32)]
pub enum Role {
    None = 0,
    Admin = 1,
    Operator = 2,
    ClaimProcessor = 4,
    All = u32::MAX,
}

/// Contract-wide errors
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    /// Unauthorized access attempt
    Unauthorized = 1,
    /// Invalid input parameters
    InvalidInput = 2,
    /// Insufficient balance
    InsufficientBalance = 3,
    /// Policy not found
    PolicyNotFound = 4,
    /// Policy already exists
    PolicyAlreadyExists = 5,
    /// Policy has expired
    PolicyExpired = 6,
    /// Claim already processed
    ClaimAlreadyProcessed = 7,
    /// Invalid claim amount
    InvalidClaimAmount = 8,
    /// Reentrancy protection triggered
    ReentrantCall = 9,
    /// Invalid contract state
    InvalidState = 10,
    /// Transfer not yet authorized
    TransferNotAuthorized = 11,
    /// Transfer already authorized
    TransferAlreadyAuthorized = 12,
    /// Insufficient approvals
    InsufficientApprovals = 13,
    /// Risk score out of range
    RiskScoreOutOfRange = 14,
}

impl From<ContractError> for Error {
    fn from(err: ContractError) -> Self {
        Error::from_contract_error(err as u32)
    }
}

/// Policy status
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PolicyStatus {
    /// Policy is active
    Active,
    /// Policy has expired
    Expired,
    /// Policy has been claimed
    Claimed,
    /// Policy has been cancelled
    Cancelled,
}

/// Claim status
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ClaimStatus {
    /// Claim is pending approval
    Pending,
    /// Claim has been approved
    Approved,
    /// Claim has been rejected
    Rejected,
    /// Claim has been paid out
    Paid,
}

/// Access control trait for role-based permissions
pub struct AccessControl;

impl AccessControl {
    /// Require a specific role to execute a function
    pub fn require_role(env: &Env, authorized_roles: Vec<Address>, caller: Address, required_role: Role) {
        if !Self::has_role(env, &authorized_roles, caller, required_role) {
            panic_with_error!(env, ContractError::Unauthorized);
        }
    }

    /// Check if an address has a specific role
    pub fn has_role(_env: &Env, authorized_roles: &Vec<Address>, user: Address, _role: Role) -> bool {
        // For now, implement simple role checking
        // In production, this would be more sophisticated
        authorized_roles.contains(&user)
    }

    /// Grant a role to an address (admin only)
    pub fn grant_role(_env: &Env, authorized_roles: &mut Vec<Address>, _admin: Address, user: Address, _role: Role) {
        // For simplicity, just add to authorized_roles
        // In production, implement proper role management
        if !authorized_roles.contains(&user) {
            authorized_roles.push_back(user);
        }
    }

    /// Revoke a role from an address (admin only)
    pub fn revoke_role(_env: &Env, authorized_roles: &mut Vec<Address>, _admin: Address, user: Address) {
        // Remove user from authorized roles
        let mut i = 0;
        while i < authorized_roles.len() {
            if authorized_roles.get(i).unwrap() == user {
                authorized_roles.remove(i);
            } else {
                i += 1;
            }
        }
    }
}

/// Reentrancy guard to prevent recursive calls
pub struct ReentrancyGuard {
    pub locked: bool,
}

impl ReentrancyGuard {
    /// Create a new reentrancy guard
    pub fn new() -> Self {
        Self { locked: false }
    }

    /// Start protection - panic if already locked
    pub fn start_protection(&mut self, env: &Env) {
        if self.locked {
            panic_with_error!(env, ContractError::ReentrantCall);
        }
        self.locked = true;
    }

    /// End protection
    pub fn end_protection(&mut self, env: &Env) {
        if !self.locked {
            panic_with_error!(env, ContractError::InvalidState);
        }
        self.locked = false;
    }
}

/// Time utilities
pub mod time {
    use soroban_sdk::Env;

    /// Get current ledger timestamp
    pub fn current_timestamp(env: &Env) -> u64 {
        env.ledger().timestamp()
    }

    /// Add days to timestamp
    pub fn add_days(timestamp: u64, days: u64) -> u64 {
        timestamp + (days * 24 * 60 * 60)
    }

    /// Check if timestamp has expired
    pub fn is_expired(env: &Env, expiry_time: u64) -> bool {
        current_timestamp(env) >= expiry_time
    }
}

/// Math utilities
pub mod math {
    use soroban_sdk::Env;

    /// Safe addition that panics on overflow
    pub fn safe_add_i128(_env: &Env, a: i128, b: i128) -> i128 {
        let result = a.checked_add(b);
        match result {
            Some(val) => val,
            None => panic!("Integer overflow in safe_add_i128"),
        }
    }

    /// Safe subtraction that panics on underflow
    pub fn safe_sub_i128(_env: &Env, a: i128, b: i128) -> i128 {
        let result = a.checked_sub(b);
        match result {
            Some(val) => val,
            None => panic!("Integer underflow in safe_sub_i128"),
        }
    }

    /// Safe multiplication that panics on overflow
    pub fn safe_mul_i128(_env: &Env, a: i128, b: i128) -> i128 {
        let result = a.checked_mul(b);
        match result {
            Some(val) => val,
            None => panic!("Integer overflow in safe_mul_i128"),
        }
    }

    /// Calculate percentage
    pub fn percentage_of(env: &Env, amount: i128, percentage: u32) -> i128 {
        safe_mul_i128(env, amount, percentage as i128) / 100
    }

    /// Check if a value is within a range
    pub fn is_in_range(_env: &Env, value: i128, min: i128, max: i128) -> bool {
        value >= min && value <= max
    }
}