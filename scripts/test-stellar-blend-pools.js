#!/usr/bin/env node

/**
 * Stellar Blend Pools Discovery Test Script
 * Tests DeFiLlama API for Stellar and Blend protocol support
 */

const { httpsRequest } = require('./test-defillama-connection.js');
const fs = require('fs');

const API_BASE = 'https://api.llama.fi';
const STELLAR_TEST_FILE = './test-results/stellar-blend-discovery.json';

// Test different Stellar chain identifiers
const STELLAR_VARIANTS = [
    'stellar',     // Official lowercase name
    'Stellar',     // Capitalized version
    'STELLAR',     // All caps
    'xlm',         // Asset symbol
    'XLM',         // Asset symbol capitalized
    'stellar-network' // Alternative name
];

// Test different Blend project identifiers
const BLEND_VARIANTS = [
    'blend',                    // Direct name
    'blend-protocol',          // With dash
    'blend_protocol',          // With underscore
    'blend-stellar',           // Chain-specific
    'blend-lending',           // Protocol type
    'blend-finance',           // Alternative name
    'stellar-blend'            // Chain-first name
];

// Test chain and project combinations
async function testStellarChainSupport() {
    console.log('🌟 Testing Stellar chain support...');

    const results = [];

    for (const variant of STELLAR_VARIANTS) {
        try {
            console.log(`  🔍 Testing chain: ${variant}`);
            const startTime = Date.now();

            // Test with pools endpoint
            const poolsResponse = await httpsRequest(`${API_BASE}/pools?chain=${variant}&limit=10`);

            // Test with chains endpoint
            const chainsResponse = await httpsRequest(`${API_BASE}/chains`);

            const responseTime = Date.now() - startTime;
            let chainSupported = false;
            let poolCount = 0;

            // Check if chain exists in chains list
            if (chainsResponse.statusCode === 200 && Array.isArray(chainsResponse.data)) {
                const foundChain = chainsResponse.data.find(chain =>
                    chain.name?.toLowerCase() === variant.toLowerCase() ||
                    chain.gecko_id?.toLowerCase() === variant.toLowerCase() ||
                    chain.chainId?.toLowerCase() === variant.toLowerCase()
                );
                chainSupported = !!foundChain;
            }

            // Check for pools
            if (poolsResponse.statusCode === 200 && Array.isArray(poolsResponse.data)) {
                poolCount = poolsResponse.data.length;
            }

            const result = {
                chainIdentifier: variant,
                poolsStatus: poolsResponse.statusCode,
                poolCount: poolCount,
                chainFoundInList: chainSupported,
                responseTime: responseTime,
                hasData: poolCount > 0,
                samplePools: poolCount > 0 ? poolsResponse.data.slice(0, 3) : []
            };

            results.push(result);

            console.log(`    ${poolCount > 0 ? '✅' : '❌'} ${variant}: ${poolCount} pools, Chain in list: ${chainSupported}`);

        } catch (error) {
            results.push({
                chainIdentifier: variant,
                error: error.message,
                hasData: false
            });
            console.log(`    ❌ ${variant}: ${error.message}`);
        }
    }

    return results;
}

// Test Blend project support
async function testBlendProjectSupport() {
    console.log('\n🏦 Testing Blend project support...');

    const results = [];

    for (const variant of BLEND_VARIANTS) {
        try {
            console.log(`  🔍 Testing project: ${variant}`);
            const startTime = Date.now();

            // Test pools for this project
            const poolsResponse = await httpsRequest(`${API_BASE}/pools?project=${variant}&limit=10`);

            // Test protocols endpoint
            const protocolsResponse = await httpsRequest(`${API_BASE}/protocols`);

            const responseTime = Date.now() - startTime;
            let projectFound = false;
            let poolCount = 0;

            // Check if project exists in protocols list
            if (protocolsResponse.statusCode === 200 && Array.isArray(protocolsResponse.data)) {
                const foundProject = protocolsResponse.data.find(protocol =>
                    protocol.name?.toLowerCase() === variant.toLowerCase() ||
                    protocol.slug?.toLowerCase() === variant.toLowerCase()
                );
                projectFound = !!foundProject;
            }

            // Check for pools
            if (poolsResponse.statusCode === 200 && Array.isArray(poolsResponse.data)) {
                poolCount = poolsResponse.data.length;
            }

            const result = {
                projectIdentifier: variant,
                poolsStatus: poolsResponse.statusCode,
                poolCount: poolCount,
                projectFoundInList: projectFound,
                responseTime: responseTime,
                hasData: poolCount > 0,
                samplePools: poolCount > 0 ? poolsResponse.data.slice(0, 3) : []
            };

            results.push(result);

            console.log(`    ${poolCount > 0 ? '✅' : '❌'} ${variant}: ${poolCount} pools, Project in list: ${projectFound}`);

        } catch (error) {
            results.push({
                projectIdentifier: variant,
                error: error.message,
                hasData: false
            });
            console.log(`    ❌ ${variant}: ${error.message}`);
        }
    }

    return results;
}

