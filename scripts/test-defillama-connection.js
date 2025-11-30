#!/usr/bin/env node

/**
 * DeFiLlama API Connection Test Script
 * Tests basic API connectivity and endpoint availability
 */

const https = require('https');
const fs = require('fs');

const API_BASE = 'https://api.llama.fi';
const TEST_RESULTS_FILE = './test-results/api-connection-test.json';

// Utility function for HTTP requests
function httpsRequest(url) {
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
                        headers: response.headers
                    });
                } catch (error) {
                    resolve({
                        statusCode: response.statusCode,
                        data: data,
                        error: 'JSON Parse Error'
                    });
                }
            });
        });

        request.on('error', (error) => {
            reject(error);
        });

        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Test basic API connectivity
async function testBasicConnectivity() {
    console.log('🔌 Testing DeFiLlama API basic connectivity...');

    const tests = [
        {
            name: 'Base URL Test',
            url: API_BASE,
            description: 'Test if base API URL is accessible'
        },
        {
            name: 'Protocols Endpoint',
            url: `${API_BASE}/protocols`,
            description: 'Test protocols endpoint availability'
        },
        {
            name: 'Chains Endpoint',
            url: `${API_BASE}/chains`,
            description: 'Test chains endpoint availability'
        },
        {
            name: 'Yields Endpoint',
            url: `${API_BASE}/yields`,
            description: 'Test yields endpoint availability'
        }
    ];

    const results = [];

    for (const test of tests) {
        try {
            console.log(`  📡 Testing: ${test.name}`);
            const startTime = Date.now();
            const response = await httpsRequest(test.url);
            const responseTime = Date.now() - startTime;

            results.push({
                test: test.name,
                url: test.url,
                description: test.description,
                status: 'SUCCESS',
                statusCode: response.statusCode,
                responseTime: responseTime,
                dataSize: JSON.stringify(response.data).length,
                timestamp: new Date().toISOString()
            });

            console.log(`    ✅ ${test.name}: ${response.statusCode} (${responseTime}ms)`);

        } catch (error) {
            results.push({
                test: test.name,
                url: test.url,
                description: test.description,
                status: 'FAILED',
                error: error.message,
                timestamp: new Date().toISOString()
            });

            console.log(`    ❌ ${test.name}: ${error.message}`);
        }
    }

    return results;
}

// Test rate limiting behavior
async function testRateLimiting() {
    console.log('\n⏱️  Testing rate limiting behavior...');

    const url = `${API_BASE}/chains`;
    const requests = [];
    const startTime = Date.now();

    // Send 10 rapid requests to test rate limiting
    for (let i = 0; i < 10; i++) {
        requests.push(
            httpsRequest(url).then(response => ({
                requestNumber: i + 1,
                statusCode: response.statusCode,
                timestamp: Date.now() - startTime
            }))
        );
    }

    try {
        const results = await Promise.all(requests);
        const successCount = results.filter(r => r.statusCode === 200).length;
        const rateLimited = results.some(r => r.statusCode === 429);

        console.log(`  📊 Results: ${successCount}/10 successful`);

        if (rateLimited) {
            console.log('  ⚠️  Rate limiting detected (429 status codes)');
        } else {
            console.log('  ✅ No rate limiting detected for 10 rapid requests');
        }

        return {
            totalRequests: 10,
            successful: successCount,
            rateLimited: rateLimited,
            results: results
        };

    } catch (error) {
        console.log(`  ❌ Rate limiting test failed: ${error.message}`);
        return { error: error.message };
    }
}

// Test data format validation
async function testDataFormat() {
    console.log('\n📋 Testing data format validation...');

    const formatTests = [
        {
            name: 'Chains Format',
            url: `${API_BASE}/chains`,
            validator: (data) => {
                return Array.isArray(data) && data.length > 0 &&
                       data[0].hasOwnProperty('gecko_id') &&
                       data[0].hasOwnProperty('name');
            }
        },
        {
            name: 'Protocols Format',
            url: `${API_BASE}/protocols`,
            validator: (data) => {
                return Array.isArray(data) && data.length > 0 &&
                       data[0].hasOwnProperty('name') &&
                       data[0].hasOwnProperty('chains');
            }
        },
        {
            name: 'Yields Format',
            url: `${API_BASE}/yields`,
            validator: (data) => {
                return Array.isArray(data) && data.length > 0 &&
                       data[0].hasOwnProperty('chain') &&
                       data[0].hasOwnProperty('apy');
            }
        }
    ];

    const results = [];

    for (const test of formatTests) {
        try {
            console.log(`  🔍 Testing: ${test.name}`);
            const response = await httpsRequest(test.url);

            if (response.statusCode === 200) {
                const isValid = test.validator(response.data);

                results.push({
                    test: test.name,
                    status: isValid ? 'VALID' : 'INVALID',
                    dataSample: Array.isArray(response.data) ? response.data.slice(0, 2) : response.data
                });

                console.log(`    ${isValid ? '✅' : '❌'} ${test.name}: ${isValid ? 'Valid format' : 'Invalid format'}`);
            } else {
                results.push({
                    test: test.name,
                    status: 'ERROR',
                    statusCode: response.statusCode
                });
                console.log(`    ❌ ${test.name}: HTTP ${response.statusCode}`);
            }

        } catch (error) {
            results.push({
                test: test.name,
                status: 'FAILED',
                error: error.message
            });
            console.log(`    ❌ ${test.name}: ${error.message}`);
        }
    }

    return results;
}

// Main test execution
async function runTests() {
    console.log('🚀 DeFiLlama API Connection Test Suite');
    console.log('=====================================\n');

    // Ensure test results directory exists
    if (!fs.existsSync('./test-results')) {
        fs.mkdirSync('./test-results', { recursive: true });
    }

    const testResults = {
        startTime: new Date().toISOString(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform
        }
    };

    try {
        // Run all test suites
        testResults.connectivity = await testBasicConnectivity();
        testResults.rateLimiting = await testRateLimiting();
        testResults.dataFormat = await testDataFormat();

        testResults.endTime = new Date().toISOString();
        testResults.summary = {
            totalTests: testResults.connectivity.length + testResults.dataFormat.length,
            connectivityPassed: testResults.connectivity.filter(t => t.status === 'SUCCESS').length,
            formatPassed: testResults.dataFormat.filter(t => t.status === 'VALID').length,
            rateLimitingDetected: testResults.rateLimiting.rateLimited || false
        };

    } catch (error) {
        testResults.fatalError = error.message;
    }

    // Save results to file
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));

    // Print summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log(`Connectivity: ${testResults.summary?.connectivityPassed || 0}/${testResults.summary?.totalTests || 0} passed`);
    console.log(`Data Format: ${testResults.summary?.formatPassed || 0} valid`);
    console.log(`Rate Limiting: ${testResults.summary?.rateLimitingDetected ? 'Detected' : 'Not detected'}`);
    console.log(`\n📄 Results saved to: ${TEST_RESULTS_FILE}`);

    return testResults;
}

// Execute tests if run directly
if (require.main === module) {
    runTests()
        .then(results => {
            console.log('\n✅ All tests completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { runTests, httpsRequest };