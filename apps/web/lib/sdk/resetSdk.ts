import { StellarDeFiInsuranceSDK } from "@stellar-defi-insurance/sdk";

const TESTNET_CONFIG = {
  network: {
    network: "testnet" as const,
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  contracts: {
    simpleInsurance: "CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD",
    yieldAggregator: "CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD",
    treasury: "CAA6RLYC724TXZUXYWTHKCHJLGTFV23DNAMGLN2HR2KXSGYYVZKCGKHH",
  },
};

let sdkInstance: StellarDeFiInsuranceSDK | null = null;

export function getResetSdk(): StellarDeFiInsuranceSDK {
  if (sdkInstance) return sdkInstance;

  sdkInstance = new StellarDeFiInsuranceSDK({
    network: TESTNET_CONFIG.network,
    contracts: {
      simpleInsurance: TESTNET_CONFIG.contracts.simpleInsurance,
      yieldAggregator: TESTNET_CONFIG.contracts.yieldAggregator,
      treasury: TESTNET_CONFIG.contracts.treasury,
    },
  });

  return sdkInstance;
}
