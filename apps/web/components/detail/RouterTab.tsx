'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wallet, ArrowDownRight, ArrowUpRight, CheckCircle } from 'lucide-react';
import { Opportunity } from '@adapters/core';

interface RouterTabProps {
  opportunity: Opportunity;
}

export function RouterTab({ opportunity }: RouterTabProps) {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  
  // Mock wallet state
  const isConnected = true;
  const activeAddress = '0x123...abc';
  const balance = 1000;

  const handleTransaction = async () => {
    if (!amount) return;
    setLoading(true);
    // Simulate transaction
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Router Info */}
      <div className="rounded-lg bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">🔗</div>
          <div>
            <h3 className="text-lg font-semibold text-white">Router Interface</h3>
            <p className="text-sm text-blue-300">
              interact with {opportunity.protocol} through the Router contract
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-gray-400">Router Address</div>
            <div className="text-white font-mono">0x7a2...3d9</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-gray-400">Target Protocol</div>
            <div className="text-white font-mono">{opportunity.protocol}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-gray-400">Network</div>
            <div className="text-white">Ethereum Mainnet</div>
          </div>
        </div>
      </div>

      {/* Wallet Connection Status */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="text-blue-600" size={20} />
            <span className="text-sm font-medium text-blue-900">
              {isConnected ? `Connected: ${activeAddress}` : "Wallet Not Connected"}
            </span>
          </div>
          {isConnected && (
            <span className="text-sm text-blue-600 font-medium">
              Balance: {balance.toFixed(4)} ETH
            </span>
          )}
        </div>
      </div>

      {/* Action Panel */}
      <div className="rounded-lg bg-white/5 border border-white/10 p-6">
        <div className="space-y-4">
          {/* Deposit/Withdrawal Tabs */}
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 w-full">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'deposit'
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600"
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'withdraw'
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600"
              }`}
            >
              Withdraw
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-400 text-sm">ETH</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleTransaction}
            disabled={loading || !amount}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              loading || !amount
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {activeTab === 'deposit' ? (
                  <>
                    Deposit {amount || '0'} ETH
                    <ArrowDownRight size={16} />
                  </>
                ) : (
                  <>
                    Withdraw {amount || '0'} ETH
                    <ArrowUpRight size={16} />
                  </>
                )}
              </>
            )}
          </motion.button>

          {/* Success Animation */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700"
            >
              <CheckCircle size={16} />
              <span className="text-sm font-medium">
                Transaction completed successfully!
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}