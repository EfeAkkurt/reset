//! Treasury contract for multi-signature fund management

pub mod contract;
pub mod types;

pub use contract::Treasury;
pub use types::{PendingTransfer, TransferStatus, TreasuryStats};