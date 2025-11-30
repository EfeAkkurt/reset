#!/usr/bin/env node

/**
 * Stellar Yields Integration Test Script
 * Production-ready Stellar and Blend yield data retrieval and validation
 * Refactored from discovery script to focused data integration
 */

const { httpsRequest } = require('./test-stellar-connectivity.js');
const fs = require('fs');

const API_BASE = 'https://api.llama.fi';
const YIELDS_API_BASE = 'https://yields.llama.fi';
const TEST_RESULTS_FILE = './test-results/stellar-yields-integration.json';

// Confirmed Stellar configuration for production
const STELLAR_CONFIG = {
    chainId: 'stellar',
    chainName: 'Stellar',
    project: 'blend',
    symbol: 'XLM',
    supportedAssets: ['XLM', 'USDC', 'EURC', 'ETH'] // Common Stellar assets
};

// Production yield retrieval strategies
const YIELD_RETRIEVAL_STRATEGIES = [
    {
        name: 'Direct Yields Filtering',
        priority: 1,
        method: 'filterYieldsByChain',
        description: 'Filter main yields endpoint for Stellar data'
    },
    {
        name: 'Alternative Yields API',
        priority: 2,
        method: 'alternativeYieldsApi',
        description: 'Use yields.llama.fi domain with potential chain filtering'
    },
    {
        name: 'Protocol-based Retrieval',
        priority: 3,
        method: 'protocolBasedRetrieval',
        description: 'Retrieve Blend protocol data specifically'
    },
    {
        name: 'Client-side Filtering',
        priority: 4,
        method: 'clientSideFiltering',
        description: 'Get all data and filter client-side (fallback)'
    }
];

// Strategy 1: Direct yields filtering
async function filterYieldsByChain() {
    console.log('  📊 Strategy 1: Direct yields filtering');

    try {
        const response = await httpsRequest(`${API_BASE}/yields`);

        if (response.statusCode !== 200 || !Array.isArray(response.data)) {
            return { success: false, error: `HTTP ${response.statusCode}`, data: [] };
        }

        const stellarYields = response.data.filter(pool =>
            pool.chain === STELLAR_CONFIG.chainId ||
            pool.chain === STELLAR_CONFIG.chainName
        );

        const blendPools = stellarYields.filter(pool =>
            pool.project?.toLowerCase().includes(STELLAR_CONFIG.project)
        );

        return {
            success: true,
            strategy: 'Direct Yields Filtering',
            totalPools: stellarYields.length,
            blendPools: blendPools.length,
            data: stellarYields,
            blendData: blendPools,
            metadata: {
                totalYields: response.data.length,
                stellarPercentage: ((stellarYields.length / response.data.length) * 100).toFixed(2),
                dataFreshness: response.headers.date || new Date().toISOString()
            }
        };

    } catch (error) {
        return { success: false, error: error.message, data: [] };
    }
}

// Strategy 2: Alternative yields API
async function alternativeYieldsApi() {
    console.log('  📊 Strategy 2: Alternative yields API');

    const testUrls = [
        `${YIELDS_API_BASE}/pools?chain=${STELLAR_CONFIG.chainId}`,
        `${YIELDS_API_BASE}/pools?chain=${STELLAR_CONFIG.chainName}`,
        `${YIELDS_API_BASE}/pools?project=${STELLAR_CONFIG.project}`,
        `${YIELDS_API_BASE}/pools` // No filters - get all
    ];

    for (const url of testUrls) {
        try {
            const params = url.split('?')[1] || 'no-filters';
            console.log(`    🧪 Testing: ${params}`);

            const response = await httpsRequest(url);

            if (response.statusCode !== 200) {
                continue;
            }

            let pools = [];
            if (response.data?.data && Array.isArray(response.data.data)) {
                pools = response.data.data;
            } else if (Array.isArray(response.data)) {
                pools = response.data;
            }

            // Filter for Stellar
            const stellarPools = pools.filter(pool =>
                pool.chain === STELLAR_CONFIG.chainId ||
                pool.chain === STELLAR_CONFIG.chainName
            );

            const blendPools = stellarPools.filter(pool =>
                pool.project?.toLowerCase().includes(STELLAR_CONFIG.project)
            );

            if (stellarPools.length > 0) {
                return {
                    success: true,
                    strategy: 'Alternative Yields API',
                    workingUrl: url,
                    parameters: params,
                    totalPools: stellarPools.length,
                    blendPools: blendPools.length,
                    data: stellarPools,
                    blendData: blendPools,
                    metadata: {
                        apiVersion: response.data?.status || 'unknown',
                        totalPools: pools.length,
                        stellarPercentage: ((stellarPools.length / pools.length) * 100).toFixed(2)
                    }
                };
            }

        } catch (error) {
            console.log(`    ❌ ${url.split('?')[1] || 'base'}: ${error.message}`);
            continue;
        }
    }

    return { success: false, error: 'No working endpoints found', data: [] };
}

