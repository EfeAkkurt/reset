#!/usr/bin/env node

/**
 * Stellar Historical Data Analysis Test Script
 * Specialized for insurance risk calculations and Blend lending pool analysis
 * Complete rewrite focusing exclusively on Stellar/Blend historical data
 */

const { httpsRequest } = require('./test-stellar-connectivity.js');
const fs = require('fs');

const API_BASE = 'https://api.llama.fi';
const TEST_RESULTS_FILE = './test-results/stellar-historical-analysis.json';

// Stellar-specific configuration for historical analysis
const STELLAR_CONFIG = {
    chainId: 'stellar',
    chainName: 'Stellar',
    project: 'blend',
    symbol: 'XLM',
    supportedAssets: ['XLM', 'USDC', 'EURC'],
    // Stellar was added to DeFiLlama in Q1 2024
    estimatedStartDate: '2024-01-01'
};

// Historical data endpoints specific to Stellar
const STELLAR_HISTORICAL_ENDPOINTS = [
    {
        name: 'Stellar TVL History',
        url: `${API_BASE}/v2/historicalChainTvl/${STELLAR_CONFIG.chainId}`,
        description: 'Historical Total Value Locked for Stellar network',
        dataType: 'time_series',
        expectedFields: ['date', 'tvl']
    },
    {
        name: 'Stellar Chain Chart',
        url: `${API_BASE}/v2/chains/${STELLAR_CONFIG.chainId}/chart`,
        description: 'Stellar chain performance metrics over time',
        dataType: 'time_series',
        expectedFields: ['date', 'totalLiquidityUSD']
    },
    {
        name: 'Global TVL History',
        url: `${API_BASE}/v2/historicalChainTvl`,
        description: 'All chains historical TVL (contains Stellar data)',
        dataType: 'multi_series',
        expectedFields: ['date']
    },
    {
        name: 'Alternative Stellar Chart',
        url: `${API_BASE}/chain/${STELLAR_CONFIG.chainId}/chart`,
        description: 'Alternative Stellar chart endpoint',
        dataType: 'time_series',
        expectedFields: ['date', 'tvl']
    }
];

// Financial analysis functions
class StellarRiskAnalyzer {
    // Calculate annualized volatility from time series data
    static calculateVolatility(data, field = 'tvl') {
        if (!Array.isArray(data) || data.length < 2) {
            return { volatility: 0, confidence: 'INSUFFICIENT_DATA' };
        }

        // Extract and clean values
        const values = data
            .map(d => d[field] || d.tvl || d.totalLiquidityUSD || 0)
            .filter(v => v > 0);

        if (values.length < 2) {
            return { volatility: 0, confidence: 'NO_VALID_VALUES' };
        }

        // Calculate daily returns
        const returns = [];
        for (let i = 1; i < values.length; i++) {
            if (values[i - 1] > 0) {
                returns.push((values[i] - values[i - 1]) / values[i - 1]);
            }
        }

        if (returns.length < 2) {
            return { volatility: 0, confidence: 'INSUFFICIENT_RETURNS' };
        }

        // Calculate standard deviation of returns
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        const dailyVolatility = Math.sqrt(variance);

        // Annualize (assuming ~365 days of data)
        const annualizedVolatility = dailyVolatility * Math.sqrt(365);

        // Data quality assessment
        const dataQuality = this.assessDataQuality(data, values.length);

        return {
            volatility: annualizedVolatility,
            confidence: dataQuality.confidence,
            dataPoints: values.length,
            returnCount: returns.length,
            maxDrawdown: this.calculateMaxDrawdown(values),
            dataQuality: dataQuality
        };
    }

