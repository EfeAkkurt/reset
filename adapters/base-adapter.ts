import { Opportunity, ProtocolInfo } from '../types';

export abstract class BaseAdapter {
  protected protocolInfo: ProtocolInfo;
  protected lastError: Error | null = null;

  constructor(protocolInfo: ProtocolInfo) {
    this.protocolInfo = protocolInfo;
  }

  abstract list(): Promise<Opportunity[]>;
  abstract detail(id: string): Promise<Opportunity>;

  protected async fetchWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.protocolInfo.retryAttempts || 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), this.protocolInfo.timeout || 10000)
          )
        ]);

        this.lastError = null;
        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt === retries) {
          break;
        }

        // Wait before retry with exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.lastError = lastError!;
    throw lastError;
  }

  protected handleError(error: Error, context: string): never {
    const errorMessage = `${this.protocolInfo.name} adapter error in ${context}: ${error.message}`;
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }

  protected calculateRisk(apy: number, tvlUsd: number, isStablecoin: boolean): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // TVL-based risk
    if (tvlUsd < 10000) {
      riskScore += 2; // Very low TVL
    } else if (tvlUsd < 100000) {
      riskScore += 1; // Low TVL
    }

    // APY-based risk
    if (apy > 20) {
      riskScore += 2; // Very high APY
    } else if (apy > 10) {
      riskScore += 1; // High APY
    }

    // Stablecoin bonus
    if (isStablecoin) {
      riskScore = Math.max(0, riskScore - 1);
    }

    if (riskScore >= 3) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  getProtocolInfo(): ProtocolInfo {
    return { ...this.protocolInfo };
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  clearError(): void {
    this.lastError = null;
  }
}