// Strategy 3: Protocol-based retrieval
async function protocolBasedRetrieval() {
    console.log('  📊 Strategy 3: Protocol-based retrieval');

    try {
        // First, get protocol information
        const protocolsResponse = await httpsRequest(`${API_BASE}/protocols`);

        if (protocolsResponse.statusCode !== 200 || !Array.isArray(protocolsResponse.data)) {
            return { success: false, error: 'Could not fetch protocols', data: [] };
        }

        // Find Blend protocol
        const blendProtocol = protocolsResponse.data.find(protocol =>
            protocol.name?.toLowerCase().includes('blend') ||
            protocol.slug?.toLowerCase().includes('blend')
        );

        if (!blendProtocol) {
            return { success: false, error: 'Blend protocol not found', data: [] };
        }

        // Try to get Blend-specific data
        const blendUrls = [
            `${API_BASE}/protocol/${blendProtocol.slug}`,
            `${API_BASE}/yields?project=${blendProtocol.slug}`,
            `${YIELDS_API_BASE}/pools?project=${blendProtocol.slug}`
        ];

        for (const url of blendUrls) {
            try {
                const response = await httpsRequest(url);

                if (response.statusCode !== 200) {
                    continue;
                }

                let blendData = [];
                if (response.data?.pools && Array.isArray(response.data.pools)) {
                    blendData = response.data.pools;
                } else if (Array.isArray(response.data)) {
                    blendData = response.data;
                }

                // Filter for Stellar Blend pools
                const stellarBlendPools = blendData.filter(pool =>
                    pool.chain === STELLAR_CONFIG.chainId ||
                    pool.chains?.includes(STELLAR_CONFIG.chainId)
                );

                if (stellarBlendPools.length > 0) {
                    return {
                        success: true,
                        strategy: 'Protocol-based Retrieval',
                        protocol: blendProtocol,
                        workingUrl: url,
                        totalPools: stellarBlendPools.length,
                        blendPools: stellarBlendPools.length,
                        data: stellarBlendPools,
                        blendData: stellarBlendPools,
                        metadata: {
                            protocolTvl: blendProtocol.tvl || 0,
                            protocolChains: blendProtocol.chains || []
                        }
                    };
                }

            } catch (error) {
                continue;
            }
        }

        return { success: false, error: 'No Stellar Blend pools found', data: [] };

    } catch (error) {
        return { success: false, error: error.message, data: [] };
    }
}

