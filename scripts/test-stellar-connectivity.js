#!/usr/bin/env node

/**
 * Stellar-Only DeFiLlama API Connection Test Script
 * Focused validation of Stellar endpoints and Blend protocol support
 * Refactored from generic API testing to Stellar-specific production validation
 */

const https = require('https');
const fs = require('fs');

const API_BASE = 'https://api.llama.fi';
const YIELDS_API_BASE = 'https://yields.llama.fi';
const TEST_RESULTS_FILE = './test-results/stellar-connectivity.json';

// Confirmed working Stellar identifiers
const STELLAR_CONFIG = {
    chainId: 'stellar',
    chainName: 'Stellar',
    project: 'blend',
    symbol: 'XLM',
    workingEndpoint: 'https://yields.llama.fi/pools',
    supportedProtocols: ['blend-pools-v2', 'blend-pools']
};

// Utility function for HTTP requests with enhanced error handling
function httpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: response.statusCode,
                        data: jsonData,
                        headers: response.headers,
                        url: url
                    });
                } catch (error) {
                    resolve({
                        statusCode: response.statusCode,
                        data: data,
                        error: 'JSON Parse Error',
                        url: url,
                        rawData: data.substring(0, 200) // First 200 chars for debugging
                    });
                }
            });
        });

        request.on('error', (error) => {
            reject({
                error: error.message,
                url: url,
                type: 'network_error'
            });
        });

        request.setTimeout(options.timeout || 15000, () => {
            request.destroy();
            reject({
                error: 'Request timeout',
                url: url,
                type: 'timeout'
            });
        });
    });
}

// Test confirmed Stellar endpoints
async function testStellarEndpoints() {
    console.log('🌟 Testing confirmed Stellar endpoints...');

    const stellarEndpoints = [
        {
            name: 'Stellar Chain Validation',
            url: `${API_BASE}/chains`,
            validator: (data) => {
                const stellarChain = Array.isArray(data) ? data.find(chain =>
                    chain.name === STELLAR_CONFIG.chainName ||
                    chain.chainId === STELLAR_CONFIG.chainId ||
                    chain.gecko_id === 'stellar'
                ) : null;

                return {
                    found: !!stellarChain,
                    chain: stellarChain,
                    tokenSymbol: stellarChain?.tokenSymbol || 'XLM'
                };
            }
        },
        {
            name: 'Stellar Protocols Support',
            url: `${API_BASE}/protocols`,
            validator: (data) => {
                const stellarProtocols = Array.isArray(data) ? data.filter(protocol =>
                    protocol.chains?.includes(STELLAR_CONFIG.chainId) ||
                    protocol.name?.toLowerCase().includes('stellar') ||
                    protocol.slug?.toLowerCase().includes('stellar')
                ) : [];

                return {
                    count: stellarProtocols.length,
                    protocols: stellarProtocols.slice(0, 5), // Limit for performance
                    hasBlend: stellarProtocols.some(p => p.name?.toLowerCase().includes('blend'))
                };
            }
        },
        {
            name: 'Working Yields API',
            url: `${YIELDS_API_BASE}/pools`,
            validator: (data) => {
                // Use the confirmed working yields API
                const stellarPools = data?.data ? data.data.filter(pool =>
                    pool.chain === STELLAR_CONFIG.chainId ||
                    pool.chain === STELLAR_CONFIG.chainName
                ) : [];

                const blendPools = stellarPools.filter(pool =>
                    STELLAR_CONFIG.supportedProtocols.includes(pool.project?.toLowerCase())
                );

                return {
                    count: stellarPools.length,
                    blendCount: blendPools.length,
                    pools: stellarPools.slice(0, 5),
                    totalTvl: stellarPools.reduce((sum, pool) => sum + (pool.tvlUsd || 0), 0),
                    averageApy: stellarPools.length > 0 ?
                        stellarPools.reduce((sum, pool) => sum + (pool.apy || 0), 0) / stellarPools.length : 0,
                    apiVersion: data?.status || 'unknown'
                };
            }
        }
    ];

    const results = [];

    for (const endpoint of stellarEndpoints) {
        try {
            console.log(`  🔍 Testing: ${endpoint.name}`);
            const startTime = Date.now();
            const response = await httpsRequest(endpoint.url);
            const responseTime = Date.now() - startTime;

            let validationResult = { success: false, data: null };

            if (response.statusCode === 200 && Array.isArray(response.data)) {
                validationResult = endpoint.validator(response.data);
            }

            results.push({
                test: endpoint.name,
                url: endpoint.url,
                status: response.statusCode,
                responseTime: responseTime,
                success: response.statusCode === 200 && validationResult.success !== false,
                validation: validationResult,
                dataSize: JSON.stringify(response.data).length,
                timestamp: new Date().toISOString()
            });

            const success = response.statusCode === 200 && validationResult.success !== false;
            console.log(`    ${success ? '✅' : '❌'} ${endpoint.name}: ${response.statusCode} (${responseTime}ms) - ${validationResult.count || 0} items`);

        } catch (error) {
            results.push({
                test: endpoint.name,
                url: endpoint.url,
                status: 'ERROR',
                error: error.message || error.error,
                errorType: error.type || 'unknown',
                success: false,
                timestamp: new Date().toISOString()
            });

            console.log(`    ❌ ${endpoint.name}: ${error.message || error.error}`);
        }
    }

    return results;
}

