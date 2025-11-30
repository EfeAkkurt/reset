#!/usr/bin/env node

/**
 * DeFiLlama Historical Data Test Script
 * Tests historical data endpoints for risk analysis and insurance calculations
 */

const { httpsRequest } = require('./test-defillama-connection.js');
const fs = require('fs');

const API_BASE = 'https://api.llama.fi';
const HISTORICAL_TEST_FILE = './test-results/historical-data-test.json';

// Test endpoints that might exist for historical data
const HISTORICAL_ENDPOINTS = [
    {
        name: 'Global TVL History',
        url: `${API_BASE}/v2/historicalChainTvl`,
        description: 'Global DeFi TVL over time'
    },
    {
        name: 'Chains TVL History',
        url: `${API_BASE}/v2/chains/Ethereum/chart`,
        description: 'Ethereum TVL history (test endpoint structure)'
    },
    {
        name: 'Pool Chart Data',
        url: `${API_BASE}/charts/pool/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640`,
        description: 'Example pool chart data (USDC-WETH)'
    },
    {
        name: 'Pool History',
        url: `${API_BASE}/pool/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640/history`,
        description: 'Example pool historical data'
    },
    {
        name: 'Volume History',
        url: `${API_BASE}/volume`,
        description: 'Global volume history'
    },
    {
        name: 'Fees History',
        url: `${API_BASE}/fees`,
        description: 'Protocol fees and revenue history'
    }
];

// Test basic historical endpoint structure
async function testBasicHistoricalEndpoints() {
    console.log('📈 Testing basic historical endpoints...');

    const results = [];

    for (const endpoint of HISTORICAL_ENDPOINTS) {
        try {
            console.log(`  📊 Testing: ${endpoint.name}`);
            const startTime = Date.now();

            const response = await httpsRequest(endpoint.url);
            const responseTime = Date.now() - startTime;

            let dataType = 'unknown';
            let dataPoints = 0;
            let timeRange = null;

            if (response.statusCode === 200) {
                if (Array.isArray(response.data)) {
                    dataType = 'array';
                    dataPoints = response.data.length;

                    // Check if it's time-series data
                    if (dataPoints > 0 && response.data[0].hasOwnProperty('date')) {
                        dataType = 'time_series';
                        const dates = response.data.map(d => d.date).filter(Boolean);
                        if (dates.length > 1) {
                            timeRange = {
                                earliest: Math.min(...dates),
                                latest: Math.max(...dates),
                                span: Math.max(...dates) - Math.min(...dates)
                            };
                        }
                    }
                } else if (typeof response.data === 'object') {
                    dataType = 'object';
                    if (response.data.data && Array.isArray(response.data.data)) {
                        dataPoints = response.data.data.length;
                        dataType = 'wrapped_array';
                    }
                }
            }

            results.push({
                endpoint: endpoint.name,
                url: endpoint.url,
                description: endpoint.description,
                status: response.statusCode,
                responseTime: responseTime,
                dataType: dataType,
                dataPoints: dataPoints,
                timeRange: timeRange,
                sampleData: dataPoints > 0 ?
                    (Array.isArray(response.data) ? response.data.slice(0, 3) : response.data) : null
            });

            console.log(`    ${response.statusCode === 200 ? '✅' : '❌'} ${endpoint.name}: ${response.statusCode} (${dataPoints} points, ${responseTime}ms)`);

        } catch (error) {
            results.push({
                endpoint: endpoint.name,
                url: endpoint.url,
                status: 'ERROR',
                error: error.message
            });
            console.log(`    ❌ ${endpoint.name}: ${error.message}`);
        }
    }

    return results;
}

// Test chain-specific historical data (if chains are supported)
async function testChainHistoricalData() {
    console.log('\n🌐 Testing chain-specific historical data...');

    const chains = ['Ethereum', 'Bitcoin', 'Polygon', 'Arbitrum', 'stellar']; // Include stellar as test
    const results = [];

    for (const chain of chains) {
        try {
            console.log(`  🔍 Testing chain: ${chain}`);

            // Test different possible endpoint structures
            const endpoints = [
                `${API_BASE}/v2/chains/${chain}/chart`,
                `${API_BASE}/chain/${chain}/chart`,
                `${API_BASE}/v2/historicalChainTvl/${chain}`,
                `${API_BASE}/historical/${chain}/tvl`
            ];

            const chainResults = [];

            for (const endpoint of endpoints) {
                try {
                    const response = await httpsRequest(endpoint);

                    chainResults.push({
                        endpoint: endpoint,
                        status: response.statusCode,
                        hasData: response.statusCode === 200 &&
                               (Array.isArray(response.data) ||
                                (response.data?.data && Array.isArray(response.data.data)))
                    });
                } catch (error) {
                    chainResults.push({
                        endpoint: endpoint,
                        status: 'ERROR',
                        error: error.message
                    });
                }
            }

            const successfulEndpoint = chainResults.find(r => r.hasData);

            results.push({
                chain: chain,
                testedEndpoints: chainResults,
                supported: !!successfulEndpoint,
                workingEndpoint: successfulEndpoint?.endpoint || null
            });

            console.log(`    ${successfulEndpoint ? '✅' : '❌'} ${chain}: ${successfulEndpoint ? 'Supported' : 'Not supported'}`);

        } catch (error) {
            results.push({
                chain: chain,
                supported: false,
                error: error.message
            });
            console.log(`    ❌ ${chain}: ${error.message}`);
        }
    }

    return results;
}