// Strategy 4: Client-side filtering (fallback)
async function clientSideFiltering() {
    console.log('  📊 Strategy 4: Client-side filtering');

    try {
        // Get all yields data
        const yieldsResponse = await httpsRequest(`${API_BASE}/yields`);

        if (yieldsResponse.statusCode !== 200 || !Array.isArray(yieldsResponse.data)) {
            return { success: false, error: 'Could not fetch yields data', data: [] };
        }

        // Get all protocols data
        const protocolsResponse = await httpsRequest(`${API_BASE}/protocols`);
        let protocols = [];
        if (protocolsResponse.statusCode === 200 && Array.isArray(protocolsResponse.data)) {
            protocols = protocolsResponse.data;
        }

        // Comprehensive client-side filtering
        const stellarPools = yieldsResponse.data.filter(pool => {
            // Direct chain matching
            if (pool.chain === STELLAR_CONFIG.chainId || pool.chain === STELLAR_CONFIG.chainName) {
                return true;
            }

            // Project-based matching
            if (pool.project?.toLowerCase().includes(STELLAR_CONFIG.project)) {
                // Verify it's actually on Stellar by checking protocol
                const protocol = protocols.find(p =>
                    p.name?.toLowerCase() === pool.project?.toLowerCase() ||
                    p.slug?.toLowerCase() === pool.project?.toLowerCase()
                );
                return protocol?.chains?.includes(STELLAR_CONFIG.chainId);
            }

            // Symbol-based matching for common Stellar assets
            if (STELLAR_CONFIG.supportedAssets.includes(pool.symbol?.toUpperCase())) {
                const protocol = protocols.find(p =>
                    p.name?.toLowerCase() === pool.project?.toLowerCase() ||
                    p.slug?.toLowerCase() === pool.project?.toLowerCase()
                );
                return protocol?.chains?.includes(STELLAR_CONFIG.chainId);
            }

            return false;
        });

        const blendPools = stellarPools.filter(pool =>
            pool.project?.toLowerCase().includes(STELLAR_CONFIG.project)
        );

        return {
            success: true,
            strategy: 'Client-side Filtering',
            totalPools: stellarPools.length,
            blendPools: blendPools.length,
            data: stellarPools,
            blendData: blendPools,
            metadata: {
                totalYields: yieldsResponse.data.length,
                stellarPercentage: ((stellarPools.length / yieldsResponse.data.length) * 100).toFixed(2),
                filteringMethods: [
                    'Direct chain matching',
                    'Project-based validation',
                    'Asset symbol matching'
                ]
            }
        };

    } catch (error) {
        return { success: false, error: error.message, data: [] };
    }
}

// Validate yield data quality
function validateYieldData(yieldData) {
    if (!Array.isArray(yieldData) || yieldData.length === 0) {
        return { valid: false, errors: ['No yield data provided'] };
    }

    const validationErrors = [];
    const qualityScores = [];

    yieldData.forEach((pool, index) => {
        const poolErrors = [];
        let score = 0;
        const maxScore = 100;

        // Required fields validation
        if (!pool.chain) poolErrors.push('Missing chain field');
        else score += 15;

        if (!pool.project) poolErrors.push('Missing project field');
        else score += 15;

        if (typeof pool.tvlUsd !== 'number' || pool.tvlUsd < 0) {
            poolErrors.push('Invalid TVL (must be positive number)');
        } else {
            score += 20;
        }

        if (typeof pool.apy !== 'number' || pool.apy < 0) {
            poolErrors.push('Invalid APY (must be positive number)');
        } else {
            score += 20;
        }

        if (!pool.symbol) poolErrors.push('Missing symbol field');
        else score += 10;

        // Data quality checks
        if (pool.tvlUsd > 0 && pool.apy >= 0) {
            // Reasonable APY ranges for lending
            if (pool.apy > 50) {
                poolErrors.push('APY unusually high (>50%)');
                score -= 10;
            }
        }

        if (pool.tvlUsd < 1000) {
            poolErrors.push('Very low TVL (<$1000)');
            score -= 5;
        }

        qualityScores.push(score);

        if (poolErrors.length > 0) {
            validationErrors.push(`Pool ${index + 1}: ${poolErrors.join(', ')}`);
        }
    });

    const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;

    return {
        valid: validationErrors.length === 0,
        errors: validationErrors,
        qualityScore: averageQuality,
        qualityGrade: averageQuality >= 90 ? 'A' : averageQuality >= 80 ? 'B' : averageQuality >= 70 ? 'C' : 'D',
        summary: {
            totalPools: yieldData.length,
            validPools: yieldData.length - validationErrors.length,
            averageQuality: averageQuality.toFixed(1)
        }
    };
}