// Test dashboard vs API discrepancy
async function testDashboardFiltering() {
    console.log('\n🖥️  Testing dashboard vs API filtering discrepancy...');

    const filterTests = [
        // Test the working endpoint
        `${YIELDS_API_BASE}/pools`, // This works - get all pools and filter client-side
        // Test suspected chain filtering patterns (may not work but worth trying)
        `${YIELDS_API_BASE}/pools?chain=${STELLAR_CONFIG.chainId}`,
        `${YIELDS_API_BASE}/pools?chain=${STELLAR_CONFIG.chainName}`,
        // Test protocol filtering
        `${YIELDS_API_BASE}/pools?project=blend-pools-v2`,
        `${YIELDS_API_BASE}/pools?project=blend-pools`
    ];

    const results = [];

    for (const testUrl of filterTests) {
        try {
            console.log(`  🧪 Testing: ${testUrl.split('?')[1] || 'base endpoint'}`);
            const startTime = Date.now();
            const response = await httpsRequest(testUrl);
            const responseTime = Date.now() - startTime;

            let stellarData = null;
            let dataCount = 0;

            if (response.statusCode === 200) {
                if (Array.isArray(response.data)) {
                    stellarData = response.data.filter(item =>
                        item.chain === STELLAR_CONFIG.chainId ||
                        item.chain === STELLAR_CONFIG.chainName ||
                        item.project?.toLowerCase().includes(STELLAR_CONFIG.project)
                    );
                    dataCount = stellarData.length;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    stellarData = response.data.data.filter(item =>
                        item.chain === STELLAR_CONFIG.chainId ||
                        item.chain === STELLAR_CONFIG.chainName
                    );
                    dataCount = stellarData.length;
                }
            }

            const result = {
                url: testUrl,
                parameters: testUrl.split('?')[1] || 'none',
                statusCode: response.statusCode,
                responseTime: responseTime,
                dataCount: dataCount,
                hasStellarData: dataCount > 0,
                success: response.statusCode === 200,
                sampleData: dataCount > 0 ? stellarData.slice(0, 1) : null
            };

            results.push(result);
            console.log(`    ${result.hasStellarData ? '✅' : '❌'} ${result.parameters}: ${dataCount} Stellar items`);

        } catch (error) {
            results.push({
                url: testUrl,
                parameters: testUrl.split('?')[1] || 'none',
                error: error.message || error.error,
                errorType: error.type || 'unknown',
                success: false,
                dataCount: 0,
                hasStellarData: false
            });
            console.log(`    ❌ ${testUrl.split('?')[1] || 'base'}: ${error.message || error.error}`);
        }
    }

    return results;
}

