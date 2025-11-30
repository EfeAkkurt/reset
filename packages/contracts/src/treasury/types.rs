//! Treasury contract types

use soroban_sdk::{Address, Env, Symbol, Vec};

/// Pending transfer requiring multi-signature approval
#[derive(Clone, Debug)]
pub struct PendingTransfer {
    /// Unique transfer identifier
    pub transfer_id: Vec<u8>,
    /// Recipient address
    pub to: Address,
    /// Transfer amount
    pub amount: i128,
    /// Reason for the transfer
    pub reason: Symbol,
    /// Number of approvals received
    pub approvals: u32,
    /// Number of approvals required
    pub required_approvals: u32,
    /// Timestamp when transfer was created
    pub created_at: u64,
    /// Timestamp when transfer was executed
    pub executed_at: Option<u64>,
    /// Current transfer status
    pub status: TransferStatus,
    /// Addresses that have approved the transfer
    pub approvers: Vec<Address>,
    /// Whether this is an emergency transfer
    pub is_emergency: bool,
}

/// Transfer status
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TransferStatus {
    /// Transfer is pending approvals
    Pending,
    /// Transfer has been approved but not yet executed
    Approved,
    /// Transfer has been executed
    Executed,
    /// Transfer has been rejected
    Rejected,
    /// Transfer has been cancelled
    Cancelled,
    /// Transfer has failed
    Failed,
}

/// Treasury statistics
#[derive(Clone, Debug)]
pub struct TreasuryStats {
    /// Total balance in treasury
    pub total_balance: i128,
    /// Insurance fund balance
    pub insurance_fund_balance: i128,
    /// Operational fund balance
    pub operational_fund_balance: i128,
    /// Number of pending transfers
    pub pending_transfers: u64,
    /// Number of executed transfers
    pub executed_transfers: u64,
    /// Total amount transferred
    pub total_transferred: i128,
    /// Emergency fund balance
    pub emergency_fund_balance: i128,
}

/// Transfer parameters
#[derive(Clone, Debug)]
pub struct TransferParams {
    /// Recipient address
    pub to: Address,
    /// Transfer amount
    pub amount: i128,
    /// Reason for the transfer
    pub reason: Symbol,
    /// Number of approvals required (uses default if None)
    pub required_approvals: Option<u32>,
    /// Whether this is an emergency transfer
    pub is_emergency: bool,
}

/// Fund allocation parameters
#[derive(Clone, Debug)]
pub struct FundAllocation {
    /// Percentage allocated to insurance fund (0-100)
    pub insurance_percentage: u32,
    /// Percentage allocated to operational fund (0-100)
    pub operational_percentage: u32,
    /// Percentage allocated to emergency fund (0-100)
    pub emergency_percentage: u32,
}

impl Default for FundAllocation {
    fn default() -> Self {
        Self {
            insurance_percentage: 60,    // 60% to insurance
            operational_percentage: 30,  // 30% to operations
            emergency_percentage: 10,    // 10% to emergency
        }
    }
}

impl PendingTransfer {
    /// Create a new pending transfer
    pub fn new(
        transfer_id: Vec<u8>,
        params: TransferParams,
        required_approvals: u32,
        env: &Env,
    ) -> Self {
        Self {
            transfer_id,
            to: params.to,
            amount: params.amount,
            reason: params.reason,
            approvals: 0,
            required_approvals,
            created_at: env.ledger().timestamp(),
            executed_at: None,
            status: TransferStatus::Pending,
            approvers: Vec::new(env),
            is_emergency: params.is_emergency,
        }
    }

    /// Add an approval to the transfer
    pub fn add_approval(&mut self, approver: Address) {
        if !self.approvers.contains(&approver) {
            self.approvers.push_back(approver);
            self.approvals += 1;
        }
    }

    /// Check if the transfer has sufficient approvals
    pub fn has_sufficient_approvals(&self) -> bool {
        self.approvals >= self.required_approvals
    }

    /// Check if an address has already approved the transfer
    pub fn has_approved(&self, approver: &Address) -> bool {
        self.approvers.contains(approver)
    }

    /// Mark the transfer as approved
    pub fn mark_as_approved(&mut self, env: &Env) {
        self.status = TransferStatus::Approved;
    }