    // Calculate maximum drawdown
    static calculateMaxDrawdown(values) {
        if (values.length < 2) return 0;

        let maxDrawdown = 0;
        let peak = values[0];

        for (let i = 1; i < values.length; i++) {
            if (values[i] > peak) {
                peak = values[i];
            } else {
                const drawdown = (peak - values[i]) / peak;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
        }

        return maxDrawdown;
    }

    // Assess data quality and confidence
    static assessDataQuality(data, validPoints) {
        if (!Array.isArray(data)) {
            return { confidence: 'INVALID_DATA', score: 0 };
        }

        const expectedInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        let totalGap = 0;
        let gapCount = 0;

        if (data.length > 1) {
            for (let i = 1; i < data.length; i++) {
                const timeDiff = new Date(data[i].date) - new Date(data[i - 1].date);
                if (timeDiff > expectedInterval * 1.5) { // More than 1.5 days gap
                    totalGap += timeDiff;
                    gapCount++;
                }
            }
        }

        const timeSpan = data.length > 1 ?
            new Date(data[data.length - 1].date) - new Date(data[0].date) : 0;
        const expectedDataPoints = timeSpan / expectedInterval;

        const completeness = validPoints / Math.max(expectedDataPoints, 1);
        const gapPenalty = gapCount > 0 ? Math.min(0.3, gapCount / data.length) : 0;

        const qualityScore = Math.max(0, completeness - gapPenalty);

        let confidence;
        if (qualityScore >= 0.9) confidence = 'HIGH';
        else if (qualityScore >= 0.7) confidence = 'MEDIUM';
        else if (qualityScore >= 0.5) confidence = 'LOW';
        else confidence = 'VERY_LOW';

        return {
            confidence,
            score: qualityScore,
            completeness: completeness.toFixed(3),
            gapCount,
            gapPenalty: gapPenalty.toFixed(3),
            timeSpanDays: Math.round(timeSpan / (24 * 60 * 60 * 1000))
        };
    }

    // Calculate risk-adjusted metrics
    static calculateRiskMetrics(historicalData, currentPoolData = {}) {
        const volatility = this.calculateVolatility(historicalData);
        const maxDrawdown = volatility.maxDrawdown;

        // Risk score (0-100, higher = more risky)
        let riskScore = 0;

        // Volatility component (0-40 points)
        riskScore += Math.min(40, volatility.volatility * 100);

        // Maximum drawdown component (0-30 points)
        riskScore += Math.min(30, maxDrawdown * 100);

        // Data confidence component (0-20 points)
        const confidenceScores = {
            'HIGH': 0,
            'MEDIUM': 10,
            'LOW': 15,
            'VERY_LOW': 20,
            default: 25
        };
        riskScore += confidenceScores[volatility.confidence] || confidenceScores.default;

        // Current TVL component (0-10 points) - lower TVL = higher risk
        const currentTvl = currentPoolData.tvlUsd || 0;
        if (currentTvl < 50000) riskScore += 10;
        else if (currentTvl < 500000) riskScore += 7;
        else if (currentTvl < 5000000) riskScore += 4;
        else riskScore += 0;

        const riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 50 ? 'MEDIUM' : riskScore >= 30 ? 'LOW' : 'VERY_LOW';

        return {
            riskLevel,
            riskScore: Math.round(riskScore),
            components: {
                volatility: Math.round(volatility.volatility * 100) / 100,
                maxDrawdown: Math.round(maxDrawdown * 100) / 100,
                dataConfidence: volatility.confidence,
                currentTvl
            },
            insuranceRecommendations: this.generateInsuranceRecommendations(riskLevel, volatility)
        };
    }

    // Generate insurance-specific recommendations
    static generateInsuranceRecommendations(riskLevel, volatility) {
        const recommendations = [];

        if (riskLevel === 'HIGH') {
            recommendations.push({
                type: 'PREMIUM_ADJUSTMENT',
                action: 'Increase premiums by 25-50%',
                reason: 'High volatility and risk factors detected'
            });
            recommendations.push({
                type: 'COVERAGE_LIMIT',
                action: 'Limit coverage to 50% of TVL',
                reason: 'High maximum drawdown risk'
            });
            recommendations.push({
                type: 'MONITORING',
                action: 'Daily monitoring required',
                reason: 'Rapid changes in risk metrics'
            });
        } else if (riskLevel === 'MEDIUM') {
            recommendations.push({
                type: 'PREMIUM_ADJUSTMENT',
                action: 'Increase premiums by 10-25%',
                reason: 'Moderate volatility detected'
            });
            recommendations.push({
                type: 'COVERAGE_LIMIT',
                action: 'Limit coverage to 75% of TVL',
                reason: 'Medium risk profile'
            });
        } else {
            recommendations.push({
                type: 'STANDARD_COVERAGE',
                action: 'Standard coverage terms applicable',
                reason: 'Low risk profile'
            });
        }

        if (volatility.confidence !== 'HIGH') {
            recommendations.push({
                type: 'DATA_QUALITY',
                action: 'Improve data quality monitoring',
                reason: `Data confidence: ${volatility.confidence}`
            });
        }

        return recommendations;
    }
}

// Test Stellar historical data endpoints
async function testStellarHistoricalEndpoints() {
    console.log('📈 Testing Stellar historical data endpoints...');

    const results = [];

    for (const endpoint of STELLAR_HISTORICAL_ENDPOINTS) {
        try {
            console.log(`  🔍 Testing: ${endpoint.name}`);
            const startTime = Date.now();
            const response = await httpsRequest(endpoint.url);
            const responseTime = Date.now() - startTime;

            let dataAnalysis = {
                dataType: 'unknown',
                dataPoints: 0,
                timeSpan: 0,
                hasStellarData: false,
                validationResult: null
            };

            if (response.statusCode === 200) {
                if (Array.isArray(response.data)) {
                    dataAnalysis.dataType = 'array';
                    dataAnalysis.dataPoints = response.data.length;

                    if (response.data.length > 0) {
                        // Check if it's time series data
                        if (response.data[0].hasOwnProperty('date')) {
                            dataAnalysis.dataType = 'time_series';
                            const timeSpan = response.data.length > 1 ?
                                new Date(response.data[response.data.length - 1].date) - new Date(response.data[0].date) : 0;
                            dataAnalysis.timeSpan = Math.round(timeSpan / (24 * 60 * 60 * 1000)); // days
                        }

                        // Validate expected fields
                        const sample = response.data[0];
                        const hasExpectedFields = endpoint.expectedFields.every(field =>
                            sample.hasOwnProperty(field)
                        );
                        dataAnalysis.validationResult = hasExpectedFields;
                    }

                } else if (typeof response.data === 'object') {
                    dataAnalysis.dataType = 'object';

                    // Check for nested data structures
                    if (response.data.data && Array.isArray(response.data.data)) {
                        dataAnalysis.dataType = 'nested_array';
                        dataAnalysis.dataPoints = response.data.data.length;
                    }

                    // Check for Stellar-specific keys
                    const stellarKeys = Object.keys(response.data).filter(key =>
                        key.toLowerCase().includes('stellar') || key === STELLAR_CONFIG.chainId
                    );
                    dataAnalysis.hasStellarData = stellarKeys.length > 0;
                }
            }

            results.push({
                endpoint: endpoint.name,
                url: endpoint.url,
                description: endpoint.description,
                status: response.statusCode,
                responseTime: responseTime,
                dataAnalysis: dataAnalysis,
                success: response.statusCode === 200 && dataAnalysis.dataPoints > 0,
                sampleData: dataAnalysis.dataPoints > 0 ?
                    (Array.isArray(response.data) ? response.data.slice(0, 2) :
                     response.data.data ? response.data.data.slice(0, 2) : null) : null
            });

            const success = response.statusCode === 200 && dataAnalysis.dataPoints > 0;
            console.log(`    ${success ? '✅' : '❌'} ${endpoint.name}: ${dataAnalysis.dataPoints} points (${dataAnalysis.timeSpan} days)`);

        } catch (error) {
            results.push({
                endpoint: endpoint.name,
                url: endpoint.url,
                status: 'ERROR',
                error: error.message,
                dataAnalysis: { dataType: 'error', dataPoints: 0, timeSpan: 0 },
                success: false
            });
            console.log(`    ❌ ${endpoint.name}: ${error.message}`);
        }
    }

    return results;
}

// Test historical data quality and perform risk analysis
async function performHistoricalRiskAnalysis() {
    console.log('\n⚡ Performing historical risk analysis...');

    const riskAnalysisResults = [];

    // Try to get historical data from working endpoints
    const workingEndpoints = STELLAR_HISTORICAL_ENDPOINTS.filter(async (endpoint) => {
        try {
            const response = await httpsRequest(endpoint.url);
            return response.statusCode === 200 &&
                   (Array.isArray(response.data) || response.data?.data);
        } catch {
            return false;
        }
    });

    for (const endpoint of STELLAR_HISTORICAL_ENDPOINTS.slice(0, 2)) { // Test primary endpoints
        try {
            console.log(`  📊 Analyzing: ${endpoint.name}`);
            const response = await httpsRequest(endpoint.url);

            if (response.statusCode !== 200) {
                continue;
            }

            let historicalData = [];

            // Extract historical data from different response formats
            if (Array.isArray(response.data)) {
                historicalData = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                historicalData = response.data.data;
            }

            if (historicalData.length === 0) {
                console.log(`    ⚠️  No historical data available`);
                continue;
            }

            // Perform risk analysis
            const volatility = StellarRiskAnalyzer.calculateVolatility(historicalData);
            const riskMetrics = StellarRiskAnalyzer.calculateRiskMetrics(historicalData);

            const analysisResult = {
                endpoint: endpoint.name,
                url: endpoint.url,
                dataPoints: historicalData.length,
                timeSpanDays: volatility.dataQuality?.timeSpanDays || 0,
                volatility: volatility,
                riskMetrics: riskMetrics,
                dataQuality: volatility.dataQuality,
                success: true
            };

            riskAnalysisResults.push(analysisResult);

            console.log(`    ✅ Analysis complete: Risk ${riskMetrics.riskLevel} (${riskMetrics.riskScore}/100)`);
            console.log(`       Volatility: ${(volatility.volatility * 100).toFixed(2)}%`);
            console.log(`       Max Drawdown: ${(volatility.maxDrawdown * 100).toFixed(2)}%`);
            console.log(`       Data Quality: ${volatility.confidence}`);

        } catch (error) {
            console.log(`    ❌ Analysis failed: ${error.message}`);
            riskAnalysisResults.push({
                endpoint: endpoint.name,
                error: error.message,
                success: false
            });
        }
    }

    return riskAnalysisResults;
}

// Test yields historical data (if available)
async function testYieldsHistoricalData() {
    console.log('\n💰 Testing yields historical data...');

    const yieldsEndpoints = [
        `${API_BASE}/yields/history?chain=${STELLAR_CONFIG.chainId}`,
        `${API_BASE}/yields/history?project=${STELLAR_CONFIG.project}`,
        `${API_BASE}/yields/history`,
        `${YIELDS_API_BASE}/history?chain=${STELLAR_CONFIG.chainId}`,
        `${YIELDS_API_BASE}/history?project=${STELLAR_CONFIG.project}`
    ];

    const results = [];

    for (const url of yieldsEndpoints) {
        try {
            const params = url.split('?')[1] || 'no-params';
            console.log(`  🔍 Testing: ${params}`);

            const response = await httpsRequest(url);

            if (response.statusCode === 200 && response.data) {
                let dataPoints = 0;
                let stellarYields = [];

                if (Array.isArray(response.data)) {
                    stellarYields = response.data.filter(item =>
                        item.chain === STELLAR_CONFIG.chainId ||
                        item.project?.toLowerCase().includes(STELLAR_CONFIG.project)
                    );
                    dataPoints = stellarYields.length;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    stellarYields = response.data.data.filter(item =>
                        item.chain === STELLAR_CONFIG.chainId ||
                        item.project?.toLowerCase().includes(STELLAR_CONFIG.project)
                    );
                    dataPoints = stellarYields.length;
                }

                results.push({
                    url: url,
                    parameters: params,
                    status: response.statusCode,
                    dataPoints: dataPoints,
                    hasData: dataPoints > 0,
                    success: response.statusCode === 200 && dataPoints > 0,
                    sampleData: dataPoints > 0 ? stellarYields.slice(0, 2) : null
                });

                console.log(`    ${dataPoints > 0 ? '✅' : '❌'} ${params}: ${dataPoints} historical points`);

            } else {
                results.push({
                    url: url,
                    parameters: url.split('?')[1] || 'no-params',
                    status: response.statusCode,
                    dataPoints: 0,
                    hasData: false,
                    success: false
                });
                console.log(`    ❌ ${url.split('?')[1] || 'base'}: HTTP ${response.statusCode}`);
            }

        } catch (error) {
            results.push({
                url: url,
                parameters: url.split('?')[1] || 'no-params',
                error: error.message,
                dataPoints: 0,
                hasData: false,
                success: false
            });
            console.log(`    ❌ ${url.split('?')[1] || 'base'}: ${error.message}`);
        }
    }

    return results;
}

// Generate comprehensive historical analysis report
function generateHistoricalReport(results) {
    const workingEndpoints = results.endpoints?.filter(e => e.success) || [];
    const riskAnalysis = results.riskAnalysis?.filter(r => r.success) || [];
    const yieldsHistory = results.yieldsHistory?.filter(y => y.hasData) || [];

    const report = {
        historicalDataAvailability: {
            status: workingEndpoints.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
            endpoints: workingEndpoints.length,
            totalDataPoints: workingEndpoints.reduce((sum, e) => sum + (e.dataAnalysis?.dataPoints || 0), 0),
            maxTimeSpan: Math.max(...workingEndpoints.map(e => e.dataAnalysis?.timeSpan || 0))
        },
        riskAnalysisCapability: {
            status: riskAnalysis.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
            analyses: riskAnalysis.length,
            averageRiskScore: riskAnalysis.length > 0 ?
                (riskAnalysis.reduce((sum, r) => sum + r.riskMetrics.riskScore, 0) / riskAnalysis.length).toFixed(1) : 0,
            riskDistribution: riskAnalysis.reduce((dist, r) => {
                dist[r.riskMetrics.riskLevel] = (dist[r.riskMetrics.riskLevel] || 0) + 1;
                return dist;
            }, {})
        },
        yieldsHistoricalData: {
            status: yieldsHistory.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
            endpoints: yieldsHistory.length,
            totalHistoricalPoints: yieldsHistory.reduce((sum, y) => sum + y.dataPoints, 0)
        }
    };

    // Generate implementation recommendations
    report.recommendations = [];

    if (report.historicalDataAvailability.status === 'AVAILABLE') {
        report.recommendations.push({
            priority: 1,
            category: 'Data Pipeline',
            message: `${workingEndpoints.length} historical endpoints available for analysis`
        });
    } else {
        report.recommendations.push({
            priority: 4,
            category: 'Data Pipeline',
            message: 'No historical data endpoints available - requires alternative data sources'
        });
    }

    if (report.riskAnalysisCapability.status === 'AVAILABLE') {
        report.recommendations.push({
            priority: 1,
            category: 'Risk Analysis',
            message: `Risk analysis functional with ${report.riskAnalysisCapability.analyses} data sources`
        });
    }

    if (report.yieldsHistoricalData.status === 'AVAILABLE') {
        report.recommendations.push({
            priority: 2,
            category: 'Insurance Calculations',
            message: 'Historical yields data available for premium calculations'
        });
    } else {
        report.recommendations.push({
            priority: 3,
            category: 'Insurance Calculations',
            message: 'Consider alternative data sources for historical yields'
        });
    }

    return report;
}

// Main historical analysis test
async function runStellarHistoricalAnalysis() {
    console.log('🚀 Stellar Historical Analysis Test Suite');
    console.log('=======================================\n');

    // Ensure test results directory exists
    if (!fs.existsSync('./test-results')) {
        fs.mkdirSync('./test-results', { recursive: true });
    }

    const testResults = {
        startTime: new Date().toISOString(),
        testType: 'stellar-historical-analysis',
        description: 'Stellar historical data analysis for insurance risk calculations'
    };

    try {
        // Run all test suites
        testResults.endpoints = await testStellarHistoricalEndpoints();
        testResults.riskAnalysis = await performHistoricalRiskAnalysis();
        testResults.yieldsHistory = await testYieldsHistoricalData();

        testResults.endTime = new Date().toISOString();

        // Generate comprehensive report
        testResults.report = generateHistoricalReport(testResults);

        // Summary statistics
        testResults.summary = {
            endpointsTested: STELLAR_HISTORICAL_ENDPOINTS.length,
            workingEndpoints: testResults.endpoints.filter(e => e.success).length,
            riskAnalysesCompleted: testResults.riskAnalysis.filter(r => r.success).length,
            yieldsHistoryEndpoints: testResults.yieldsHistory.filter(y => y.hasData).length,
            totalDataPoints: testResults.endpoints.reduce((sum, e) => sum + (e.dataAnalysis?.dataPoints || 0), 0),
            maxTimeSpan: Math.max(...testResults.endpoints.map(e => e.dataAnalysis?.timeSpan || 0)),
            readyForInsurance: testResults.report.riskAnalysisCapability.status === 'AVAILABLE' &&
                              testResults.report.historicalDataAvailability.status === 'AVAILABLE'
        };

    } catch (error) {
        testResults.fatalError = error.message;
        console.error('❌ Fatal error during historical analysis:', error.message);
    }

    // Save results to file
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));

    // Print summary
    console.log('\n📊 Historical Analysis Summary');
    console.log('===============================');
    console.log(`Endpoints Tested: ${testResults.summary?.endpointsTested || 0}`);
    console.log(`Working Endpoints: ${testResults.summary?.workingEndpoints || 0}`);
    console.log(`Risk Analyses: ${testResults.summary?.riskAnalysesCompleted || 0}`);
    console.log(`Total Data Points: ${testResults.summary?.totalDataPoints || 0}`);
    console.log(`Max Time Span: ${testResults.summary?.maxTimeSpan || 0} days`);
    console.log(`Ready for Insurance: ${testResults.summary?.readyForInsurance ? '✅ YES' : '❌ NO'}`);

    if (testResults.report?.recommendations) {
        console.log('\n📋 Analysis Recommendations');
        console.log('============================');
        testResults.report.recommendations.forEach((rec, index) => {
            const priority = ['🟢', '🟡', '🟠', '🔴'][rec.priority - 1] || '⚪';
            console.log(`${priority} ${rec.category}: ${rec.message}`);
        });
    }

    console.log(`\n📄 Results saved to: ${TEST_RESULTS_FILE}`);

    return testResults;
}

// Execute tests if run directly
if (require.main === module) {
    runStellarHistoricalAnalysis()
        .then(results => {
            const exitCode = results.summary?.readyForInsurance ? 0 : 1;
            console.log(`\n${results.summary?.readyForInsurance ? '✅' : '❌'} Historical analysis completed`);
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('\n❌ Historical analysis failed:', error);
            process.exit(1);
        });
}

module.exports = { runStellarHistoricalAnalysis, StellarRiskAnalyzer };