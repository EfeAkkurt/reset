#!/bin/bash

# Stellar DeFiLlama Test Suite Runner
# Comprehensive testing script for Stellar-only integration
# Refactored to focus exclusively on Stellar/Blend protocol
# Created: November 29, 2025

set -e

echo "🚀 Stellar DeFiLlama Test Suite"
echo "==============================="
echo "Testing Stellar blockchain and Blend protocol integration on DeFiLlama"
echo "This will test Stellar-specific connectivity, yields integration, and risk analysis"
echo ""

# Create test results directory if it doesn't exist
mkdir -p test-results
mkdir -p logs

# Function to run a test and capture output
run_test() {
    local test_name="$1"
    local script_path="$2"
    local log_file="logs/${test_name}.log"

    echo ""
    echo "🔬 Running: $test_name"
    echo "======================"
    echo "Logging to: $log_file"
    echo ""

    # Run the test and capture output
    if node "$script_path" 2>&1 | tee "$log_file"; then
        echo "✅ $test_name completed successfully"
        echo "📄 Log saved to: $log_file"
        return 0
    else
        echo "❌ $test_name failed"
        echo "📄 Check log: $log_file"
        return 1
    fi
}

# Function to check if Node.js is available
check_dependencies() {
    echo "🔍 Checking dependencies..."

    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed or not in PATH"
        echo "Please install Node.js to run these tests"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo "⚠️  npm not found, but tests may still work"
    fi

    echo "✅ Dependencies check passed"
    echo "Node.js version: $(node --version)"
}

# Function to create summary report
create_summary_report() {
    echo ""
    echo "📊 Generating Test Summary Report..."
    echo "=================================="

    local summary_file="test-results/test-suite-summary.json"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

    # Check if each test was successful
    local connection_success=false
    local discovery_success=false
    local historical_success=false

    if [ -f "test-results/stellar-connectivity.json" ]; then
        local connection_data=$(cat test-results/stellar-connectivity.json)
        if echo "$connection_data" | grep -q '"overallStatus": "EXCELLENT"\|"overallStatus": "GOOD"'; then
            connection_success=true
        fi
    fi

    if [ -f "test-results/stellar-yields-integration.json" ]; then
        local discovery_data=$(cat test-results/stellar-yields-integration.json)
        if echo "$discovery_data" | grep -q '"readyForProduction": true'; then
            discovery_success=true
        fi
    fi

    if [ -f "test-results/stellar-historical-analysis.json" ]; then
        local historical_data=$(cat test-results/stellar-historical-analysis.json)
        if echo "$historical_data" | grep -q '"readyForInsurance": true\|"readyForInsurance": true'; then
            historical_success=true
        fi
    fi

    # Create summary JSON
    cat > "$summary_file" << EOF
{
  "testSuite": "Stellar DeFiLlama Integration Tests",
  "timestamp": "$timestamp",
  "environment": {
    "nodeVersion": "$(node --version)",
    "platform": "$(uname -s)",
    "arch": "$(uname -m)"
  },
  "testResults": {
    "stellarConnectivity": {
      "name": "Stellar Connectivity Tests",
      "status": "$connection_success",
      "resultsFile": "stellar-connectivity.json",
      "logFile": "logs/stellar-connectivity.log"
    },
    "stellarYieldsIntegration": {
      "name": "Stellar Yields Integration Tests",
      "status": "$discovery_success",
      "resultsFile": "stellar-yields-integration.json",
      "logFile": "logs/stellar-yields-integration.log"
    },
    "stellarHistoricalAnalysis": {
      "name": "Stellar Historical Analysis Tests",
      "status": "$historical_success",
      "resultsFile": "stellar-historical-analysis.json",
      "logFile": "logs/stellar-historical-analysis.log"
    }
  },
  "overallStatus": "$([ "$connection_success" = true ] && [ "$discovery_success" = true ] && [ "$historical_success" = true ] && echo "SUCCESS" || echo "PARTIAL")",
  "recommendations": {
    "implementation": "$([ "$connection_success" = true ] && [ "$discovery_success" = true ] && echo "Ready for full implementation" || echo "Need alternative data sources")",
    "nextSteps": [
      "Review Stellar test results in test-results/",
      "Check stellar-connectivity.json for API status",
      "Verify stellar-yields-integration.json for production readiness",
      "Review stellar-historical-analysis.json for insurance capabilities",
      "Implement Stellar data service using integration guide"
    ]
  },
  "generatedFiles": {
    "testResults": $(ls test-results/stellar-*.json 2>/dev/null | wc -l),
    "logs": $(ls logs/stellar-*.log 2>/dev/null | wc -l),
    "documentation": "$([ -f "claudedocs/stellar-defillama-integration-guide.md" ] && echo "Stellar Integration Guide Available" || echo "Documentation Missing")"
  }
}
EOF

    echo "✅ Summary report created: $summary_file"
}

