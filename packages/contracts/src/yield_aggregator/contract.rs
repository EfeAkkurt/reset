//! Yield aggregator contract for Blend protocol integration

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, Map, Symbol, Bytes, panic_with_error};

use crate::shared::{AccessControl, ContractError};
use crate::yield_aggregator::{
    types::{Deposit, DepositParams, WithdrawParams, YieldAllocation, PoolStats},
};

/// Yield aggregator contract for managing deposits and yield generation
#[contracttype]
pub struct YieldAggregator {
    /// Mapping from depositor address to their deposits
    deposits: Map<Address, Vec<Bytes>>,
    /// Mapping from deposit ID to Deposit data
    deposit_data: Map<Bytes, Deposit>,
    /// Pool statistics
    stats: PoolStats,
    /// Blend pool address
    blend_pool_address: Address,
    /// Default allocation percentages
    default_allocation: YieldAllocation,
    /// Total balance in the contract
    total_balance: i128,
    /// Address of the insurance contract
    insurance_contract: Address,
    /// Address of the treasury contract
    treasury_contract: Address,
    /// Authorized operators
    authorized_operators: Vec<Address>,
    /// Yield claim cooldown period in seconds
    yield_claim_cooldown: u64,
}

#[contractimpl]
impl YieldAggregator {
    /// Initialize the yield aggregator contract
    ///
    /// # Arguments
    /// * `admin` - Administrator address
    /// * `blend_pool` - Address of the Blend pool
    /// * `insurance_contract` - Address of the insurance contract
    /// * `treasury_contract` - Address of the treasury contract
    /// * `default_insurance_percentage` - Default percentage allocated to insurance fund (0-100)
    pub fn __constructor(
        env: Env,
        admin: Address,
        blend_pool: Address,
        insurance_contract: Address,
        treasury_contract: Address,
        default_insurance_percentage: u32,
    ) {
        let contract = Self {
            deposits: Map::new(env),
            deposit_data: Map::new(env),
            stats: PoolStats::new(),
            blend_pool_address: blend_pool,
            default_allocation: YieldAllocation {
                insurance_percentage: default_insurance_percentage,
                yield_percentage: 100 - default_insurance_percentage,
            },
            total_balance: 0,
            insurance_contract: insurance_contract,
            treasury_contract: treasury_contract,
            authorized_operators: Vec::from_array(env, [admin]),
            yield_claim_cooldown: 86400, // 24 hours cooldown
        };

        contract.initialize(env);
    }

    /// Create a new deposit
    ///
    /// # Arguments
    /// * `deposit_id` - Unique identifier for the deposit
    /// * `params` - Deposit parameters
    pub fn deposit(env: Env, deposit_id: Bytes, params: DepositParams) {
        // Validate parameters
        Self::validate_deposit_params(&env, &params);

        // Check if deposit already exists
        if env.storage().instance().has(&Symbol::new(&env, "deposit_data"), &deposit_id) {
            panic_with_error!(&env, ContractError::InvalidInput);
        }

        // Create and store the deposit
        let deposit = Deposit::new(params.clone(), Self::get_default_allocation(&env), &env);

        // Add to user's deposit list
        let mut user_deposits = env.storage().instance()
            .get(&Symbol::new(&env, "deposits"), &params.depositor)
            .unwrap_or_else(|| Vec::new(&env));

        user_deposits.push_back(deposit_id.clone());
        env.storage().instance().set(&Symbol::new(&env, "deposits"), &params.depositor, &user_deposits);

        // Store deposit data
        env.storage().instance().set(&Symbol::new(&env, "deposit_data"), &deposit_id, &deposit);

        // Update statistics
        let mut stats = Self::get_stats(&env);
        stats.add_deposit(&deposit);
        Self::set_stats(&env, stats);

        // Update total balance
        let current_balance = Self::get_total_balance(&env);
        let new_balance = current_balance + params.amount;
        Self::set_total_balance(&env, new_balance);

        // If allocating to insurance fund, transfer to insurance contract
        if params.allocate_to_insurance && deposit.insurance_allocation > 0 {
            Self::transfer_to_insurance_fund(&env, deposit.insurance_allocation, deposit.depositor);
        }

        // Emit event
        env.events().publish((
            Symbol::new(&env, "deposit_created"),
            deposit_id,
            params.depositor,
            params.amount,
            deposit.insurance_allocation,
            deposit.yield_allocation,
        ));
    }