// Test Blend-specific data retrieval
async function testBlendDataRetrieval() {
    console.log('\n🏦 Testing Blend protocol data retrieval...');

    const blendTests = [
        {
            name: 'Blend in Yields',
            url: `${API_BASE}/yields`,
            filter: (data) => Array.isArray(data) ? data.filter(pool =>
                pool.project?.toLowerCase().includes('blend') ||
                pool.symbol?.toLowerCase().includes('blend')
            ) : []
        },
        {
            name: 'Blend in Protocols',
            url: `${API_BASE}/protocols`,
            filter: (data) => Array.isArray(data) ? data.filter(protocol =>
                protocol.name?.toLowerCase().includes('blend') ||
                protocol.slug?.toLowerCase().includes('blend')
            ) : []
        },
        {
            name: 'Blend Pools via Yields API',
            url: `${YIELDS_API_BASE}/pools?project=blend`,
            filter: (data) => data?.data ? data.data.filter(pool =>
                pool.project?.toLowerCase().includes('blend')
            ) : []
        }
    ];

    const results = [];

    for (const test of blendTests) {
        try {
            console.log(`  🔍 Testing: ${test.name}`);
            const startTime = Date.now();
            const response = await httpsRequest(test.url);
            const responseTime = Date.now() - startTime;

            let blendData = { count: 0, items: [], stellarCount: 0 };

            if (response.statusCode === 200) {
                const filtered = test.filter(response.data);
                blendData.count = filtered.length;
                blendData.items = filtered.slice(0, 3); // Limit for performance
                blendData.stellarCount = filtered.filter(item =>
                    item.chain === STELLAR_CONFIG.chainId ||
                    item.chain === STELLAR_CONFIG.chainName
                ).length;
            }

            results.push({
                test: test.name,
                url: test.url,
                status: response.statusCode,
                responseTime: responseTime,
                blendData: blendData,
                success: response.statusCode === 200,
                timestamp: new Date().toISOString()
            });

            console.log(`    ${blendData.count > 0 ? '✅' : '❌'} ${test.name}: ${blendData.count} Blend pools (${blendData.stellarCount} Stellar)`);

        } catch (error) {
            results.push({
                test: test.name,
                url: test.url,
                status: 'ERROR',
                error: error.message || error.error,
                blendData: { count: 0, items: [], stellarCount: 0 },
                success: false,
                timestamp: new Date().toISOString()
            });
            console.log(`    ❌ ${test.name}: ${error.message || error.error}`);
        }
    }

    return results;
}

// Generate recommendations based on test results
function generateRecommendations(results) {
    const recommendations = {
        connectivity: {
            status: 'unknown',
            message: '',
            priority: 0
        },
        dataQuality: {
            status: 'unknown',
            message: '',
            priority: 0
        },
        implementation: {
            status: 'unknown',
            message: '',
            priority: 0
        }
    };

    // Analyze endpoint connectivity
    const workingEndpoints = results.endpoints.filter(e => e.success).length;
    const totalEndpoints = results.endpoints.length;

    if (workingEndpoints === totalEndpoints) {
        recommendations.connectivity = {
            status: 'EXCELLENT',
            message: 'All Stellar endpoints are accessible and functional',
            priority: 1
        };
    } else if (workingEndpoints >= totalEndpoints * 0.75) {
        recommendations.connectivity = {
            status: 'GOOD',
            message: 'Most Stellar endpoints accessible, some alternatives available',
            priority: 2
        };
    } else if (workingEndpoints >= totalEndpoints * 0.5) {
        recommendations.connectivity = {
            status: 'PARTIAL',
            message: 'Limited Stellar endpoint access, need fallback strategies',
            priority: 3
        };
    } else {
        recommendations.connectivity = {
            status: 'POOR',
            message: 'Major connectivity issues, consider alternative data sources',
            priority: 4
        };
    }

    // Analyze data quality
    const stellarYieldCount = results.endpoints
        .find(e => e.test === 'Stellar Yields Data')?.validation?.count || 0;

    const blendPoolCount = results.blendData
        .reduce((sum, test) => sum + test.blendData.stellarCount, 0);

    if (stellarYieldCount > 0 && blendPoolCount > 0) {
        recommendations.dataQuality = {
            status: 'EXCELLENT',
            message: `Found ${stellarYieldCount} Stellar yields and ${blendPoolCount} Blend pools`,
            priority: 1
        };
    } else if (stellarYieldCount > 0 || blendPoolCount > 0) {
        recommendations.dataQuality = {
            status: 'GOOD',
            message: 'Partial Stellar data available, may need supplementation',
            priority: 2
        };
    } else {
        recommendations.dataQuality = {
            status: 'POOR',
            message: 'Limited Stellar data detected, requires investigation',
            priority: 4
        };
    }

    // Analyze implementation feasibility
    const workingFilters = results.dashboardFiltering.filter(f => f.hasStellarData).length;

    if (workingFilters > 0) {
        recommendations.implementation = {
            status: 'READY',
            message: `${workingFilters} working chain filters found - ready for production`,
            priority: 1
        };
    } else {
        recommendations.implementation = {
            status: 'COMPLEX',
            message: 'Chain filtering not working - requires client-side filtering',
            priority: 3
        };
    }

    return recommendations;
}

