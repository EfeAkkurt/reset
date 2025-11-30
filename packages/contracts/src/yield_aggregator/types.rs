//! Yield aggregator contract types

use soroban_sdk::{Address, Env, Map, Symbol, Vec};

/// Deposit structure representing a user's deposit
#[derive(Clone, Debug)]
pub struct Deposit {
    /// Depositor's address
    pub depositor: Address,
    /// Total deposited amount
    pub amount: i128,
    /// Amount allocated to insurance fund
    pub insurance_allocation: i128,
    /// Amount allocated to yield generation
    pub yield_allocation: i128,
    /// Timestamp of the deposit
    pub deposit_time: u64,
    /// Total yield earned so far
    pub yield_earned: i128,
    /// Last yield claim timestamp
    pub last_yield_claim: u64,
    /// Associated pool ID
    pub pool_id: Vec<u8>,
    /// Deposit status
    pub status: DepositStatus,
}

/// Yield allocation between insurance and yield generation
#[derive(Clone, Debug)]
pub struct YieldAllocation {
    /// Percentage allocated to insurance fund (0-100)
    pub insurance_percentage: u32,
    /// Percentage allocated to yield generation (0-100)
    pub yield_percentage: u32,
}

/// Pool statistics
#[derive(Clone, Debug)]
pub struct PoolStats {
    /// Total deposits in the pool
    pub total_deposits: i128,
    /// Total yield allocated
    pub total_yield_allocation: i128,
    /// Total insurance allocation
    pub total_insurance_allocation: i128,
    /// Total yield earned
    pub total_yield_earned: i128,
    /// Number of active deposits
    pub active_deposits: u64,
    /// Annual percentage yield (APY)
    pub current_apy: u32,
}

/// Deposit status
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DepositStatus {
    /// Deposit is active
    Active,
    /// Deposit is being withdrawn
    Withdrawing,
    /// Deposit has been fully withdrawn
    Withdrawn,
}

/// Deposit parameters
#[derive(Clone, Debug)]
pub struct DepositParams {
    /// Depositor's address
    pub depositor: Address,
    /// Amount to deposit
    pub amount: i128,
    /// Pool ID to deposit into
    pub pool_id: Vec<u8>,
    /// Whether to allocate to insurance fund
    pub allocate_to_insurance: bool,
    /// Custom allocation percentages (optional)
    pub custom_allocation: Option<YieldAllocation>,
}

/// Withdrawal parameters
#[derive(Clone, Debug)]
pub struct WithdrawParams {
    /// Depositor's address
    pub depositor: Address,
    /// Amount to withdraw
    pub amount: i128,
    /// Whether to withdraw from insurance allocation
    pub from_insurance: bool,
    /// Whether to withdraw from yield allocation
    pub from_yield: bool,
}

impl Default for YieldAllocation {
    fn default() -> Self {
        Self {
            insurance_percentage: 10, // 10% to insurance fund
            yield_percentage: 90,     // 90% to yield generation
        }
    }
}

impl Deposit {
    /// Create a new deposit
    pub fn new(params: DepositParams, default_allocation: YieldAllocation, env: &Env) -> Self {
        let allocation = params.custom_allocation.unwrap_or(default_allocation);

        // Validate allocation percentages
        if allocation.insurance_percentage + allocation.yield_percentage != 100 {
            panic!("Allocation percentages must sum to 100");
        }

        let insurance_amount = (params.amount * allocation.insurance_percentage as i128) / 100;
        let yield_amount = params.amount - insurance_amount;

        Self {
            depositor: params.depositor,
            amount: params.amount,
            insurance_allocation: insurance_amount,
            yield_allocation: yield_amount,
            deposit_time: env.ledger().timestamp(),
            yield_earned: 0,
            last_yield_claim: env.ledger().timestamp(),
            pool_id: params.pool_id,
            status: DepositStatus::Active,
        }
    }

    /// Get current yield allocation percentage
    pub fn yield_percentage(&self) -> u32 {
        if self.amount == 0 {
            return 0;
        }
        ((self.yield_allocation * 100) / self.amount) as u32
    }

    /// Get current insurance allocation percentage
    pub fn insurance_percentage(&self) -> u32 {
        if self.amount == 0 {
            return 0;
        }
        ((self.insurance_allocation * 100) / self.amount) as u32
    }

