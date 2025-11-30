//! Simplified treasury contract for demonstration

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Bytes, Map, Symbol, Vec, panic_with_error};

use crate::shared::{ContractError};

/// Pending transfer data structure
#[derive(Clone)]
#[contracttype]
pub struct PendingTransfer {
    pub to: Address,
    pub amount: i128,
    pub reason: Symbol,
    pub approvals: u32,
    pub required_approvals: u32,
    pub created_at: u64,
    pub approvers: Vec<Address>,
    pub is_emergency: bool,
}

/// Fund allocation structure
#[derive(Clone)]
#[contracttype]
pub struct FundAllocation {
    pub insurance_percentage: u32,
    pub operational_percentage: u32,
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

/// Treasury contract storage structure
#[contracttype]
pub struct Treasury {
    pending_transfers: Map<Bytes, PendingTransfer>,
    authorized_admins: Vec<Address>,
    owner: Address,
    fund_allocation: FundAllocation,
    emergency_shutdown: bool,
    max_transfer_amount: i128,
    total_balance: i128,
}

#[contractimpl]
impl Treasury {
    /// Initialize the treasury contract
    pub fn __constructor(env: Env, owner: Address, initial_admins: Vec<Address>) {
        let contract = Self {
            pending_transfers: Map::new(&env),
            authorized_admins: initial_admins.clone(),
            owner,
            fund_allocation: FundAllocation::default(),
            emergency_shutdown: false,
            max_transfer_amount: 10000, // $100 max without special approval
            total_balance: 0,
        };

        env.storage().instance().set(&Symbol::new(&env, "TREASURY"), &contract);
    }

    /// Submit a transfer for approval
    pub fn submit_transfer(env: Env, transfer_id: Bytes, to: Address, amount: i128, reason: Symbol, required_approvals: u32, is_emergency: bool) {
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "TREASURY"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        let caller = env.current_contract_address();

        // Check if caller is authorized admin
        if !contract.authorized_admins.contains(&caller) {
            panic_with_error!(&env, ContractError::Unauthorized);
        }

        // Check if emergency shutdown is active
        if contract.emergency_shutdown && !is_emergency {
            panic_with_error!(&env, ContractError::InvalidState);
        }

        // Check if transfer ID already exists
        if contract.pending_transfers.contains_key(transfer_id.clone()) {
            panic_with_error!(&env, ContractError::InvalidInput);
        }

        if amount <= 0 {
            panic_with_error!(&env, ContractError::InvalidInput);
        }

        // For non-emergency transfers, check max amount
        if !is_emergency && amount > contract.max_transfer_amount {
            panic_with_error!(&env, ContractError::InvalidInput);
        }

        // Create pending transfer
        let transfer = PendingTransfer {
            to: to.clone(),
            amount,
            reason,
            approvals: 0,
            required_approvals,
            created_at: env.ledger().timestamp(),
            approvers: Vec::new(&env),
            is_emergency,
        };

        // Store the transfer
        contract.pending_transfers.set(transfer_id.clone(), transfer);

        // Save contract state
        env.storage().instance().set(&Symbol::new(&env, "TREASURY"), &contract);

        // Emit event (simplified)
        env.events().publish((Symbol::new(&env, "transfer_submitted"), transfer_id, to, amount), ());
    }

    /// Approve a pending transfer
    pub fn approve_transfer(env: Env, transfer_id: Bytes) {
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "TREASURY"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        let caller = env.current_contract_address();

        // Check if caller is authorized admin
        if !contract.authorized_admins.contains(&caller) {
            panic_with_error!(&env, ContractError::Unauthorized);
        }

        // Get the pending transfer
        let mut transfer = contract.pending_transfers.get(transfer_id.clone())
            .unwrap_or_else(|| panic!("Transfer not found"));

        // Check if admin has already approved
        if transfer.approvers.contains(&caller) {
            panic_with_error!(&env, ContractError::TransferAlreadyAuthorized);
        }

        // Add approval
        transfer.approvers.push_back(caller);
        transfer.approvals += 1;

        // Update transfer
        contract.pending_transfers.set(transfer_id.clone(), transfer);

        // Auto-execute if sufficient approvals
        let transfer = contract.pending_transfers.get(transfer_id.clone()).unwrap();
        if transfer.approvals >= transfer.required_approvals {
            Self::execute_transfer_internal(env, transfer_id.clone(), &mut contract);
        } else {
            // Save contract state if not executed
            env.storage().instance().set(&Symbol::new(&env, "TREASURY"), &contract);
        }
    }

    /// Execute an approved transfer (internal function)
    fn execute_transfer_internal(env: Env, transfer_id: Bytes, contract: &mut Treasury) {
        let transfer = contract.pending_transfers.get(transfer_id.clone())
            .unwrap_or_else(|| panic!("Transfer not found"));

        if transfer.approvals < transfer.required_approvals {
            panic_with_error!(&env, ContractError::TransferNotAuthorized);
        }

        // Check if treasury has sufficient balance
        if contract.total_balance < transfer.amount {
            panic_with_error!(&env, ContractError::InsufficientBalance);
        }

        // Execute the transfer (simplified - just update balance)
        contract.total_balance -= transfer.amount;

        // Remove from pending transfers
        contract.pending_transfers.remove(transfer_id);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "transfer_executed"),
            transfer_id,
            transfer.to,
            transfer.amount,
        ), ());
    }

    /// Add funds to the treasury
    pub fn add_funds(env: Env, from: Address, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "TREASURY"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.total_balance += amount;

        env.storage().instance().set(&Symbol::new(&env, "TREASURY"), &contract);

        // Emit event
        env.events().publish((Symbol::new(&env, "funds_added"), from, amount, contract.total_balance), ());
    }

    /// Get pending transfer information
    pub fn get_pending_transfer(env: Env, transfer_id: Bytes) -> PendingTransfer {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "TREASURY"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.pending_transfers.get(transfer_id)
            .unwrap_or_else(|| panic!("Transfer not found"))
    }

    /// Get all pending transfers
    pub fn get_all_pending_transfers(env: Env) -> Vec<Bytes> {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "TREASURY"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        let mut transfer_ids = Vec::new(&env);

        // This is a simplified approach - in production, use more efficient iteration
        for (transfer_id, _) in contract.pending_transfers.iter() {
            transfer_ids.push_back(transfer_id);
        }

        transfer_ids
    }

    /// Get total balance
    pub fn get_total_balance(env: Env) -> i128 {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "TREASURY"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.total_balance
    }

    /// Get authorized administrators
    pub fn get_authorized_admins(env: Env) -> Vec<Address> {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "TREASURY"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.authorized_admins.clone()
    }

    /// Enable emergency shutdown (owner only)
    pub fn emergency_shutdown(env: Env) {
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "TREASURY"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        let caller = env.current_contract_address();

        if caller != contract.owner {
            panic_with_error!(&env, ContractError::Unauthorized);
        }

        contract.emergency_shutdown = true;

        env.storage().instance().set(&Symbol::new(&env, "TREASURY"), &contract);

        env.events().publish((Symbol::new(&env, "emergency_shutdown"), caller), ());
    }

    /// Disable emergency shutdown (owner only)
    pub fn disable_emergency_shutdown(env: Env) {
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "TREASURY"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        let caller = env.current_contract_address();

        if caller != contract.owner {
            panic_with_error!(&env, ContractError::Unauthorized);
        }

        contract.emergency_shutdown = false;

        env.storage().instance().set(&Symbol::new(&env, "TREASURY"), &contract);

        env.events().publish((Symbol::new(&env, "emergency_shutdown_disabled"), caller), ());
    }
}