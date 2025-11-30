/**
 * DeFiLlama Historical Data Implementation
 * Generated based on API testing results
 */

class DefiLlamaHistoricalData {
    constructor() {
        this.baseUrl = 'https://api.llama.fi';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async getHistoricalData(endpoint, params = {}) {
        const cacheKey = `${endpoint}:${JSON.stringify(params)}`;

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.error(`Failed to fetch historical data from ${endpoint}:`, error);
            throw error;
        }
    }

    
    // Supported endpoints based on testing:
    async getGlobalTVLHistory() {
        return this.getHistoricalData('https://api.llama.fi/v2/historicalChainTvl');
    }

    
    // Supported chains for historical data:
    
    async getEthereumChart(params = {}) {
        return this.getHistoricalData('https://api.llama.fi/v2/historicalChainTvl/Ethereum', params);
    }
    async getBitcoinChart(params = {}) {
        return this.getHistoricalData('https://api.llama.fi/v2/historicalChainTvl/Bitcoin', params);
    }
    async getPolygonChart(params = {}) {
        return this.getHistoricalData('https://api.llama.fi/v2/historicalChainTvl/Polygon', params);
    }
    async getArbitrumChart(params = {}) {
        return this.getHistoricalData('https://api.llama.fi/v2/historicalChainTvl/Arbitrum', params);
    }
    async getstellarChart(params = {}) {
        return this.getHistoricalData('https://api.llama.fi/v2/historicalChainTvl/stellar', params);
    }

    // Utility methods for insurance calculations
    calculateVolatility(data, field = 'tvlUsd') {
        if (!Array.isArray(data) || data.length < 2) return 0;

        const values = data.map(d => d[field] || d.tvl || 0).filter(v => v > 0);
        if (values.length < 2) return 0;

        const returns = [];
        for (let i = 1; i < values.length; i++) {
            if (values[i - 1] > 0) {
                returns.push((values[i] - values[i - 1]) / values[i - 1]);
            }
        }

        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

        return Math.sqrt(variance) * Math.sqrt(365); // Annualized volatility
    }

    calculateRiskScore(pool, historicalData) {
        const volatility = this.calculateVolatility(historicalData);
        const tvl = pool.tvlUsd || 0;

        // Simple risk scoring based on volatility and TVL
        let riskScore = 0;

        // Volatility component (0-50 points)
        riskScore += Math.min(50, volatility * 100);

        // TVL component (0-30 points) - lower TVL = higher risk
        if (tvl < 100000) riskScore += 30;
        else if (tvl < 1000000) riskScore += 20;
        else if (tvl < 10000000) riskScore += 10;

        // Chain component (0-20 points)
        if (pool.chain !== 'Ethereum') riskScore += 10;

        return Math.min(100, riskScore);
    }
}

module.exports = DefiLlamaHistoricalData;