# Function to display final results
display_final_results() {
    echo ""
    echo "🎉 Test Suite Complete"
    echo "======================"
    echo ""

    # Display summary from JSON if available
    if [ -f "test-results/test-suite-summary.json" ]; then
        local overall_status=$(cat test-results/test-suite-summary.json | grep -o '"overallStatus": "[^"]*"' | cut -d'"' -f4)

        case $overall_status in
            "SUCCESS")
                echo "🟢 Overall Status: SUCCESS - All tests passed and data is available"
                ;;
            "PARTIAL")
                echo "🟡 Overall Status: PARTIAL - Some tests passed, review results for limitations"
                ;;
            *)
                echo "🔴 Overall Status: FAILED - Tests encountered issues"
                ;;
        esac
    fi

    echo ""
    echo "📁 Generated Files:"
    echo "-------------------"

    if [ -d "test-results" ]; then
        echo "Test Results:"
        ls -la test-results/*.json 2>/dev/null | sed 's/^/  /' || echo "  No test result files found"
    fi

    if [ -d "logs" ]; then
        echo ""
        echo "Log Files:"
        ls -la logs/*.log 2>/dev/null | sed 's/^/  /' || echo "  No log files found"
    fi

    echo ""
    echo "📋 Next Steps:"
    echo "-------------"
    echo "1. Review test results in test-results/ directory"
    echo "2. Check stellar-blend-discovery.json for Stellar/Blend support"
    echo "3. Review historical-data-test.json for risk analysis capabilities"
    echo "4. Use generated implementation code if available"
    echo "5. Consider backup data sources if DeFiLlama coverage is limited"
}

# Main execution
main() {
    echo "Starting DeFiLlama API test suite..."
    echo ""

    # Check dependencies
    check_dependencies

    # Track overall success
    local failed_tests=0

    # Run tests in sequence
    echo "Running test suite..."
    echo ""

    # Test 1: Stellar connectivity (refactored from generic tests)
    if ! run_test "stellar-connectivity" "scripts/test-stellar-connectivity.js"; then
        ((failed_tests++))
    fi

    # Test 2: Stellar yields integration (production-ready Blend data)
    if ! run_test "stellar-yields-integration" "scripts/test-stellar-yields-integration.js"; then
        ((failed_tests++))
    fi

    # Test 3: Stellar historical analysis (insurance risk calculations)
    if ! run_test "stellar-historical-analysis" "scripts/test-stellar-historical-analysis.js"; then
        ((failed_tests++))
    fi

    # Create summary report
    create_summary_report

    # Display final results
    display_final_results

    # Exit with appropriate code
    if [ $failed_tests -eq 0 ]; then
        echo ""
        echo "🎊 All tests completed successfully!"
        exit 0
    else
        echo ""
        echo "⚠️  $failed_tests test(s) encountered issues"
        echo "Check the logs for detailed error information"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "DeFiLlama API Test Suite Runner"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --clean        Clean test results and logs before running"
        echo "  --connection   Run only Stellar connectivity tests"
        echo "  --yields       Run only Stellar yields integration tests"
        echo "  --historical   Run only Stellar historical analysis tests"
        echo ""
        echo "This script tests:"
        echo "  - Stellar-specific API connectivity"
        echo "  - Blend protocol yields integration"
        echo "  - Historical data for insurance risk analysis"
        echo "  - Production-ready data retrieval and validation"
        echo ""
        exit 0
        ;;
    --clean)
        echo "🧹 Cleaning test results and logs..."
        rm -rf test-results/
        rm -rf logs/
        echo "✅ Clean completed"
        exit 0
        ;;
    --connection)
        check_dependencies
        run_test "stellar-connectivity" "scripts/test-stellar-connectivity.js"
        exit $?
        ;;
    --yields)
        check_dependencies
        run_test "stellar-yields-integration" "scripts/test-stellar-yields-integration.js"
        exit $?
        ;;
    --historical)
        check_dependencies
        run_test "stellar-historical-analysis" "scripts/test-stellar-historical-analysis.js"
        exit $?
        ;;
    "")
        # No arguments - run all tests
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac