#![no_std]

//! Smart contracts for the Stellar DeFi Insurance System
//!
//! This crate contains the core Soroban smart contracts for:
//! - Insurance policy management
//! - Yield aggregation with Blend protocol integration
//! - Treasury and multi-signature fund management

extern crate alloc;

// Use wee_alloc for WASM builds
#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod shared;
pub mod simple_insurance;
pub mod hello;
pub mod yield_aggregator_simple;
pub mod treasury_simple;
// Disable problematic contracts for now
// pub mod yield_aggregator;
// pub mod treasury;
// pub mod insurance;

// Export working contracts
pub use simple_insurance::SimpleInsurance;
pub use hello::HelloContract;
pub use yield_aggregator_simple::YieldAggregator;
pub use treasury_simple::Treasury;