    /// Check if deposit is active
    pub fn is_active(&self) -> bool {
        matches!(self.status, DepositStatus::Active)
    }

    /// Calculate total value (principal + yield)
    pub fn total_value(&self) -> i128 {
        self.amount + self.yield_earned
    }

    /// Calculate yield rate since deposit
    pub fn yield_rate(&self, env: &Env) -> u32 {
        let time_elapsed = env.ledger().timestamp() - self.deposit_time;
        if time_elapsed == 0 {
            return 0;
        }

        // Annualized yield rate (simplified)
        let seconds_in_year = 365 * 24 * 60 * 60;
        ((self.yield_earned * 100 * seconds_in_year) / (self.yield_allocation * time_elapsed)) as u32
    }

    /// Add yield to the deposit
    pub fn add_yield(&mut self, yield_amount: i128, env: &Env) {
        self.yield_earned += yield_amount;
        self.last_yield_claim = env.ledger().timestamp();
    }

    /// Withdraw amount from deposit
    pub fn withdraw(&mut self, amount: i128, from_insurance: bool, from_yield: bool) -> i128 {
        if amount <= 0 {
            panic!("Withdrawal amount must be positive");
        }

        if from_insurance && from_yield {
            // Withdraw from both allocations proportionally
            let insurance_withdrawal = (amount * self.insurance_allocation) / self.total_value();
            let yield_withdrawal = amount - insurance_withdrawal;

            self.insurance_allocation -= insurance_withdrawal;
            self.yield_allocation -= yield_withdrawal;
        } else if from_insurance {
            // Withdraw only from insurance allocation
            if amount > self.insurance_allocation {
                panic!("Insufficient insurance allocation");
            }
            self.insurance_allocation -= amount;
        } else if from_yield {
            // Withdraw only from yield allocation
            if amount > self.yield_allocation + self.yield_earned {
                panic!("Insufficient yield allocation");
            }

            // First withdraw from yield earned, then from principal
            let available_yield = self.yield_allocation + self.yield_earned;
            if amount <= self.yield_earned {
                self.yield_earned -= amount;
            } else {
                let principal_withdrawal = amount - self.yield_earned;
                self.yield_earned = 0;
                self.yield_allocation -= principal_withdrawal;
            }
        }

        self.amount -= amount;

        // Mark as withdrawn if fully depleted
        if self.amount <= 0 {
            self.status = DepositStatus::Withdrawn;
        }

        amount
    }
}

impl PoolStats {
    /// Create new pool statistics
    pub fn new() -> Self {
        Self {
            total_deposits: 0,
            total_yield_allocation: 0,
            total_insurance_allocation: 0,
            total_yield_earned: 0,
            active_deposits: 0,
            current_apy: 0,
        }
    }

    /// Update statistics with a new deposit
    pub fn add_deposit(&mut self, deposit: &Deposit) {
        self.total_deposits += deposit.amount;
        self.total_yield_allocation += deposit.yield_allocation;
        self.total_insurance_allocation += deposit.insurance_allocation;
        self.active_deposits += 1;
    }

    /// Update statistics with a withdrawal
    pub fn remove_deposit(&mut self, deposit: &Deposit) {
        self.total_deposits -= deposit.amount;
        self.total_yield_allocation -= deposit.yield_allocation;
        self.total_insurance_allocation -= deposit.insurance_allocation;
        if deposit.status == DepositStatus::Withdrawn {
            self.active_deposits -= 1;
        }
    }

    /// Add yield earned to statistics
    pub fn add_yield_earned(&mut self, yield_amount: i128) {
        self.total_yield_earned += yield_amount;
    }

    /// Calculate current APY based on yield earned
    pub fn calculate_current_apy(&mut self) {
        if self.total_yield_allocation == 0 {
            self.current_apy = 0;
            return;
        }

        // Simplified APY calculation
        let yield_rate = (self.total_yield_earned * 10000) / self.total_yield_allocation;
        self.current_apy = yield_rate as u32;
    }

    /// Get insurance fund percentage
    pub fn insurance_fund_percentage(&self) -> u32 {
        if self.total_deposits == 0 {
            return 0;
        }
        ((self.total_insurance_allocation * 100) / self.total_deposits) as u32
    }
}