// Test combined chain and project filtering
async function testCombinedFilters() {
    console.log('\n🔗 Testing combined chain and project filters...');

    const results = [];
    const successfulChains = STELLAR_VARIANTS; // We'll test with variants that might work
    const successfulProjects = BLEND_VARIANTS;

    for (const chain of successfulChains) {
        for (const project of successfulProjects) {
            try {
                console.log(`  🔍 Testing: chain=${chain}&project=${project}`);

                const response = await httpsRequest(`${API_BASE}/pools?chain=${chain}&project=${project}&limit=5`);

                const result = {
                    chain: chain,
                    project: project,
                    statusCode: response.statusCode,
                    poolCount: Array.isArray(response.data) ? response.data.length : 0,
                    hasData: Array.isArray(response.data) && response.data.length > 0,
                    samplePools: Array.isArray(response.data) ? response.data.slice(0, 2) : []
                };

                results.push(result);

                console.log(`    ${result.hasData ? '✅' : '❌'} ${chain}/${project}: ${result.poolCount} pools`);

            } catch (error) {
                results.push({
                    chain: chain,
                    project: project,
                    error: error.message,
                    hasData: false
                });
                console.log(`    ❌ ${chain}/${project}: ${error.message}`);
            }
        }
    }

    return results;
}

// Test yield-specific endpoints for Stellar
async function testYieldsEndpoints() {
    console.log('\n💰 Testing yields endpoints for Stellar...');

    const results = [];

    // Test main yields endpoint
    try {
        console.log('  📊 Testing main yields endpoint...');
        const yieldsResponse = await httpsRequest(`${API_BASE}/yields`);

        let stellarYields = [];
        if (yieldsResponse.statusCode === 200 && Array.isArray(yieldsResponse.data)) {
            stellarYields = yieldsResponse.data.filter(pool =>
                pool.chain?.toLowerCase().includes('stellar') ||
                pool.symbol?.toLowerCase().includes('blend')
            );
        }

        results.push({
            endpoint: 'yields',
            totalYields: Array.isArray(yieldsResponse.data) ? yieldsResponse.data.length : 0,
            stellarPools: stellarYields.length,
            stellarYields: stellarYields.slice(0, 3)
        });

        console.log(`    Found ${stellarYields.length} Stellar-related pools in yields`);

    } catch (error) {
        results.push({
            endpoint: 'yields',
            error: error.message
        });
        console.log(`    ❌ Yields endpoint error: ${error.message}`);
    }

    return results;
}

// Search for lending protocols (Blend is a lending protocol)
async function searchLendingProtocols() {
    console.log('\n🔍 Searching for lending protocols on Stellar...');

    try {
        console.log('  📡 Fetching all pools...');
        const poolsResponse = await httpsRequest(`${API_BASE}/pools?limit=1000`);

        let stellarLendingPools = [];
        let blendPools = [];

        if (poolsResponse.statusCode === 200 && Array.isArray(poolsResponse.data)) {
            // Filter for Stellar pools
            stellarLendingPools = poolsResponse.data.filter(pool =>
                pool.chain?.toLowerCase().includes('stellar') ||
                pool.project?.toLowerCase().includes('stellar')
            );

            // Search for Blend across all chains
            blendPools = poolsResponse.data.filter(pool =>
                pool.project?.toLowerCase().includes('blend') ||
                pool.symbol?.toLowerCase().includes('blend')
            );
        }

        return {
            totalPools: Array.isArray(poolsResponse.data) ? poolsResponse.data.length : 0,
            stellarPools: stellarLendingPools.length,
            stellarLendingPools: stellarLendingPools.slice(0, 5),
            blendPoolsFound: blendPools.length,
            blendPools: blendPools.slice(0, 5),
            blendChains: [...new Set(blendPools.map(p => p.chain).filter(Boolean))]
        };

    } catch (error) {
        return { error: error.message };
    }
}