// Main test execution
async function runStellarConnectivityTests() {
    console.log('🚀 Stellar-Only DeFiLlama Connectivity Test Suite');
    console.log('===============================================\n');

    // Ensure test results directory exists
    if (!fs.existsSync('./test-results')) {
        fs.mkdirSync('./test-results', { recursive: true });
    }

    const testResults = {
        startTime: new Date().toISOString(),
        testType: 'stellar-connectivity',
        description: 'Stellar-specific DeFiLlama API validation and data availability testing'
    };

    try {
        // Run Stellar-focused test suites
        testResults.endpoints = await testStellarEndpoints();
        testResults.dashboardFiltering = await testDashboardFiltering();
        testResults.blendData = await testBlendDataRetrieval();

        testResults.endTime = new Date().toISOString();

        // Generate recommendations
        testResults.recommendations = generateRecommendations(testResults);

        // Summary statistics
        testResults.summary = {
            totalTests: testResults.endpoints.length + testResults.dashboardFiltering.length + testResults.blendData.length,
            successfulEndpoints: testResults.endpoints.filter(e => e.success).length,
            workingFilters: testResults.dashboardFiltering.filter(f => f.hasStellarData).length,
            blendPoolsFound: testResults.blendData.reduce((sum, test) => sum + test.blendData.count, 0),
            stellarBlendPools: testResults.blendData.reduce((sum, test) => sum + test.blendData.stellarCount, 0),
            overallStatus: testResults.recommendations.connectivity.status
        };

    } catch (error) {
        testResults.fatalError = error.message;
        console.error('❌ Fatal error during testing:', error.message);
    }

    // Save results to file
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));

    // Print summary
    console.log('\n📊 Stellar Connectivity Summary');
    console.log('===============================');
    console.log(`Endpoint Success: ${testResults.summary?.successfulEndpoints || 0}/${testResults.summary?.totalTests || 0}`);
    console.log(`Working Filters: ${testResults.summary?.workingFilters || 0}`);
    console.log(`Blend Pools Found: ${testResults.summary?.blendPoolsFound || 0}`);
    console.log(`Stellar Blend Pools: ${testResults.summary?.stellarBlendPools || 0}`);
    console.log(`Overall Status: ${testResults.summary?.overallStatus || 'Unknown'}`);

    console.log('\n📋 Recommendations');
    console.log('===================');
    if (testResults.recommendations) {
        Object.entries(testResults.recommendations).forEach(([area, rec]) => {
            const priority = ['🟢', '🟡', '🟠', '🔴'][rec.priority - 1] || '⚪';
            console.log(`${priority} ${area.toUpperCase()}: ${rec.status} - ${rec.message}`);
        });
    }

    console.log(`\n📄 Results saved to: ${TEST_RESULTS_FILE}`);

    return testResults;
}

// Execute tests if run directly
if (require.main === module) {
    runStellarConnectivityTests()
        .then(results => {
            console.log('\n✅ Stellar connectivity tests completed successfully');
            process.exit(results.summary?.successfulEndpoints > 0 ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Stellar connectivity tests failed:', error);
            process.exit(1);
        });
}

module.exports = { runStellarConnectivityTests, httpsRequest };