    /// Mark the transfer as executed
    pub fn mark_as_executed(&mut self, env: &Env) {
        self.status = TransferStatus::Executed;
        self.executed_at = Some(env.ledger().timestamp());
    }

    /// Mark the transfer as rejected
    pub fn mark_as_rejected(&mut self, env: &Env) {
        self.status = TransferStatus::Rejected;
    }

    /// Cancel the transfer
    pub fn cancel(&mut self, env: &Env) {
        self.status = TransferStatus::Cancelled;
    }

    /// Mark the transfer as failed
    pub fn mark_as_failed(&mut self, env: &Env) {
        self.status = TransferStatus::Failed;
    }

    /// Check if the transfer is still pending
    pub fn is_pending(&self) -> bool {
        matches!(self.status, TransferStatus::Pending)
    }

    /// Check if the transfer can be executed
    pub fn can_be_executed(&self) -> bool {
        matches!(self.status, TransferStatus::Approved) && self.has_sufficient_approvals()
    }

    /// Get the age of the transfer in seconds
    pub fn age(&self, env: &Env) -> u64 {
        env.ledger().timestamp() - self.created_at
    }

    /// Check if the transfer is an emergency transfer
    pub fn is_emergency_transfer(&self) -> bool {
        self.is_emergency
    }
}

impl TreasuryStats {
    /// Create new pool statistics
    pub fn new() -> Self {
        Self {
            total_balance: 0,
            insurance_fund_balance: 0,
            operational_fund_balance: 0,
            pending_transfers: 0,
            executed_transfers: 0,
            total_transferred: 0,
            emergency_fund_balance: 0,
        }
    }

    /// Add funds to total balance
    pub fn add_funds(&mut self, amount: i128) {
        self.total_balance += amount;
    }

    /// Remove funds from total balance
    pub fn remove_funds(&mut self, amount: i128) {
        self.total_balance = self.total_balance.saturating_sub(amount);
    }

    /// Transfer funds between accounts
    pub fn transfer_funds(&mut self, from_account: &str, to_account: &str, amount: i128) {
        // Simplified fund transfer tracking
        // In production, this would use proper accounting
        self.total_transferred += amount;
    }

    /// Increment pending transfers
    pub fn increment_pending_transfers(&mut self) {
        self.pending_transfers += 1;
    }

    /// Decrement pending transfers
    pub fn decrement_pending_transfers(&mut self) {
        if self.pending_transfers > 0 {
            self.pending_transfers -= 1;
        }
    }

    /// Increment executed transfers
    pub fn increment_executed_transfers(&mut self) {
        self.executed_transfers += 1;
    }

    /// Get percentage of funds in insurance fund
    pub fn insurance_fund_percentage(&self) -> u32 {
        if self.total_balance == 0 {
            return 0;
        }
        ((self.insurance_fund_balance * 100) / self.total_balance) as u32
    }

    /// Get percentage of funds in operational fund
    pub fn operational_fund_percentage(&self) -> u32 {
        if self.total_balance == 0 {
            return 0;
        }
        ((self.operational_fund_balance * 100) / self.total_balance) as u32
    }

    /// Get percentage of funds in emergency fund
    pub fn emergency_fund_percentage(&self) -> u32 {
        if self.total_balance == 0 {
            return 0;
        }
        ((self.emergency_fund_balance * 100) / self.total_balance) as u32
    }

    /// Rebalance funds according to allocation percentages
    pub fn rebalance_funds(&mut self, allocation: &FundAllocation) {
        // Calculate target amounts
        let target_insurance = (self.total_balance * allocation.insurance_percentage as i128) / 100;
        let target_operational = (self.total_balance * allocation.operational_percentage as i128) / 100;
        let target_emergency = (self.total_balance * allocation.emergency_percentage as i128) / 100;

        // Update balances (simplified - would need proper fund movement logic)
        self.insurance_fund_balance = target_insurance;
        self.operational_fund_balance = target_operational;
        self.emergency_fund_balance = target_emergency;
    }
}

impl Default for TreasuryStats {
    fn default() -> Self {
        Self::new()
    }
}