// Test parameter variations for historical data
async function testHistoricalParameters() {
    console.log('\n⚙️  Testing historical data parameters...');

    const baseUrl = `${API_BASE}/v2/chains/Ethereum/chart`; // Use known working endpoint
    const parameterTests = [
        {
            name: 'Time Range - Last 30 days',
            url: `${baseUrl}?start=${Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60}`,
            description: 'Last 30 days'
        },
        {
            name: 'Time Range - Start and End',
            url: `${baseUrl}?start=1640995200&end=1643673600`, // Jan 1 - Jan 31, 2022
            description: 'Specific date range'
        },
        {
            name: 'Period Parameter',
            url: `${baseUrl}?period=daily`,
            description: 'Daily period'
        },
        {
            name: 'Smooth Parameter',
            url: `${baseUrl}?smooth=true`,
            description: 'Smooth data'
        }
    ];

    const results = [];

    for (const test of parameterTests) {
        try {
            console.log(`  🔧 Testing: ${test.name}`);

            const response = await httpsRequest(test.url);

            results.push({
                parameterTest: test.name,
                url: test.url,
                description: test.description,
                status: response.statusCode,
                dataPoints: Array.isArray(response.data) ? response.data.length : 0,
                parametersSupported: response.statusCode === 200
            });

            console.log(`    ${response.statusCode === 200 ? '✅' : '❌'} ${test.name}: ${response.statusCode}`);

        } catch (error) {
            results.push({
                parameterTest: test.name,
                status: 'ERROR',
                error: error.message
            });
            console.log(`    ❌ ${test.name}: ${error.message}`);
        }
    }

    return results;
}

// Test yields historical data
async function testYieldsHistoricalData() {
    console.log('\n💰 Testing yields historical data...');

    const yieldsEndpoints = [
        {
            name: 'Current Yields',
            url: `${API_BASE}/yields`,
            description: 'Current yield rates across protocols'
        },
        {
            name: 'Yields History (if exists)',
            url: `${API_BASE}/yields/history`,
            description: 'Historical yields data'
        }
    ];

    const results = [];

    for (const endpoint of yieldsEndpoints) {
        try {
            console.log(`  📊 Testing: ${endpoint.name}`);

            const response = await httpsRequest(endpoint.url);

            let yieldData = {
                totalPools: 0,
                chains: [],
                averageApy: 0,
                lendingPools: 0
            };

            if (response.statusCode === 200 && Array.isArray(response.data)) {
                yieldData.totalPools = response.data.length;
                yieldData.chains = [...new Set(response.data.map(p => p.chain).filter(Boolean))];

                const apyValues = response.data.map(p => p.apy || p.apyBase || 0).filter(apy => apy > 0);
                yieldData.averageApy = apyValues.length > 0 ?
                    apyValues.reduce((sum, apy) => sum + apy, 0) / apyValues.length : 0;

                yieldData.lendingPools = response.data.filter(p =>
                    p.symbol?.toLowerCase().includes('lending') ||
                    p.pool?.toLowerCase().includes('lending')
                ).length;
            }

            results.push({
                endpoint: endpoint.name,
                url: endpoint.url,
                status: response.statusCode,
                yieldData: yieldData
            });

            console.log(`    ${response.statusCode === 200 ? '✅' : '❌'} ${endpoint.name}: ${yieldData.totalPools} pools, ${yieldData.chains.length} chains`);

        } catch (error) {
            results.push({
                endpoint: endpoint.name,
                status: 'ERROR',
                error: error.message
            });
            console.log(`    ❌ ${endpoint.name}: ${error.message}`);
        }
    }

    return results;
}

