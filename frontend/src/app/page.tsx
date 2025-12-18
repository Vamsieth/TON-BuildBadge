'use client';

import { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function Home() {
  const [contractAddress, setContractAddress] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [examples, setExamples] = useState<any[]>([]);
  const [minting, setMinting] = useState(false);

  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    fetchExamples();
  }, []);

  const fetchExamples = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/examples`);
      setExamples(response.data);
    } catch (err) {
      console.error('Failed to fetch examples:', err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/verify`, {
        address: contractAddress
      });
      setVerificationResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify contract');
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!userAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setMinting(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/mint`, {
        userAddress,
        contractAddress
      });

      const { payload } = response.data;

      // In a real implementation, we would send a transaction via TonConnect
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: payload.address,
            amount: payload.amount,
            payload: payload.payload // Base64 encoded payload
          }
        ]
      };

      await tonConnectUI.sendTransaction(transaction);
      alert('Mint transaction sent! After it confirms, the NFT will appear in your wallet.');
    } catch (err: any) {
      console.error('Minting error:', err);
      alert('Failed to initiate minting: ' + (err.message || 'unknown error'));
    } finally {
      setMinting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              TON Build Badge
            </h1>
            <p className="mt-2 text-slate-600">
              Celebrate your journey on TON. Verify your deployment and claim your <strong>Build Badge</strong> NFT.
            </p>
          </div>
          <TonConnectButton />
        </header>

        {/* Verification Form */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Check Deployment</h2>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                  Contract Address (Testnet)
                </label>
                <input
                  id="address"
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="EQ..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check Deployment'}
              </button>
            </form>
          </div>

          <div className="w-full md:w-48 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <div className="text-xs text-slate-400 mb-2 uppercase font-bold">Reward Preview</div>
            <img 
              src="/assets/verified-badge.svg" 
              alt="Developer Badge" 
              className={`w-24 h-24 ${verificationResult?.verified ? 'opacity-100' : 'opacity-30 grayscale'}`}
            />
            <div className="text-[10px] text-slate-500 mt-2 text-center">
              NFT: TON Build Badge
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {verificationResult && (
          <div className={`mt-4 p-4 rounded-lg border ${verificationResult.verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-semibold ${verificationResult.verified ? 'text-green-800' : 'text-yellow-800'}`}>
                  {verificationResult.verified ? '✅ Contract Deployed!' : '⚠️ Contract Not Found'}
                </h3>
                <p className="text-sm mt-1 text-slate-600">
                  {verificationResult.verified 
                    ? `Your contract is active on TON Testnet. Balance: ${(Number(verificationResult.metadata?.balance) / 1e9).toFixed(4)} TON`
                    : verificationResult.message || 'Contract not deployed or not active.'}
                </p>
              </div>
              {verificationResult.verified && (
                <button
                  onClick={handleMint}
                  disabled={minting}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {minting ? 'Minting...' : 'Claim Build Badge'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Examples Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-slate-800">Example Contracts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examples.map((example, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800">{example.title}</h3>
                <p className="text-sm text-slate-600 mt-1 mb-3">{example.description}</p>
                <div className="flex gap-2">
                  <a
                    href={example.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline py-1"
                  >
                    View Docs →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Links */}
        <footer className="text-center text-slate-500 text-sm">
          <p>A Community Initiative for TON Builders</p>
          <div className="mt-2 flex justify-center space-x-4">
            <a href="https://docs.ton.org" target="_blank" className="hover:text-blue-600">TON Docs</a>
            <a href="https://docs.ton.org/languages/tolk/overview" target="_blank" className="hover:text-blue-600">Tolk Language</a>
            <a href="https://github.com/ton-blockchain" target="_blank" className="hover:text-blue-600">GitHub</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