    /// Withdraw from a deposit
    ///
    /// # Arguments
    /// * `deposit_id` - ID of the deposit to withdraw from
    /// * `params` - Withdrawal parameters
    pub fn withdraw(env: Env, deposit_id: Bytes, params: WithdrawParams) {
        // Get the deposit
        let mut deposit = Self::get_deposit(&env, &deposit_id);

        // Validate withdrawal
        Self::validate_withdrawal_params(&env, &deposit, &params);

        // Mark as withdrawing
        deposit.status = crate::yield_aggregator::types::DepositStatus::Withdrawing;

        // Perform withdrawal
        let withdrawn_amount = deposit.withdraw(
            params.amount,
            params.from_insurance,
            params.from_yield,
        );

        // Update statistics
        let mut stats = Self::get_stats(&env);
        stats.remove_deposit(&deposit);
        Self::set_stats(&env, stats);

        // Update total balance
        let current_balance = Self::get_total_balance(&env);
        let new_balance = current_balance - withdrawn_amount;
        Self::set_total_balance(&env, new_balance);

        // Update deposit status
        deposit.status = crate::yield_aggregator::types::DepositStatus::Active;

        // Store updated deposit
        env.storage().instance().set(&Symbol::new(&env, "deposit_data"), &deposit_id, &deposit);

        // Emit event
        env.events().publish((
            Symbol::new(&env, "withdrawal_completed"),
            deposit_id,
            params.depositor,
            withdrawn_amount,
        ));
    }

    /// Claim yield from deposits
    ///
    /// # Arguments
    /// * `depositor` - Address of the depositor
    /// * `deposit_ids` - List of deposit IDs to claim yield from (empty = all deposits)
    pub fn claim_yield(env: Env, depositor: Address, deposit_ids: Option<Vec<Bytes>>) {
        let current_time = env.ledger().timestamp();

        // Get all deposits for the user if no specific deposits provided
        let user_deposit_ids = deposit_ids.unwrap_or_else(|| {
            env.storage().instance()
                .get(&Symbol::new(&env, "deposits"), &depositor)
                .unwrap_or_else(|| Vec::new(&env))
        });

        let mut total_yield_claimed = 0;

        for deposit_id in user_deposit_ids.iter() {
            let mut deposit = Self::get_deposit(&env, deposit_id);

            // Check if deposit belongs to the user
            if deposit.depositor != depositor {
                continue;
            }

            // Check if deposit is active
            if !deposit.is_active() {
                continue;
            }

            // Check cooldown period
            if current_time - deposit.last_yield_claim < Self::get_yield_claim_cooldown(&env) {
                continue;
            }

            // Simulate yield generation (simplified)
            // In production, this would interact with Blend protocol
            let simulated_yield = Self::simulate_yield_generation(&env, &deposit);

            if simulated_yield > 0 {
                deposit.add_yield(simulated_yield, &env);
                total_yield_claimed += simulated_yield;

                // Update statistics
                let mut stats = Self::get_stats(&env);
                stats.add_yield_earned(simulated_yield);
                stats.calculate_current_apy();
                Self::set_stats(&env, stats);

                // Update total balance
                let current_balance = Self::get_total_balance(&env);
                let new_balance = current_balance + simulated_yield;
                Self::set_total_balance(&env, new_balance);

                // Store updated deposit
                env.storage().instance().set(&Symbol::new(&env, "deposit_data"), deposit_id, &deposit);
            }
        }

        // Emit event
        if total_yield_claimed > 0 {
            env.events().publish((
                Symbol::new(&env, "yield_claimed"),
                depositor,
                total_yield_claimed,
            ));
        }
    }

    /// Get deposit information
    pub fn get_deposit(env: Env, deposit_id: Bytes) -> Deposit {
        env.storage().instance()
            .get(&Symbol::new(&env, "deposit_data"), &deposit_id)
            .unwrap_or_else(|| panic!("Deposit not found"))
    }

