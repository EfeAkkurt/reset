//! Simple Treasury Contract (No Constructor Version)

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, Symbol, Vec, Bytes, String};

/// Transfer status
#[derive(Clone, Debug, PartialEq, Copy)]
#[contracttype]
pub enum TransferStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Completed = 3,
    Failed = 4,
}

/// Transfer request structure
#[derive(Clone, Debug)]
#[contracttype]
pub struct TransferRequest {
    /// Transfer ID
    pub transfer_id: Bytes,
    /// From address
    pub from_address: Address,
    /// To address
    pub to_address: Address,
    /// Amount to transfer
    pub amount: i128,
    /// Transfer status
    pub status: TransferStatus,
    /// Creation timestamp
    pub created_at: u64,
    /// Memo
    pub memo: Symbol,
}

/// Treasury statistics
#[derive(Clone, Debug)]
#[contracttype]
pub struct TreasuryStats {
    /// Total balance in treasury
    pub total_balance: i128,
    /// Number of pending transfers
    pub pending_transfers: u64,
    /// Number of completed transfers
    pub completed_transfers: u64,
    /// Total amount transferred
    pub total_transferred: i128,
}

/// Fund allocation percentages
#[derive(Clone, Debug)]
#[contracttype]
pub struct FundAllocation {
    /// Percentage for operations
    pub operations_percentage: u32,
    /// Percentage for insurance fund
    pub insurance_percentage: u32,
    /// Percentage for yield farming
    pub yield_percentage: u32,
    /// Percentage for reserves
    pub reserves_percentage: u32,
}

#[contract]
pub struct Treasury;

#[contractimpl]
impl Treasury {
    /// Create a new transfer request
    pub fn create_transfer(
        env: Env,
        from_address: Address,
        to_address: Address,
        amount: i128,
        memo: Symbol,
    ) -> Bytes {
        // Generate transfer ID
        let sequence = env.ledger().sequence();
        let transfer_id = Bytes::from_array(&env, &[
            (sequence & 0xFF) as u8,
            ((sequence >> 8) & 0xFF) as u8,
            ((sequence >> 16) & 0xFF) as u8,
            ((sequence >> 24) & 0xFF) as u8,
        ]);

        let transfer = TransferRequest {
            transfer_id: transfer_id.clone(),
            from_address,
            to_address,
            amount,
            status: TransferStatus::Pending,
            created_at: env.ledger().timestamp(),
            memo,
        };

        // Store transfer
        let mut transfers: Map<Bytes, TransferRequest> = env.storage().instance()
            .get(&Symbol::new(&env, "transfers"))
            .unwrap_or(Map::new(&env));

        transfers.set(transfer_id.clone(), transfer);
        env.storage().instance().set(&Symbol::new(&env, "transfers"), &transfers);

        // Update stats
        let mut stats: TreasuryStats = env.storage().instance()
            .get(&Symbol::new(&env, "stats"))
            .unwrap_or(TreasuryStats {
                total_balance: 0,
                pending_transfers: 0,
                completed_transfers: 0,
                total_transferred: 0,
            });

        stats.pending_transfers += 1;
        env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);

