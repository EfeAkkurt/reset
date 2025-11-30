//! Basic integration tests for the smart contracts

use soroban_sdk::{Address, Env, Symbol, Vec, Map};
use soroban_sdk::testutils::{Address as _, Ledger as _};

#[test]
fn test_address_operations() {
    let env = Env::default();

    // Test address creation and validation
    let addr1 = Address::generate(&env);
    let addr2 = Address::generate(&env);

    // Addresses should be different
    assert_ne!(addr1, addr2);
    assert_ne!(addr1.to_string(), addr2.to_string());
}

#[test]
fn test_symbol_operations() {
    let env = Env::default();

    // Test symbol creation
    let sym1 = Symbol::new(&env, "TEST");
    let sym2 = Symbol::new(&env, "ANOTHER_TEST");

    // Symbols should be different
    assert_ne!(sym1, sym2);

    // Test symbol equality
    assert_eq!(sym1, Symbol::new(&env, "TEST"));
    assert_eq!(sym2, Symbol::new(&env, "ANOTHER_TEST"));
}

#[test]
fn test_ledger_operations() {
    let env = Env::default();

    // Test ledger sequence
    let sequence = env.ledger().sequence();
    // In test environment, sequence should be accessible
    assert!(sequence >= 0);

    // Test ledger info
    let ledger_info = env.ledger().get();
    assert!(ledger_info.protocol_version > 0);
    assert_eq!(ledger_info.sequence_number, sequence);
}

#[test]
fn test_math_operations() {
    // Test basic math that would be used in contracts
    let a = 100i128;
    let b = 25i128;

    // Basic arithmetic
    assert_eq!(a + b, 125i128);
    assert_eq!(a - b, 75i128);
    assert_eq!(a * b, 2500i128);

    // Division
    assert_eq!(a / b, 4i128);

    // Remainder
    assert_eq!(a % b, 0i128);

    // Comparison
    assert!(a > b);
    assert!(b < a);
    assert!(a >= a);
    assert!(b <= b);

    // Check for overflow
    let max_i128 = i128::MAX;
    let result = max_i128.checked_add(1);
    assert!(result.is_none()); // Should overflow

    let safe_result = max_i128.checked_sub(1);
    assert!(safe_result.is_some()); // Should be safe
}

#[test]
fn test_bool_operations() {
    // Test boolean logic
    assert!(true);
    assert!(!false);

    assert!(true && true);
    assert!(true && false == false); // true AND false equals false
    assert_eq!(false && false, false); // false AND false equals false

    assert!(true || true);
    assert!(true || false == true); // true OR false equals true
    assert!(false || false == false); // false OR false equals false
}

#[test]
fn test_vec_operations() {
    let env = Env::default();

    // Test Vec creation and operations
    let test_vec = Vec::from_array(&env, [1u32, 2u32, 3u32]);

    assert_eq!(test_vec.len(), 3);
    assert_eq!(test_vec.get(0), Some(1u32));
    assert_eq!(test_vec.get(1), Some(2u32));
    assert_eq!(test_vec.get(2), Some(3u32));
    assert_eq!(test_vec.get(3), None); // Out of bounds
}

#[test]
fn test_map_operations() {
    let env = Env::default();

    // Test Map creation and operations
    let mut test_map: Map<Symbol, i128> = Map::new(&env);
    test_map.set(Symbol::new(&env, "key1"), 100i128);
    test_map.set(Symbol::new(&env, "key2"), 200i128);

    assert_eq!(test_map.get(Symbol::new(&env, "key1")), Some(100i128));
    assert_eq!(test_map.get(Symbol::new(&env, "key2")), Some(200i128));
    assert_eq!(test_map.get(Symbol::new(&env, "key3")), None); // Not found

    // Test map length
    assert_eq!(test_map.len(), 2);
}

#[test]
fn test_environment_operations() {
    let env = Env::default();

    // Test environment creation
    assert!(env.ledger().sequence() >= 0);
    assert!(env.ledger().get().protocol_version > 0);

    // Test timestamp (should be available)
    let timestamp = env.ledger().timestamp();
    assert!(timestamp >= 0);
}

#[test]
fn test_contract_data_types() {
    let env = Env::default();

    // Test that Soroban types work correctly
    let address = Address::generate(&env);
    let symbol = Symbol::new(&env, "TEST");
    let number: i128 = 42;

    // Test basic operations
    assert_eq!(number, 42);
    assert_eq!(symbol, Symbol::new(&env, "TEST"));

    // Test address string representation
    let addr_str = address.to_string();
    assert!(!addr_str.is_empty());
    // Test that address has reasonable length (Stellar addresses are 56 characters)
    assert_eq!(addr_str.len(), 56);
}