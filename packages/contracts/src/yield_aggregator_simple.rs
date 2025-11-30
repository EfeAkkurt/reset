//! Simple Yield Aggregator Contract (No Constructor Version)

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, Symbol, Vec, String};

/// Simplified yield allocation
#[derive(Clone, Debug)]
#[contracttype]
pub struct YieldAllocation {
    pub insurance_percentage: u32,
    pub yield_percentage: u32,
}

/// Pool statistics
#[derive(Clone, Debug)]
#[contracttype]
pub struct PoolStats {
    pub total_deposits: i128,
    pub total_yield: i128,
    pub active_deposits: u64,
}

/// Simplified deposit structure
#[derive(Clone, Debug)]
#[contracttype]
pub struct Deposit {
    pub depositor: Address,
    pub amount: i128,
    pub allocation: YieldAllocation,
    pub deposit_time: u64,
}

#[contract]
pub struct YieldAggregator;

#[contractimpl]
impl YieldAggregator {
    /// Create a new deposit
    pub fn deposit(env: Env, depositor: Address, amount: i128, insurance_percentage: u32) -> u64 {
        // Simple deposit ID generation
        let deposit_id: u64 = env.ledger().sequence().into();

        // Create allocation
        let allocation = YieldAllocation {
            insurance_percentage: insurance_percentage,
            yield_percentage: 100 - insurance_percentage,
        };

        // Create deposit
        let deposit = Deposit {
            depositor: depositor.clone(),
            amount,
            allocation,
            deposit_time: env.ledger().timestamp(),
        };

        // Store in storage
        let mut deposits: Map<u64, Deposit> = env.storage().instance()
            .get(&Symbol::new(&env, "deposits"))
            .unwrap_or(Map::new(&env));

        deposits.set(deposit_id, deposit);
        env.storage().instance().set(&Symbol::new(&env, "deposits"), &deposits);

        // Update user deposits
        let mut user_deposits: Vec<u64> = env.storage().instance()
            .get(&Symbol::new(&env, "user_deposits"))
            .unwrap_or(Vec::new(&env));

        user_deposits.push_back(deposit_id);
        env.storage().instance().set(&Symbol::new(&env, "user_deposits"), &user_deposits);

        // Update stats
        let mut stats: PoolStats = env.storage().instance()
            .get(&Symbol::new(&env, "stats"))
            .unwrap_or(PoolStats {
                total_deposits: 0,
                total_yield: 0,
                active_deposits: 0,
            });

        stats.total_deposits += amount;
        stats.active_deposits += 1;
        env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);

        deposit_id
    }

    /// Withdraw a deposit
    pub fn withdraw(env: Env, deposit_id: u64, amount: i128) -> bool {
        let mut deposits: Map<u64, Deposit> = env.storage().instance()
            .get(&Symbol::new(&env, "deposits"))
            .unwrap_or(Map::new(&env));

        if let Some(deposit) = deposits.get(deposit_id) {
            if deposit.amount >= amount {
                if deposit.amount == amount {
                    // Remove deposit entirely
                    deposits.remove(deposit_id);

                    // Update stats
                    let mut stats: PoolStats = env.storage().instance()
                        .get(&Symbol::new(&env, "stats"))
                        .unwrap_or(PoolStats {
                            total_deposits: 0,
                            total_yield: 0,
                            active_deposits: 0,
                        });

                    stats.active_deposits -= 1;
                    env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);
                } else {
                    // Update remaining amount
                    let updated_deposit = Deposit {
                        depositor: deposit.depositor.clone(),
                        amount: deposit.amount - amount,
                        allocation: deposit.allocation,
                        deposit_time: deposit.deposit_time,
                    };
                    deposits.set(deposit_id, updated_deposit);
                }

                env.storage().instance().set(&Symbol::new(&env, "deposits"), &deposits);
                return true;
            }
        }

        false
    }

    /// Get deposit information
    pub fn get_deposit(env: Env, deposit_id: u64) -> Deposit {
        let deposits: Map<u64, Deposit> = env.storage().instance()
            .get(&Symbol::new(&env, "deposits"))
            .unwrap_or(Map::new(&env));

        deposits.get(deposit_id).unwrap_or_else(|| {
            // Return empty deposit if not found
            Deposit {
                depositor: Address::from_string(&String::from_str(&env, "GDQD3UOVCPUTS32XS37N6BJGWAXCARWH7YIDTZUAWMHQEGBXIM3HQ66YV")),
                amount: 0,
                allocation: YieldAllocation {
                    insurance_percentage: 0,
                    yield_percentage: 100,
                },
                deposit_time: 0,
            }
        })
    }

    /// Get all deposits for a user
    pub fn get_user_deposits(env: Env, _user: Address) -> Vec<u64> {
        env.storage().instance()
            .get(&Symbol::new(&env, "user_deposits"))
            .unwrap_or(Vec::new(&env))
    }

    /// Get pool statistics
    pub fn get_pool_stats(env: Env) -> PoolStats {
        env.storage().instance()
            .get(&Symbol::new(&env, "stats"))
            .unwrap_or(PoolStats {
                total_deposits: 0,
                total_yield: 0,
                active_deposits: 0,
            })
    }

    /// Add yield to a deposit
    pub fn add_yield(env: Env, deposit_id: u64, yield_amount: i128) -> bool {
        let mut deposits: Map<u64, Deposit> = env.storage().instance()
            .get(&Symbol::new(&env, "deposits"))
            .unwrap_or(Map::new(&env));

        if let Some(deposit) = deposits.get(deposit_id) {
            // Add yield to allocation based on percentages
            let _insurance_yield = yield_amount * deposit.allocation.insurance_percentage as i128 / 100;
            let _regular_yield = yield_amount * deposit.allocation.yield_percentage as i128 / 100;

            // Update stats
            let mut stats: PoolStats = env.storage().instance()
                .get(&Symbol::new(&env, "stats"))
                .unwrap_or(PoolStats {
                    total_deposits: 0,
                    total_yield: 0,
                    active_deposits: 0,
                });

            stats.total_yield += yield_amount;
            env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);

            deposits.set(deposit_id, deposit);
            env.storage().instance().set(&Symbol::new(&env, "deposits"), &deposits);

            return true;
        }

        false
    }

    /// Get total TVL (Total Value Locked)
    pub fn get_total_tvl(env: Env) -> i128 {
        let stats = Self::get_pool_stats(env);
        stats.total_deposits + stats.total_yield
    }

    /// Check if a deposit exists
    pub fn deposit_exists(env: Env, deposit_id: u64) -> bool {
        let deposits: Map<u64, Deposit> = env.storage().instance()
            .get(&Symbol::new(&env, "deposits"))
            .unwrap_or(Map::new(&env));

        deposits.contains_key(deposit_id)
    }
}