// Main test execution
async function runStellarBlendTests() {
    console.log('🚀 Stellar Blend Pools Discovery Test');
    console.log('=====================================\n');

    // Ensure test results directory exists
    if (!fs.existsSync('./test-results')) {
        fs.mkdirSync('./test-results', { recursive: true });
    }

    const testResults = {
        startTime: new Date().toISOString(),
        description: 'DeFiLlama API Stellar and Blend protocol discovery tests'
    };

    try {
        // Run all test suites
        testResults.stellarChainSupport = await testStellarChainSupport();
        testResults.blendProjectSupport = await testBlendProjectSupport();
        testResults.combinedFilters = await testCombinedFilters();
        testResults.yieldsEndpoints = await testYieldsEndpoints();
        testResults.lendingProtocolSearch = await searchLendingProtocols();

        testResults.endTime = new Date().toISOString();

        // Analyze results
        testResults.analysis = {
            stellarSupported: testResults.stellarChainSupport.some(r => r.hasData),
            blendSupported: testResults.blendProjectSupport.some(r => r.hasData),
            stellarPoolCount: testResults.stellarChainSupport.reduce((sum, r) => sum + (r.poolCount || 0), 0),
            blendPoolCount: testResults.blendProjectSupport.reduce((sum, r) => sum + (r.poolCount || 0), 0),
            stellarIdentifiers: testResults.stellarChainSupport.filter(r => r.hasData).map(r => r.chainIdentifier),
            blendIdentifiers: testResults.blendProjectSupport.filter(r => r.hasData).map(r => r.projectIdentifier),
            recommendation: generateRecommendation(testResults)
        };

    } catch (error) {
        testResults.fatalError = error.message;
    }

    // Save results to file
    fs.writeFileSync(STELLAR_TEST_FILE, JSON.stringify(testResults, null, 2));

    // Print summary
    console.log('\n📊 Discovery Summary');
    console.log('====================');
    console.log(`Stellar Support: ${testResults.analysis?.stellarSupported ? '✅ Found' : '❌ Not detected'}`);
    console.log(`Blend Support: ${testResults.analysis?.blendSupported ? '✅ Found' : '❌ Not detected'}`);
    console.log(`Total Stellar Pools: ${testResults.analysis?.stellarPoolCount || 0}`);
    console.log(`Total Blend Pools: ${testResults.analysis?.blendPoolCount || 0}`);

    if (testResults.analysis?.stellarIdentifiers.length > 0) {
        console.log(`Working Stellar Identifiers: ${testResults.analysis.stellarIdentifiers.join(', ')}`);
    }

    if (testResults.analysis?.blendIdentifiers.length > 0) {
        console.log(`Working Blend Identifiers: ${testResults.analysis.blendIdentifiers.join(', ')}`);
    }

    console.log('\n📋 Recommendation');
    console.log('================');
    console.log(testResults.analysis?.recommendation || 'Unable to generate recommendation');

    console.log(`\n📄 Results saved to: ${STELLAR_TEST_FILE}`);

    return testResults;
}

// Generate recommendation based on test results
function generateRecommendation(results) {
    const stellarSupported = results.stellarChainSupport.some(r => r.hasData);
    const blendSupported = results.blendProjectSupport.some(r => r.hasData);
    const lendingResults = results.lendingProtocolSearch;

    if (stellarSupported && blendSupported) {
        return '✅ DEFAILLAMA READY: Both Stellar and Blend are supported. Use discovered identifiers for production implementation.';
    } else if (stellarSupported && !blendSupported) {
        return '⚠️  PARTIAL SUPPORT: Stellar is supported but Blend is not indexed. Consider using direct Blend protocol APIs.';
    } else if (!stellarSupported && blendSupported) {
        return '⚠️  UNEXPECTED: Blend found but Stellar not supported. Verify chain identification and investigate data consistency.';
    } else if (lendingResults.stellarPools > 0) {
        return '🔍 LIMITED SUPPORT: Found Stellar pools but not in expected structure. Use manual filtering and consider alternative data sources.';
    } else {
        return '❌ NO SUPPORT: Neither Stellar nor Blend found on DeFiLlama. Use direct protocol APIs or alternative analytics platforms.';
    }
}

// Execute tests if run directly
if (require.main === module) {
    runStellarBlendTests()
        .then(results => {
            console.log('\n✅ Discovery tests completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Discovery tests failed:', error);
            process.exit(1);
        });
}

module.exports = { runStellarBlendTests };