    /// Get all deposits for a user
    pub fn get_user_deposits(env: Env, depositor: Address) -> Vec<Bytes> {
        env.storage().instance()
            .get(&Symbol::new(&env, "deposits"), &depositor)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Get pool statistics
    pub fn get_stats(env: Env) -> PoolStats {
        env.storage().instance()
            .get(&Symbol::new(&env, "stats"))
            .unwrap_or_else(|| PoolStats::new())
    }

    /// Get total balance in the contract
    pub fn get_total_balance(env: Env) -> i128 {
        env.storage().instance()
            .get(&Symbol::new(&env, "total_balance"))
            .unwrap_or(0)
    }

    /// Get default allocation percentages
    pub fn get_default_allocation(env: Env) -> YieldAllocation {
        env.storage().instance()
            .get(&Symbol::new(&env, "default_allocation"))
            .unwrap_or_else(|| YieldAllocation::default())
    }

    /// Update default allocation (admin only)
    pub fn update_default_allocation(env: Env, admin: Address, allocation: YieldAllocation) {
        Self::require_operator(&env, admin);

        // Validate allocation percentages
        if allocation.insurance_percentage + allocation.yield_percentage != 100 {
            panic!("Allocation percentages must sum to 100");
        }

        env.storage().instance().set(&Symbol::new(&env, "default_allocation"), &allocation);
    }

    /// Get yield claim cooldown period
    pub fn get_yield_claim_cooldown(env: Env) -> u64 {
        env.storage().instance()
            .get(&Symbol::new(&env, "yield_claim_cooldown"))
            .unwrap_or(86400)
    }

    /// Update yield claim cooldown period (admin only)
    pub fn update_yield_claim_cooldown(env: Env, admin: Address, cooldown_seconds: u64) {
        Self::require_operator(&env, admin);
        env.storage().instance().set(&Symbol::new(&env, "yield_claim_cooldown"), &cooldown_seconds);
    }

    /// Get authorized operators
    pub fn get_authorized_operators(env: Env) -> Vec<Address> {
        env.storage().instance()
            .get(&Symbol::new(&env, "authorized_operators"))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Add authorized operator (admin only)
    pub fn add_authorized_operator(env: Env, admin: Address, operator: Address) {
        Self::require_operator(&env, admin);

        let mut operators = Self::get_authorized_operators(&env);
        if !operators.contains(&operator) {
            operators.push_back(operator);
        }

        env.storage().instance().set(&Symbol::new(&env, "authorized_operators"), &operators);
    }

    /// Remove authorized operator (admin only)
    pub fn remove_authorized_operator(env: Env, admin: Address, operator: Address) {
        Self::require_operator(&env, admin);

        let mut operators = Self::get_authorized_operators(&env);
        let mut i = 0;
        while i < operators.len() {
            if operators.get(i).unwrap() == &operator {
                operators.remove(i);
            } else {
                i += 1;
            }
        }

        env.storage().instance().set(&Symbol::new(&env, "authorized_operators"), &operators);
    }

    // Private helper methods

    fn initialize(env: Env) {
        // Set initial empty data
        env.storage().instance().set(&Symbol::new(&env, "deposits"), &Map::new(&env));
        env.storage().instance().set(&Symbol::new(&env, "deposit_data"), &Map::new(&env));
        env.storage().instance().set(&Symbol::new(&env, "default_allocation"), &YieldAllocation::default());
        env.storage().instance().set(&Symbol::new(&env, "stats"), &PoolStats::new());
    }

    fn require_operator(env: &Env, caller: Address) {
        let operators = Self::get_authorized_operators(env);
        if !operators.contains(&caller) {
            panic_with_error!(env, ContractError::Unauthorized);
        }
    }

    fn validate_deposit_params(env: &Env, params: &DepositParams) {
        if params.amount <= 0 {
            panic!("Deposit amount must be positive");
        }

        if params.pool_id.is_empty() {
            panic!("Pool ID cannot be empty");
        }

        // Validate custom allocation if provided
        if let Some(allocation) = &params.custom_allocation {
            if allocation.insurance_percentage + allocation.yield_percentage != 100 {
                panic!("Allocation percentages must sum to 100");
            }
        }
    }

    fn validate_withdrawal_params(env: &Env, deposit: &Deposit, params: &WithdrawParams) {
        if params.depositor != deposit.depositor {
            panic!("Invalid depositor");
        }

        if params.amount <= 0 {
            panic!("Withdrawal amount must be positive");
        }

        if params.amount > deposit.total_value() {
            panic!("Insufficient balance");
        }

        if !params.from_insurance && !params.from_yield {
            panic!("Must specify withdrawal source (insurance or yield)");
        }
    }

    fn transfer_to_insurance_fund(env: &Env, amount: i128, from: Address) {
        // In production, this would make a contract call to transfer funds
        // For now, we'll emit an event
        env.events().publish((
            Symbol::new(&env, "insurance_fund_transfer"),
            amount,
            from,
        ));
    }

    fn simulate_yield_generation(env: &Env, deposit: &Deposit) -> i128 {
        // Simplified yield simulation
        // In production, this would interact with Blend protocol

        let time_elapsed = env.ledger().timestamp() - deposit.last_yield_claim;
        let seconds_in_day = 86400;
        let days_elapsed = time_elapsed / seconds_in_day;

        if days_elapsed == 0 {
            return 0;
        }

        // Assume 5% annual yield on yield allocation
        let daily_yield_rate = 5; // 5% APY, so ~0.0137% daily
        let daily_yield = (deposit.yield_allocation * daily_yield_rate) / (100 * 365);

        daily_yield * days_elapsed.min(30) as i128 // Cap at 30 days for safety
    }

    fn set_stats(env: &Env, stats: PoolStats) {
        env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);
    }

    fn set_total_balance(env: &Env, balance: i128) {
        env.storage().instance().set(&Symbol::new(&env, "total_balance"), &balance);
    }
}