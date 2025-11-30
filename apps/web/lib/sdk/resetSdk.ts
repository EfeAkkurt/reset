import { StellarDeFiInsuranceSDK, ContractType } from "@stellar-defi-insurance/sdk";

const TESTNET_CONFIG = {
  network: {
    network: "testnet" as const,
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  contracts: {
    simpleInsurance: "CCZHH3REOS3222YNXMO3SHEAHFWMPEPB6VH3K7TME6P4CCJQ3H7BNXWP",
    yieldAggregator: "CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD",
    treasury: "CAA6RLYC724TXZUXYWTHKCHJLGTFV23DNAMGLN2HR2KXSGYYVZKCGKHH",
  },
};

let sdkInstance: StellarDeFiInsuranceSDK | null = null;

export function getResetSdk(): StellarDeFiInsuranceSDK {
  if (sdkInstance) return sdkInstance;

  sdkInstance = StellarDeFiInsuranceSDK.forNetwork("testnet")(
    [
      { type: ContractType.SimpleInsurance, address: TESTNET_CONFIG.contracts.simpleInsurance },
      { type: ContractType.YieldAggregator, address: TESTNET_CONFIG.contracts.yieldAggregator },
      { type: ContractType.Treasury, address: TESTNET_CONFIG.contracts.treasury },
    ],
  );

  return sdkInstance;
}
