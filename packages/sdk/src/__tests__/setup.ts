/**
 * Jest setup file
 */

// Mock Stellar SDK for testing
jest.mock('@stellar/stellar-sdk', () => ({
  Server: jest.fn().mockImplementation(() => ({
    loadAccount: jest.fn(),
    submitTransaction: jest.fn(),
    ledgers: jest.fn(),
    transactions: jest.fn(),
  })),
  Networks: {
    PUBLIC: 'Public Global Stellar Network ; September 2015',
    TESTNET: 'Test SDF Network ; September 2015'
  },
  TransactionBuilder: jest.fn(),
  Keypair: {
    fromSecret: jest.fn(),
    random: jest.fn(),
  },
  xdr: {
    Memo: {
      text: jest.fn(),
    },
    Asset: {
      native: jest.fn(),
    },
    Operation: {
      payment: jest.fn(),
    },
  }
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global test utilities
global.testUtils = {
  createMockContractAddress: (address: string) => ({
    contractId: address,
    address: address
  }),

  createMockNetworkConfig: (network: string = 'testnet') => ({
    network,
    sorobanRpcUrl: `https://soroban-${network}.stellar.org`,
    horizonUrl: `https://horizon-${network}.stellar.org`,
    networkPassphrase: network === 'mainnet' ? 'Public Global Stellar Network ; September 2015' : 'Test SDF Network ; September 2015'
  })
};

declare global {
  namespace globalThis {
    var testUtils: {
      createMockContractAddress: (address: string) => { contractId: string; address: string };
      createMockNetworkConfig: (network?: string) => any;
    };
  }
}