"use client";

import React, { useState } from "react";
import { useDirectYieldDemo } from "@/hooks/useDirectYieldDemo";
import { useDirectInsurance } from "@/hooks/useDirectInsurance";
import { useStellarWallet } from "@/components/providers/StellarWalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DirectContractDemo() {
  const { address, connect, disconnect } = useStellarWallet();
  const { deposit: directDeposit, state: depositState, pending: depositPending } = useDirectYieldDemo();
  const { createPolicy: directCreatePolicy, state: insuranceState, pending: insurancePending } = useDirectInsurance();

  const [depositAmount, setDepositAmount] = useState("1000");
  const [insurancePercentage, setInsurancePercentage] = useState(5);
  const [coverageAmount, setCoverageAmount] = useState("2000");
  const [premiumAmount, setPremiumAmount] = useState("20");

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    const insurancePct = parseInt(insurancePercentage);

    if (isNaN(amount) || isNaN(insurancePct) || amount <= 0 || insurancePct < 0 || insurancePct > 100) {
      alert("Please enter valid amounts");
      return;
    }

    await directDeposit(amount, insurancePct);
  };

  const handleCreatePolicy = async () => {
    const coverage = parseFloat(coverageAmount);
    const premium = parseFloat(premiumAmount);

    if (isNaN(coverage) || isNaN(premium) || coverage <= 0 || premium <= 0) {
      alert("Please enter valid amounts");
      return;
    }

    await directCreatePolicy(coverage, premium);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🎪 Direct Stellar Contract Demo</h1>
        <p className="text-muted-foreground">
          Bypass unreliable SDK with direct contract signing using 2025 best practices
        </p>
      </div>

      {/* Wallet Connection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>
            Connect your Stellar wallet to interact with contracts directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {address ? (
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  <strong>Connected:</strong> {address.slice(0, 8)}...{address.slice(-4)}
                </p>
              </div>
              <Button onClick={disconnect} variant="outline" className="w-full">
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <Button onClick={connect} className="w-full">
              Connect Stellar Wallet
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Yield Aggregator Demo */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🏦 Yield Aggregator</CardTitle>
          <CardDescription>
            Deposit funds with optional insurance coverage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Deposit Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="1000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={!address || depositPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance-pct">Insurance %</Label>
              <Input
                id="insurance-pct"
                type="number"
                placeholder="5"
                min="0"
                max="100"
                value={insurancePercentage}
                onChange={(e) => setInsurancePercentage(e.target.value)}
                disabled={!address || depositPending}
              />
            </div>
          </div>

          {depositState?.txHash && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                <strong>Previous Deposit:</strong> {depositState.txHash.slice(0, 16)}...
              </p>
              <p className="text-xs text-green-600">
                Amount: {depositState.amount} | Insurance: {depositState.insurancePct}%
              </p>
            </div>
          )}

          <Button
            onClick={handleDeposit}
            disabled={!address || depositPending}
            className="w-full"
          >
            {depositPending ? "Processing..." : "🏦 Deposit Funds"}
          </Button>
        </CardContent>
      </Card>

      {/* Insurance Demo */}
      <Card>
        <CardHeader>
          <CardTitle>🛡️ Insurance</CardTitle>
          <CardDescription>
            Create insurance policy for coverage protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coverage-amount">Coverage Amount</Label>
              <Input
                id="coverage-amount"
                type="number"
                placeholder="2000"
                value={coverageAmount}
                onChange={(e) => setCoverageAmount(e.target.value)}
                disabled={!address || insurancePending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="premium-amount">Premium Amount</Label>
              <Input
                id="premium-amount"
                type="number"
                placeholder="20"
                value={premiumAmount}
                onChange={(e) => setPremiumAmount(e.target.value)}
                disabled={!address || insurancePending}
              />
            </div>
          </div>

          {insuranceState?.txHash && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Active Policy:</strong> {insuranceState.txHash.slice(0, 16)}...
              </p>
              <p className="text-xs text-blue-600">
                Coverage: ${insuranceState.coverageAmount} | Premium: ${insuranceState.premiumAmount}
              </p>
            </div>
          )}

          <Button
            onClick={handleCreatePolicy}
            disabled={!address || insurancePending}
            className="w-full"
          >
            {insurancePending ? "Processing..." : "🛡️ Create Insurance Policy"}
          </Button>
        </CardContent>
      </Card>

      {/* Status */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">🔍 Status</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Wallet: {address ? "✅ Connected" : "❌ Not connected"}</li>
          <li>• Contract Signing: Using direct 2025 approach</li>
          <li>• SDK: Bypassed (unreliable)</li>
          <li>• Transaction: Direct to Chrome wallet</li>
        </ul>
      </div>
    </div>
  );
}