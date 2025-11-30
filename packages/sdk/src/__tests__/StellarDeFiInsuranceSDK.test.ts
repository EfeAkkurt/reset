/**
 * Tests for the main StellarDeFiInsuranceSDK class
 */

import { StellarDeFiInsuranceSDK } from '../StellarDeFiInsuranceSDK';
import { ConfigurationError } from '../errors';

describe('StellarDeFiInsuranceSDK', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize successfully with valid config', () => {
      const config = {
        network: global.testUtils.createMockNetworkConfig(),
        contracts: {
          simpleInsurance: 'GCONTRACT_ADDRESS_HERE'
        }
      };

      expect(() => new StellarDeFiInsuranceSDK(config)).not.toThrow();
    });

    it('should throw error with missing network config', () => {
      const config = {
        network: null as any,
        contracts: {
          simpleInsurance: 'GCONTRACT_ADDRESS_HERE'
        }
      };

      expect(() => new StellarDeFiInsuranceSDK(config)).toThrow(ConfigurationError);
    });

    it('should throw error with missing contracts', () => {
      const config = {
        network: global.testUtils.createMockNetworkConfig(),
        contracts: {}
      };

      expect(() => new StellarDeFiInsuranceSDK(config)).toThrow(ConfigurationError);
    });
  });

  describe('forNetwork static factory', () => {
    it('should create SDK for testnet', () => {
      const factory = StellarDeFiInsuranceSDK.forNetwork('testnet');
      const sdk = factory([global.testUtils.createMockContractAddress('GCONTRACT_ADDRESS')]);

      expect(sdk).toBeInstanceOf(StellarDeFiInsuranceSDK);
    });

    it('should create SDK for mainnet', () => {
      const factory = StellarDeFiInsuranceSDK.forNetwork('mainnet');
      const sdk = factory([global.testUtils.createMockContractAddress('GCONTRACT_ADDRESS')]);

      expect(sdk).toBeInstanceOf(StellarDeFiInsuranceSDK);
    });
  });

  describe('getters', () => {
    let sdk: StellarDeFiInsuranceSDK;

    beforeEach(() => {
      const config = {
        network: global.testUtils.createMockNetworkConfig(),
        contracts: {
          simpleInsurance: 'GCONTRACT_ADDRESS',
          yieldAggregator: 'GYIELD_ADDRESS',
          treasury: 'GTREASURY_ADDRESS'
        }
      };
      sdk = new StellarDeFiInsuranceSDK(config);
    });

    it('should return network configuration', () => {
      const network = sdk.getNetwork();
      expect(network).toEqual(global.testUtils.createMockNetworkConfig());
    });

    it('should return contract instances', () => {
      expect(sdk.getSimpleInsurance()).toBeDefined();
      expect(sdk.getYieldAggregator()).toBeDefined();
      expect(sdk.getTreasury()).toBeDefined();
    });

    it('should return all contracts', () => {
      const contracts = sdk.getContracts();
      expect(contracts).toHaveProperty('simpleInsurance');
      expect(contracts).toHaveProperty('yieldAggregator');
      expect(contracts).toHaveProperty('treasury');
    });
  });

  describe('wallet operations', () => {
    let sdk: StellarDeFiInsuranceSDK;

    beforeEach(() => {
      const config = {
        network: global.testUtils.createMockNetworkConfig(),
        contracts: {
          simpleInsurance: 'GCONTRACT_ADDRESS'
        }
      };
      sdk = new StellarDeFiInsuranceSDK(config);
    });

    it('should connect wallet with secret key', async () => {
      const walletConfig = {
        secretKey: 'SABSECRETKEYHERE1234567890ABCDEF'
      };

      await expect(sdk.connectWallet(walletConfig)).resolves.not.toThrow();
      expect(sdk.getWallet()).toBeDefined();
    });

    it('should disconnect wallet', () => {
      sdk.disconnectWallet();
      expect(sdk.getWallet()).toBeUndefined();
    });
  });
});