        transfer_id
    }

    /// Approve a transfer request
    pub fn approve_transfer(env: Env, transfer_id: Bytes) -> bool {
        let mut transfers: Map<Bytes, TransferRequest> = env.storage().instance()
            .get(&Symbol::new(&env, "transfers"))
            .unwrap_or(Map::new(&env));

        if let Some(mut transfer) = transfers.get(transfer_id.clone()) {
            transfer.status = TransferStatus::Approved;
            transfers.set(transfer_id, transfer);
            env.storage().instance().set(&Symbol::new(&env, "transfers"), &transfers);

            // Update stats
            let mut stats: TreasuryStats = env.storage().instance()
                .get(&Symbol::new(&env, "stats"))
                .unwrap_or(TreasuryStats {
                    total_balance: 0,
                    pending_transfers: 0,
                    completed_transfers: 0,
                    total_transferred: 0,
                });

            stats.pending_transfers = stats.pending_transfers.saturating_sub(1);
            env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);

            return true;
        }

        false
    }

    /// Reject a transfer request
    pub fn reject_transfer(env: Env, transfer_id: Bytes) -> bool {
        let mut transfers: Map<Bytes, TransferRequest> = env.storage().instance()
            .get(&Symbol::new(&env, "transfers"))
            .unwrap_or(Map::new(&env));

        if let Some(mut transfer) = transfers.get(transfer_id.clone()) {
            transfer.status = TransferStatus::Rejected;
            transfers.set(transfer_id, transfer);
            env.storage().instance().set(&Symbol::new(&env, "transfers"), &transfers);

            // Update stats
            let mut stats: TreasuryStats = env.storage().instance()
                .get(&Symbol::new(&env, "stats"))
                .unwrap_or(TreasuryStats {
                    total_balance: 0,
                    pending_transfers: 0,
                    completed_transfers: 0,
                    total_transferred: 0,
                });

            stats.pending_transfers = stats.pending_transfers.saturating_sub(1);
            env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);

            return true;
        }

        false
    }

    /// Execute a transfer (mark as completed)
    pub fn execute_transfer(env: Env, transfer_id: Bytes) -> bool {
        let mut transfers: Map<Bytes, TransferRequest> = env.storage().instance()
            .get(&Symbol::new(&env, "transfers"))
            .unwrap_or(Map::new(&env));

        if let Some(transfer) = transfers.get(transfer_id.clone()) {
            if transfer.status == TransferStatus::Approved {
                let mut updated_transfer = transfer.clone();
                updated_transfer.status = TransferStatus::Completed;
                transfers.set(transfer_id, updated_transfer);
                env.storage().instance().set(&Symbol::new(&env, "transfers"), &transfers);

                // Update stats
                let mut stats: TreasuryStats = env.storage().instance()
                    .get(&Symbol::new(&env, "stats"))
                    .unwrap_or(TreasuryStats {
                        total_balance: 0,
                        pending_transfers: 0,
                        completed_transfers: 0,
                        total_transferred: 0,
                    });

                stats.completed_transfers += 1;
                stats.total_transferred += transfer.amount;
                env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);

                return true;
            }
        }

        false
    }

    /// Get transfer request information
    pub fn get_transfer(env: Env, transfer_id: Bytes) -> TransferRequest {
        let transfers: Map<Bytes, TransferRequest> = env.storage().instance()
            .get(&Symbol::new(&env, "transfers"))
            .unwrap_or(Map::new(&env));

        transfers.get(transfer_id).unwrap_or_else(|| {
            TransferRequest {
                transfer_id: Bytes::from_array(&env, &[0; 4]),
                from_address: Address::from_string(&String::from_str(&env, "GDQD3UOVCPUTS32XS37N6BJGWAXCARWH7YIDTZUAWMHQEGBXIM3HQ66YV")),
                to_address: Address::from_string(&String::from_str(&env, "GDQD3UOVCPUTS32XS37N6BJGWAXCARWH7YIDTZUAWMHQEGBXIM3HQ66YV")),
                amount: 0,
                status: TransferStatus::Pending,
                created_at: 0,
                memo: Symbol::new(&env, "not_found"),
            }
        })
    }

    /// Get all transfers for a user
    pub fn get_user_transfers(env: Env, user: Address, status: Option<TransferStatus>) -> Vec<Bytes> {
        let transfers: Map<Bytes, TransferRequest> = env.storage().instance()
            .get(&Symbol::new(&env, "transfers"))
            .unwrap_or(Map::new(&env));

        let mut user_transfers = Vec::new(&env);

        for (transfer_id, transfer) in transfers {
            if transfer.from_address == user || transfer.to_address == user {
                if let Some(filter_status) = status {
                    if transfer.status == filter_status {
                        user_transfers.push_back(transfer_id);
                    }
                } else {
                    user_transfers.push_back(transfer_id);
                }
            }
        }

        user_transfers
    }

    /// Get all pending transfers
    pub fn get_pending_transfers(env: Env) -> Vec<Bytes> {
        let transfers: Map<Bytes, TransferRequest> = env.storage().instance()
            .get(&Symbol::new(&env, "transfers"))
            .unwrap_or(Map::new(&env));

        let mut pending = Vec::new(&env);

        for (transfer_id, transfer) in transfers {
            if transfer.status == TransferStatus::Pending {
                pending.push_back(transfer_id);
            }
        }

        pending
    }

    /// Get treasury statistics
    pub fn get_stats(env: Env) -> TreasuryStats {
        env.storage().instance()
            .get(&Symbol::new(&env, "stats"))
            .unwrap_or(TreasuryStats {
                total_balance: 0,
                pending_transfers: 0,
                completed_transfers: 0,
                total_transferred: 0,
            })
    }

    /// Update fund allocation
    pub fn update_allocation(
        env: Env,
        operations_percentage: u32,
        insurance_percentage: u32,
        yield_percentage: u32,
        reserves_percentage: u32,
    ) -> bool {
        // Validate percentages sum to 100
        if operations_percentage + insurance_percentage + yield_percentage + reserves_percentage != 100 {
            return false;
        }

        let allocation = FundAllocation {
            operations_percentage,
            insurance_percentage,
            yield_percentage,
            reserves_percentage,
        };

        env.storage().instance().set(&Symbol::new(&env, "allocation"), &allocation);
        true
    }

    /// Get fund allocation
    pub fn get_allocation(env: Env) -> FundAllocation {
        env.storage().instance()
            .get(&Symbol::new(&env, "allocation"))
            .unwrap_or(FundAllocation {
                operations_percentage: 40,
                insurance_percentage: 30,
                yield_percentage: 20,
                reserves_percentage: 10,
            })
    }

    /// Add funds to treasury
    pub fn add_funds(env: Env, amount: i128) {
        let mut stats: TreasuryStats = env.storage().instance()
            .get(&Symbol::new(&env, "stats"))
            .unwrap_or(TreasuryStats {
                total_balance: 0,
                pending_transfers: 0,
                completed_transfers: 0,
                total_transferred: 0,
            });

        stats.total_balance += amount;
        env.storage().instance().set(&Symbol::new(&env, "stats"), &stats);
    }

    /// Check if transfer exists
    pub fn transfer_exists(env: Env, transfer_id: Bytes) -> bool {
        let transfers: Map<Bytes, TransferRequest> = env.storage().instance()
            .get(&Symbol::new(&env, "transfers"))
            .unwrap_or(Map::new(&env));

        transfers.contains_key(transfer_id)
    }
}