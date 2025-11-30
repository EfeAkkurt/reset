//! Yield aggregator contract for Blend protocol integration

pub mod contract;
pub mod types;

pub use contract::YieldAggregator;
pub use types::{Deposit, YieldAllocation, PoolStats};