// Calculate risk metrics for insurance
function calculateRiskMetrics(yieldData) {
    if (!Array.isArray(yieldData) || yieldData.length === 0) {
        return { risk: 'HIGH', score: 0, factors: ['No data available'] };
    }

    const riskFactors = [];
    let riskScore = 0;

    // TVL-based risk
    const totalTvl = yieldData.reduce((sum, pool) => sum + (pool.tvlUsd || 0), 0);
    if (totalTvl < 100000) { // Less than $100k
        riskFactors.push('Very low total TVL');
        riskScore += 30;
    } else if (totalTvl < 1000000) { // Less than $1M
        riskFactors.push('Low total TVL');
        riskScore += 20;
    }

    // Pool concentration risk
    if (yieldData.length === 1) {
        riskFactors.push('Single pool concentration');
        riskScore += 25;
    }

    // APY volatility risk (simplified)
    const apyValues = yieldData.map(p => p.apy || 0).filter(apy => apy > 0);
    if (apyValues.length > 0) {
        const avgApy = apyValues.reduce((sum, apy) => sum + apy, 0) / apyValues.length;
        const maxApy = Math.max(...apyValues);

        if (maxApy > avgApy * 2) {
            riskFactors.push('High APY variance');
            riskScore += 15;
        }

        if (avgApy > 20) {
            riskFactors.push('Very high average APY');
            riskScore += 10;
        }
    }

    // Data completeness risk
    const completePools = yieldData.filter(pool =>
        pool.tvlUsd && pool.apy && pool.chain && pool.project && pool.symbol
    );

    if (completePools.length < yieldData.length) {
        riskFactors.push('Incomplete data for some pools');
        riskScore += 10 * (yieldData.length - completePools.length);
    }

    const riskLevel = riskScore >= 50 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';

    return {
        risk: riskLevel,
        score: Math.min(100, riskScore),
        factors: riskFactors,
        metrics: {
            totalTvl: totalTvl,
            poolCount: yieldData.length,
            completePools: completePools.length,
            averageApy: apyValues.length > 0 ? (apyValues.reduce((sum, apy) => sum + apy, 0) / apyValues.length).toFixed(2) : 0
        }
    };
}

// Main integration test
async function runStellarYieldsIntegration() {
    console.log('🚀 Stellar Yields Integration Test');
    console.log('=================================\n');

    // Ensure test results directory exists
    if (!fs.existsSync('./test-results')) {
        fs.mkdirSync('./test-results', { recursive: true });
    }

    const testResults = {
        startTime: new Date().toISOString(),
        testType: 'stellar-yields-integration',
        description: 'Production-ready Stellar and Blend yield data integration testing'
    };

    try {
        console.log('🔍 Testing yield retrieval strategies...');

        // Test all strategies in priority order
        const strategyResults = [];
        let successfulStrategy = null;

        for (const strategy of YIELD_RETRIEVAL_STRATEGIES) {
            console.log(`\n🎯 Priority ${strategy.priority}: ${strategy.name}`);

            let result;
            switch (strategy.method) {
                case 'filterYieldsByChain':
                    result = await filterYieldsByChain();
                    break;
                case 'alternativeYieldsApi':
                    result = await alternativeYieldsApi();
                    break;
                case 'protocolBasedRetrieval':
                    result = await protocolBasedRetrieval();
                    break;
                case 'clientSideFiltering':
                    result = await clientSideFiltering();
                    break;
                default:
                    result = { success: false, error: 'Unknown strategy', data: [] };
            }

            result.strategy = strategy.name;
            result.priority = strategy.priority;
            result.description = strategy.description;
            strategyResults.push(result);

            if (result.success && !successfulStrategy) {
                successfulStrategy = result;
                console.log(`    ✅ SUCCESS: ${strategy.name} - ${result.totalPools} pools found`);
                break; // Stop at first successful strategy
            } else {
                console.log(`    ❌ FAILED: ${strategy.name} - ${result.error}`);
            }
        }

        testResults.strategies = strategyResults;
        testResults.primaryStrategy = successfulStrategy;

        // Validate data quality if successful
        if (successfulStrategy) {
            console.log('\n📊 Validating data quality...');

            const validation = validateYieldData(successfulStrategy.data);
            const riskMetrics = calculateRiskMetrics(successfulStrategy.blendData || successfulStrategy.data);

            testResults.dataValidation = validation;
            testResults.riskMetrics = riskMetrics;

            console.log(`    Quality Score: ${validation.qualityScore.toFixed(1)}/100 (${validation.qualityGrade})`);
            console.log(`    Risk Level: ${riskMetrics.risk} (${riskMetrics.score}/100)`);
        }

        testResults.endTime = new Date().toISOString();

        // Generate integration recommendations
        testResults.recommendations = generateIntegrationRecommendations(testResults);

        testResults.summary = {
            strategiesTested: strategyResults.length,
            successfulStrategies: strategyResults.filter(s => s.success).length,
            totalStellarPools: successfulStrategy?.totalPools || 0,
            totalBlendPools: successfulStrategy?.blendPools || 0,
            dataQuality: testResults.dataValidation?.qualityGrade || 'N/A',
            riskLevel: testResults.riskMetrics?.risk || 'UNKNOWN',
            readyForProduction: (successfulStrategy?.success &&
                                 testResults.dataValidation?.valid &&
                                 ['LOW', 'MEDIUM'].includes(testResults.riskMetrics?.risk)) || false
        };

    } catch (error) {
        testResults.fatalError = error.message;
        console.error('❌ Fatal error during integration testing:', error.message);
    }

    // Save results to file
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));

    // Print summary
    console.log('\n📊 Integration Test Summary');
    console.log('===========================');
    console.log(`Strategies Tested: ${testResults.summary?.strategiesTested || 0}`);
    console.log(`Successful Strategies: ${testResults.summary?.successfulStrategies || 0}`);
    console.log(`Stellar Pools Found: ${testResults.summary?.totalStellarPools || 0}`);
    console.log(`Blend Pools Found: ${testResults.summary?.totalBlendPools || 0}`);
    console.log(`Data Quality: ${testResults.summary?.dataQuality || 'N/A'}`);
    console.log(`Risk Level: ${testResults.summary?.riskLevel || 'UNKNOWN'}`);
    console.log(`Production Ready: ${testResults.summary?.readyForProduction ? '✅ YES' : '❌ NO'}`);

    if (testResults.recommendations) {
        console.log('\n📋 Integration Recommendations');
        console.log('===============================');
        testResults.recommendations.forEach((rec, index) => {
            const priority = ['🟢', '🟡', '🟠', '🔴'][rec.priority - 1] || '⚪';
            console.log(`${priority} ${rec.category}: ${rec.message}`);
        });
    }

    console.log(`\n📄 Results saved to: ${TEST_RESULTS_FILE}`);

    return testResults;
}

