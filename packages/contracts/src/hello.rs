use soroban_sdk::{contract, contractimpl, Env, Symbol};

#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    /// Returns a greeting message
    pub fn hello(env: Env, _to: Symbol) -> Symbol {
        Symbol::new(&env, "Hello")
    }
}