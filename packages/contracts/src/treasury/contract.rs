//! Treasury contract for multi-signature fund management

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, Map, Symbol, Bytes, panic_with_error};

use crate::shared::{AccessControl, ContractError};
use crate::treasury::{
    types::{PendingTransfer, TransferStatus, TreasuryStats, TransferParams, FundAllocation},
};

/// Treasury contract for multi-signature fund management
#[contracttype]
pub struct Treasury {
    /// Mapping from transfer ID to PendingTransfer
    pending_transfers: Map<Bytes, PendingTransfer>,
    /// Treasury statistics
    stats: TreasuryStats,
    /// Treasury owner address
    owner: Address,
    /// Authorized administrators
    authorized_admins: Vec<Address>,
    /// Fund allocation percentages
    fund_allocation: FundAllocation,
    /// Emergency shutdown status
    emergency_shutdown: bool,
    /// Maximum transfer amount without special approval
    max_transfer_amount: i128,
    /// Emergency transfer cooldown period
    emergency_cooldown: u64,
}

#[contractimpl]
impl Treasury {
    /// Initialize the treasury contract
    ///
    /// # Arguments
    /// * `owner` - Treasury owner address
    /// * `initial_admins` - Initial list of authorized administrators
    pub fn __constructor(env: Env, owner: Address, initial_admins: Vec<Address>) {
        let contract = Self {
            pending_transfers: Map::new(env),
            stats: TreasuryStats::new(),
            owner,
            authorized_admins: initial_admins.clone(),
            fund_allocation: FundAllocation::default(),
            emergency_shutdown: false,
            max_transfer_amount: 10000, // $100 max without special approval
            emergency_cooldown: 3600, // 1 hour cooldown
        };

        contract.initialize(env);
    }