// Generate integration recommendations
function generateIntegrationRecommendations(results) {
    const recommendations = [];

    if (results.primaryStrategy?.success) {
        recommendations.push({
            priority: 1,
            category: 'Implementation',
            message: `Use ${results.primaryStrategy.strategy} for production data retrieval`
        });
    } else {
        recommendations.push({
            priority: 4,
            category: 'Implementation',
            message: 'No successful strategies found - investigate alternative data sources'
        });
    }

    if (results.dataValidation?.valid) {
        recommendations.push({
            priority: 1,
            category: 'Data Quality',
            message: `High quality data (${results.dataValidation.qualityGrade} grade) suitable for production`
        });
    } else if (results.dataValidation?.errors?.length > 0) {
        recommendations.push({
            priority: 3,
            category: 'Data Quality',
            message: `${results.dataValidation.errors.length} data quality issues need resolution`
        });
    }

    if (results.riskMetrics?.risk === 'LOW') {
        recommendations.push({
            priority: 1,
            category: 'Risk Assessment',
            message: 'Low risk profile - suitable for insurance calculations'
        });
    } else if (results.riskMetrics?.risk === 'MEDIUM') {
        recommendations.push({
            priority: 2,
            category: 'Risk Assessment',
            message: 'Medium risk - implement additional safeguards'
        });
    } else {
        recommendations.push({
            priority: 4,
            category: 'Risk Assessment',
            message: 'High risk level - reconsider or require manual underwriting'
        });
    }

    if (results.summary?.readyForProduction) {
        recommendations.push({
            priority: 1,
            category: 'Production Readiness',
            message: 'System ready for production deployment with monitoring'
        });
    }

    return recommendations;
}

// Execute tests if run directly
if (require.main === module) {
    runStellarYieldsIntegration()
        .then(results => {
            const exitCode = results.summary?.readyForProduction ? 0 : 1;
            console.log(`\n${results.summary?.readyForProduction ? '✅' : '❌'} Integration tests completed`);
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('\n❌ Integration tests failed:', error);
            process.exit(1);
        });
}

module.exports = { runStellarYieldsIntegration };