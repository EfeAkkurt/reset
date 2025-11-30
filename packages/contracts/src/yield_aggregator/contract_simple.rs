//! Simplified yield aggregator contract for demonstration

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Bytes, Map, Symbol, Vec, panic_with_error};

use crate::shared::{ContractError};

/// Deposit data structure
#[derive(Clone)]
#[contracttype]
pub struct Deposit {
    pub depositor: Address,
    pub amount: i128,
    pub insurance_allocation: i128,
    pub yield_allocation: i128,
    pub deposit_time: u64,
    pub last_yield_claim: u64,
    pub active: bool,
}

/// Yield allocation structure
#[derive(Clone)]
#[contracttype]
pub struct YieldAllocation {
    pub insurance_percentage: u32,
    pub yield_percentage: u32,
}

impl Default for YieldAllocation {
    fn default() -> Self {
        Self {
            insurance_percentage: 10, // 10% to insurance
            yield_percentage: 90,     // 90% to yield
        }
    }
}

/// Yield aggregator contract storage structure
#[contracttype]
pub struct YieldAggregator {
    deposits: Map<Address, Vec<Bytes>>,
    deposit_data: Map<Bytes, Deposit>,
    total_balance: i128,
    authorized_operators: Vec<Address>,
    default_allocation: YieldAllocation,
}

#[contractimpl]
impl YieldAggregator {
    /// Initialize the yield aggregator contract
    pub fn __constructor(env: Env, admin: Address, default_insurance_percentage: u32) {
        let contract = Self {
            deposits: Map::new(&env),
            deposit_data: Map::new(&env),
            total_balance: 0,
            authorized_operators: Vec::from_array(&env, [admin]),
            default_allocation: YieldAllocation {
                insurance_percentage: default_insurance_percentage,
                yield_percentage: 100 - default_insurance_percentage,
            },
        };

        env.storage().instance().set(&Symbol::new(&env, "YIELD_AGGREGATOR"), &contract);
    }

    /// Create a new deposit
    pub fn deposit(env: Env, depositor: Address, amount: i128, insurance_percentage: Option<u32>) -> Bytes {
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "YIELD_AGGREGATOR"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        if amount <= 0 {
            panic_with_error!(&env, ContractError::InvalidInput);
        }

        // Generate deposit ID
        let deposit_id = Bytes::from_slice(&env, b"deposit_").concat(&Bytes::from_slice(&env, &depositor.to_string().as_bytes().to_vec()));

        // Calculate allocation
        let allocation = if let Some(insurance_pct) = insurance_percentage {
            YieldAllocation {
                insurance_percentage: insurance_pct,
                yield_percentage: 100 - insurance_pct,
            }
        } else {
            contract.default_allocation.clone()
        };

        let insurance_amount = (amount * allocation.insurance_percentage as i128) / 100;
        let yield_amount = amount - insurance_amount;

        // Create deposit
        let deposit = Deposit {
            depositor: depositor.clone(),
            amount,
            insurance_allocation: insurance_amount,
            yield_allocation: yield_amount,
            deposit_time: env.ledger().timestamp(),
            last_yield_claim: env.ledger().timestamp(),
            active: true,
        };

        // Add to user deposits
        let mut user_deposits = contract.deposits.get(depositor.clone()).unwrap_or_else(|| Vec::new(&env));
        user_deposits.push_back(deposit_id.clone());
        contract.deposits.set(depositor, user_deposits);

        // Store deposit data
        contract.deposit_data.set(deposit_id.clone(), deposit);

        // Update total balance
        contract.total_balance += amount;

        // Save contract state
        env.storage().instance().set(&Symbol::new(&env, "YIELD_AGGREGATOR"), &contract);

        deposit_id
    }

    /// Withdraw from a deposit
    pub fn withdraw(env: Env, deposit_id: Bytes, amount: i128) {
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "YIELD_AGGREGATOR"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        // Get deposit
        let mut deposit = contract.deposit_data.get(deposit_id.clone())
            .unwrap_or_else(|| panic!("Deposit not found"));

        if amount <= 0 || amount > deposit.amount {
            panic_with_error!(&env, ContractError::InvalidInput);
        }

        // Update deposit
        deposit.amount -= amount;
        let insurance_withdrawal = (amount * deposit.insurance_allocation) / deposit.total_value();
        let yield_withdrawal = amount - insurance_withdrawal;

        deposit.insurance_allocation -= insurance_withdrawal;
        deposit.yield_allocation -= yield_withdrawal;

        if deposit.amount <= 0 {
            deposit.active = false;
        }

        // Update contract state
        contract.total_balance -= amount;
        contract.deposit_data.set(deposit_id, deposit);

        // Save contract state
        env.storage().instance().set(&Symbol::new(&env, "YIELD_AGGREGATOR"), &contract);
    }

    /// Simulate yield claiming (simplified)
    pub fn claim_yield(env: Env, deposit_id: Bytes) -> i128 {
        let mut contract = env.storage().instance()
            .get(&Symbol::new(&env, "YIELD_AGGREGATOR"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        let mut deposit = contract.deposit_data.get(deposit_id.clone())
            .unwrap_or_else(|| panic!("Deposit not found"));

        if !deposit.active {
            return 0;
        }

        let current_time = env.ledger().timestamp();
        let time_elapsed = current_time - deposit.last_yield_claim;

        // Simple yield calculation: 5% APY on yield allocation
        let seconds_in_year = 365u64 * 24 * 60 * 60;
        let yield_amount = (deposit.yield_allocation * 5 * time_elapsed as i128) / (100 * seconds_in_year as i128);

        if yield_amount > 0 {
            deposit.yield_allocation += yield_amount;
            deposit.amount += yield_amount;
            contract.total_balance += yield_amount;
            deposit.last_yield_claim = current_time;

            contract.deposit_data.set(deposit_id, deposit);
            env.storage().instance().set(&Symbol::new(&env, "YIELD_AGGREGATOR"), &contract);
        }

        yield_amount
    }

    /// Get deposit information
    pub fn get_deposit(env: Env, deposit_id: Bytes) -> Deposit {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "YIELD_AGGREGATOR"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.deposit_data.get(deposit_id)
            .unwrap_or_else(|| panic!("Deposit not found"))
    }

    /// Get all deposits for a user
    pub fn get_user_deposits(env: Env, depositor: Address) -> Vec<Bytes> {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "YIELD_AGGREGATOR"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.deposits.get(depositor).unwrap_or_else(|| Vec::new(&env))
    }

    /// Get total balance in the contract
    pub fn get_total_balance(env: Env) -> i128 {
        let contract = env.storage().instance()
            .get(&Symbol::new(&env, "YIELD_AGGREGATOR"))
            .unwrap_or_else(|| panic!("Contract not initialized"));

        contract.total_balance
    }
}

impl Deposit {
    /// Calculate total value (principal + yield)
    pub fn total_value(&self) -> i128 {
        self.amount
    }
}