    /// Submit a transfer for approval
    ///
    /// # Arguments
    /// * `admin` - Administrator submitting the transfer
    /// * `transfer_id` - Unique identifier for the transfer
    /// * `params` - Transfer parameters
    pub fn submit_transfer(env: Env, admin: Address, transfer_id: Bytes, params: TransferParams) {
        Self::require_admin(&env, admin);

        // Check if emergency shutdown is active
        if Self::is_emergency_shutdown(&env) && !params.is_emergency {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        // Check if transfer ID already exists
        if env.storage().instance().has(&Symbol::new(&env, "pending_transfers"), &transfer_id) {
            panic_with_error!(&env, ContractError::InvalidInput);
        }

        // Validate transfer parameters
        Self::validate_transfer_params(&env, &params);

        // Determine required approvals
        let required_approvals = params.required_approvals
            .unwrap_or_else(|| Self::get_default_required_approvals(&env, &params));

        // For emergency transfers, reduce approval requirements
        let emergency_adjusted_approvals = if params.is_emergency {
            (required_approvals + 1) / 2 // Halve approvals for emergencies
        } else {
            required_approvals
        };

        // Create pending transfer
        let mut transfer = PendingTransfer::new(
            transfer_id.clone(),
            params.clone(),
            emergency_adjusted_approvals,
            &env,
        );

        // Auto-approve if the admin is the owner and amount is small enough
        if admin == Self::get_owner(&env) && params.amount <= Self::get_max_transfer_amount(&env) {
            transfer.add_approval(admin);
            transfer.mark_as_approved(&env);
        }

        // Store the transfer
        env.storage().instance().set(&Symbol::new(&env, "pending_transfers"), &transfer_id, &transfer);

        // Update statistics
        let mut stats = Self::get_stats(&env);
        stats.increment_pending_transfers();
        Self::set_stats(&env, stats);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "transfer_submitted"),
            transfer_id,
            params.to,
            params.amount,
            params.reason,
            transfer.required_approvals,
            params.is_emergency,
        ));

        // Auto-execute if already approved
        if transfer.can_be_executed() {
            Self::execute_transfer(env, transfer_id, admin);
        }
    }

    /// Approve a pending transfer
    ///
    /// # Arguments
    /// * `admin` - Administrator approving the transfer
    /// * `transfer_id` - ID of the transfer to approve
    /// * `reason` - Reason for approval
    pub fn approve_transfer(env: Env, admin: Address, transfer_id: Bytes, reason: Symbol) {
        Self::require_admin(&env, admin);

        // Get the pending transfer
        let mut transfer = Self::get_pending_transfer(&env, &transfer_id);

        // Check if transfer can still be approved
        if !transfer.is_pending() {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        // Check if admin has already approved
        if transfer.has_approved(&admin) {
            panic_with_error!(&env, ContractError::TransferAlreadyAuthorized);
        }

        // Add approval
        transfer.add_approval(admin);

        // Update stored transfer
        env.storage().instance().set(&Symbol::new(&env, "pending_transfers"), &transfer_id, &transfer);

        // Update statistics
        let mut stats = Self::get_stats(&env);
        if transfer.has_sufficient_approvals() {
            stats.decrement_pending_transfers();
        }
        Self::set_stats(&env, stats);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "transfer_approved"),
            transfer_id,
            admin,
            reason,
            transfer.approvals,
            transfer.required_approvals,
        ));

        // Auto-execute if sufficient approvals
        if transfer.can_be_executed() {
            Self::execute_transfer(env, transfer_id, admin);
        }
    }

    /// Execute an approved transfer
    ///
    /// # Arguments
    /// * `admin` - Administrator executing the transfer
    /// * `transfer_id` - ID of the transfer to execute
    pub fn execute_transfer(env: Env, admin: Address, transfer_id: Bytes) {
        Self::require_admin(&env, admin);

        // Get the pending transfer
        let mut transfer = Self::get_pending_transfer(&env, &transfer_id);

        // Check if transfer can be executed
        if !transfer.can_be_executed() {
            panic_with_error!(&env, ContractError::TransferNotAuthorized);
        }

        // Check if emergency cooldown applies (for non-emergency transfers)
        if !transfer.is_emergency_transfer() {
            let cooldown = Self::get_emergency_cooldown(&env);
            if transfer.age(&env) < cooldown {
                panic!("Transfer is within cooldown period");
            }
        }

        // Check if treasury has sufficient balance
        let treasury_balance = Self::get_treasury_balance(&env);
        if treasury_balance < transfer.amount {
            panic_with_error!(&env, ContractError::InsufficientBalance);
        }

        // Execute the transfer
        // In production, this would involve actual fund transfer logic
        transfer.mark_as_executed(&env);

        // Update statistics
        let mut stats = Self::get_stats(&env);
        stats.decrement_pending_transfers();
        stats.increment_executed_transfers();
        stats.transfer_funds("treasury", "external", transfer.amount);
        Self::set_stats(&env, stats);

        // Remove from pending transfers
        env.storage().instance().remove(&Symbol::new(&env, "pending_transfers"), &transfer_id);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "transfer_executed"),
            transfer_id,
            transfer.to,
            transfer.amount,
            admin,
        ));
    }

    /// Reject a pending transfer
    ///
    /// # Arguments
    /// * `admin` - Administrator rejecting the transfer
    /// * `transfer_id` - ID of the transfer to reject
    /// * `reason` - Reason for rejection
    pub fn reject_transfer(env: Env, admin: Address, transfer_id: Bytes, reason: Symbol) {
        Self::require_admin(&env, admin);

        // Get the pending transfer
        let mut transfer = Self::get_pending_transfer(&env, &transfer_id);

        // Check if transfer can still be rejected
        if !transfer.is_pending() {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        // Mark as rejected
        transfer.mark_as_rejected(&env);

        // Update statistics
        let mut stats = Self::get_stats(&env);
        stats.decrement_pending_transfers();
        Self::set_stats(&env, stats);

        // Remove from pending transfers
        env.storage().instance().remove(&Symbol::new(&env, "pending_transfers"), &transfer_id);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "transfer_rejected"),
            transfer_id,
            admin,
            reason,
        ));
    }

    /// Cancel a pending transfer
    ///
    /// # Arguments
    /// * `admin` - Administrator cancelling the transfer
    /// * `transfer_id` - ID of the transfer to cancel
    /// * `reason` - Reason for cancellation
    pub fn cancel_transfer(env: Env, admin: Address, transfer_id: Bytes, reason: Symbol) {
        Self::require_admin(&env, admin);

        // Get the pending transfer
        let mut transfer = Self::get_pending_transfer(&env, &transfer_id);

        // Check if transfer can still be cancelled
        if !transfer.is_pending() {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        // Only the submitter or owner can cancel transfers
        let transfer_submitter = Self::get_transfer_submitter(&env, &transfer_id);
        if admin != transfer_submitter && admin != Self::get_owner(&env) {
            panic_with_error!(&env, ContractError::Unauthorized);
        }

        // Mark as cancelled
        transfer.cancel(&env);

        // Update statistics
        let mut stats = Self::get_stats(&env);
        stats.decrement_pending_transfers();
        Self::set_stats(&env, stats);

        // Remove from pending transfers
        env.storage().instance().remove(&Symbol::new(&env, "pending_transfers"), &transfer_id);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "transfer_cancelled"),
            transfer_id,
            admin,
            reason,
        ));
    }

    /// Add funds to the treasury
    ///
    /// # Arguments
    /// * `from` - Address sending funds
    /// * `amount` - Amount to add
    /// * `reason` - Reason for the deposit
    pub fn add_funds(env: Env, from: Address, amount: i128, reason: Symbol) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Update statistics
        let mut stats = Self::get_stats(&env);
        stats.add_funds(amount);
        Self::set_stats(&env, stats);

        // Rebalance funds according to allocation
        stats.rebalance_funds(&Self::get_fund_allocation(&env));
        Self::set_stats(&env, stats);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "funds_added"),
            from,
            amount,
            reason,
            stats.total_balance,
        ));
    }

    /// Enable emergency shutdown (owner only)
    ///
    /// # Arguments
    /// * `owner` - Treasury owner address
    /// * `reason` - Reason for emergency shutdown
    pub fn emergency_shutdown(env: Env, owner: Address, reason: Symbol) {
        Self::require_owner(&env, owner);

        env.storage().instance().set(&Symbol::new(&env, "emergency_shutdown"), &true);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "emergency_shutdown"),
            owner,
            reason,
        ));
    }

    /// Disable emergency shutdown (owner only)
    ///
    /// # Arguments
    /// * `owner` - Treasury owner address
    /// * `reason` - Reason for disabling shutdown
    pub fn disable_emergency_shutdown(env: Env, owner: Address, reason: Symbol) {
        Self::require_owner(&env, owner);

        env.storage().instance().set(&Symbol::new(&env, "emergency_shutdown"), &false);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "emergency_shutdown_disabled"),
            owner,
            reason,
        ));
    }

    /// Update fund allocation percentages (owner only)
    ///
    /// # Arguments
    /// * `owner` - Treasury owner address
    /// * `allocation` - New fund allocation
    pub fn update_fund_allocation(env: Env, owner: Address, allocation: FundAllocation) {
        Self::require_owner(&env, owner);

        // Validate allocation percentages
        if allocation.insurance_percentage + allocation.operational_percentage + allocation.emergency_percentage != 100 {
            panic!("Allocation percentages must sum to 100");
        }

        env.storage().instance().set(&Symbol::new(&env, "fund_allocation"), &allocation);

        // Rebalance funds according to new allocation
        let mut stats = Self::get_stats(&env);
        stats.rebalance_funds(&allocation);
        Self::set_stats(&env, stats);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "fund_allocation_updated"),
            allocation.insurance_percentage,
            allocation.operational_percentage,
            allocation.emergency_percentage,
        ));
    }

    /// Get pending transfer information
    pub fn get_pending_transfer(env: Env, transfer_id: Bytes) -> PendingTransfer {
        env.storage().instance()
            .get(&Symbol::new(&env, "pending_transfers"), &transfer_id)
            .unwrap_or_else(|| panic!("Transfer not found"))
    }

    /// Get all pending transfers
    pub fn get_all_pending_transfers(env: Env) -> Vec<Bytes> {
        let mut transfer_ids = Vec::new(&env);

        // This is simplified - in production, use more efficient iteration
        env.storage().instance()
            .has(&Symbol::new(&env, "pending_transfers"))
    }

    /// Get treasury statistics
    pub fn get_stats(env: Env) -> TreasuryStats {
        env.storage().instance()
            .get(&Symbol::new(&env, "stats"))
            .unwrap_or_else(|| TreasuryStats::new())
    }

    /// Get treasury owner
    pub fn get_owner(env: Env) -> Address {
        env.storage().instance()
            .get(&Symbol::new(&env, "owner"))
            .unwrap_or_else(|| panic!("Owner not set"))
    }

    /// Get authorized administrators
    pub fn get_authorized_admins(env: Env) -> Vec<Address> {
        env.storage().instance()
            .get(&Symbol::new(&env, "authorized_admins"))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Get fund allocation percentages
    pub fn get_fund_allocation(env: Env) -> FundAllocation {
        env.storage().instance()
            .get(&Symbol::new(&env, "fund_allocation"))
            .unwrap_or_else(|| FundAllocation::default())
    }

    /// Get maximum transfer amount
    pub fn get_max_transfer_amount(env: Env) -> i128 {
        env.storage().instance()
            .get(&Symbol::new(&env, "max_transfer_amount"))
            .unwrap_or(10000)
    }

    /// Get emergency cooldown period
    pub fn get_emergency_cooldown(env: Env) -> u64 {
        env.storage().instance()
            .get(&Symbol::new(&env, "emergency_cooldown"))
            .unwrap_or(3600)
    }

    /// Check if emergency shutdown is active
    pub fn is_emergency_shutdown(env: Env) -> bool {
        env.storage().instance()
            .has(&Symbol::new(&env, "emergency_shutdown"))
            && env.storage().instance().get(&Symbol::new(&env, "emergency_shutdown")).unwrap()
    }

    /// Update maximum transfer amount (owner only)
    pub fn update_max_transfer_amount(env: Env, owner: Address, amount: i128) {
        Self::require_owner(&env, owner);
        env.storage().instance().set(&Symbol::new(&env, "max_transfer_amount"), &amount);
    }

    /// Update emergency cooldown period (owner only)
    pub fn update_emergency_cooldown(env: Env, owner: Address, cooldown_seconds: u64) {
        Self::require_owner(&env, owner);
        env.storage().instance().set(&Symbol::new(&env, "emergency_cooldown"), &cooldown_seconds);
    }

    // Private helper methods

    fn initialize(env: Env) {
        // Set initial empty data
        env.storage().instance().set(&Symbol::new(&env, "pending_transfers"), &Map::new(&env));
        env.storage().instance().set(&Symbol::new(&env, "fund_allocation"), &FundAllocation::default());
        env.storage().instance().set(&Symbol::new(&env, "max_transfer_amount"), &10000);
        env.storage().instance().set(&Symbol::new(&env, "emergency_cooldown"), &3600);
    }

    fn require_owner(env: &Env, caller: Address) {
        let owner = Self::get_owner(env);
        if caller != owner {
            panic_with_error!(env, ContractError::Unauthorized);
        }
    }

    fn require_admin(env: &Env, caller: Address) {
        let admins = Self::get_authorized_admins(env);
        if !admins.contains(&caller) {
            panic_with_error!(env, ContractError::Unauthorized);
        }
    }

    fn validate_transfer_params(env: &Env, params: &TransferParams) {
        if params.amount <= 0 {
            panic!("Transfer amount must be positive");
        }

        if params.amount > Self::get_max_transfer_amount(env) && !params.is_emergency {
            panic!("Transfer amount exceeds maximum limit for non-emergency transfers");
        }

        // Validate that recipient address is not zero
        if params.to == Address::zero(env) {
            panic!("Invalid recipient address");
        }
    }

    fn get_default_required_approvals(env: &Env, params: &TransferParams) -> u32 {
        let admins = Self::get_authorized_admins(env);

        // Emergency transfers need fewer approvals
        if params.is_emergency {
            (admins.len() + 1) / 2
        } else {
            admins.len() // All admins must approve for regular transfers
        }
    }

    fn get_treasury_balance(env: Env) -> i128 {
        let stats = Self::get_stats(env);
        stats.total_balance
    }

    fn set_stats(env: &Env, stats: TreasuryStats) {
        env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);
    }

    fn get_transfer_submitter(env: &Env, transfer: &PendingTransfer) -> Address {
        // Simplified - in production, track who submitted each transfer
        Self::get_owner(env)
    }
}