// Create sample implementation code based on findings
function generateImplementationCode(results) {
    console.log('\n📝 Generating implementation code based on test results...');

    const supportedEndpoints = results.basicEndpoints.filter(e => e.status === 200);
    const supportedChains = results.chainHistorical.filter(c => c.supported);

    const implementationCode = `
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
        const cacheKey = \`\${endpoint}:\${JSON.stringify(params)}\`;

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const url = new URL(\`\${this.baseUrl}\${endpoint}\`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
            }

            const data = await response.json();

            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.error(\`Failed to fetch historical data from \${endpoint}:\`, error);
            throw error;
        }
    }

    ${supportedEndpoints.length > 0 ? `
    // Supported endpoints based on testing:
    ${supportedEndpoints.map(e => {
        const method = e.endpoint.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `async get${e.endpoint.replace(/[^a-zA-Z0-9]/g, '')}() {
        return this.getHistoricalData('${e.url.replace(this.baseUrl, '')}');
    }`;
    }).join('\n\n    ')}` : '// No historical endpoints were available during testing'}

    ${supportedChains.length > 0 ? `
    // Supported chains for historical data:
    ${supportedChains.map(c => `
    async get${c.chain}Chart(params = {}) {
        return this.getHistoricalData('${c.workingEndpoint?.replace(this.baseUrl, '') || `/v2/chains/${c.chain}/chart`}', params);
    }`).join('')}` : '// No chain-specific historical data was available during testing'}

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
`;

    return implementationCode.trim();
}

// Main test execution
async function runHistoricalTests() {
    console.log('🚀 DeFiLlama Historical Data Test Suite');
    console.log('=====================================\n');

    // Ensure test results directory exists
    if (!fs.existsSync('./test-results')) {
        fs.mkdirSync('./test-results', { recursive: true });
    }

    const testResults = {
        startTime: new Date().toISOString(),
        description: 'DeFiLlama historical data endpoints testing for risk analysis'
    };

    try {
        // Run all test suites
        testResults.basicEndpoints = await testBasicHistoricalEndpoints();
        testResults.chainHistorical = await testChainHistoricalData();
        testResults.parameterTests = await testHistoricalParameters();
        testResults.yieldsHistorical = await testYieldsHistoricalData();

        testResults.endTime = new Date().toISOString();

        // Generate implementation code
        testResults.implementationCode = generateImplementationCode(testResults);

        // Analyze results
        testResults.analysis = {
            availableEndpoints: testResults.basicEndpoints.filter(e => e.status === 200).length,
            supportedChains: testResults.chainHistorical.filter(c => c.supported).length,
            parametersSupported: testResults.parameterTests.filter(p => p.parametersSupported).length,
            yieldsDataAvailable: testResults.yieldsHistorical.some(y => y.status === 200),
            recommendation: generateHistoricalRecommendation(testResults)
        };

    } catch (error) {
        testResults.fatalError = error.message;
    }

    // Save results to file
    fs.writeFileSync(HISTORICAL_TEST_FILE, JSON.stringify(testResults, null, 2));

    // Save implementation code to separate file
    const implementationFile = './test-results/defillama-historical-implementation.js';
    fs.writeFileSync(implementationFile, testResults.implementationCode);

    // Print summary
    console.log('\n📊 Historical Data Summary');
    console.log('============================');
    console.log(`Available Endpoints: ${testResults.analysis?.availableEndpoints || 0}/${HISTORICAL_ENDPOINTS.length}`);
    console.log(`Supported Chains: ${testResults.analysis?.supportedChains || 0}`);
    console.log(`Parameter Support: ${testResults.analysis?.parametersSupported || 0}`);
    console.log(`Yields Data: ${testResults.analysis?.yieldsDataAvailable ? '✅ Available' : '❌ Not available'}`);

    console.log('\n📋 Recommendation');
    console.log('================');
    console.log(testResults.analysis?.recommendation || 'Unable to generate recommendation');

    console.log(`\n📄 Results saved to: ${HISTORICAL_TEST_FILE}`);
    console.log(`📄 Implementation code saved to: ${implementationFile}`);

    return testResults;
}

// Generate recommendation based on test results
function generateHistoricalRecommendation(results) {
    const availableEndpoints = results.basicEndpoints.filter(e => e.status === 200).length;
    const supportedChains = results.chainHistorical.filter(c => c.supported).length;
    const yieldsData = results.yieldsHistorical.some(y => y.status === 200);

    if (availableEndpoints >= 3 && supportedChains > 0 && yieldsData) {
        return '✅ COMPREHENSIVE SUPPORT: DeFiLlama provides robust historical data capabilities. Implement full risk analysis system.';
    } else if (availableEndpoints >= 2 && yieldsData) {
        return '🔶 MODERATE SUPPORT: Some historical data available. Implement basic risk calculations with supplemental data sources.';
    } else if (availableEndpoints >= 1) {
        return '⚠️  LIMITED SUPPORT: Minimal historical data available. Consider alternative data providers for comprehensive risk analysis.';
    } else {
        return '❌ NO SUPPORT: No historical data endpoints available. Use alternative analytics platforms or direct protocol APIs.';
    }
}

// Execute tests if run directly
if (require.main === module) {
    runHistoricalTests()
        .then(results => {
            console.log('\n✅ Historical data tests completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Historical data tests failed:', error);
            process.exit(1);
        });
}

module.exports = { runHistoricalTests };