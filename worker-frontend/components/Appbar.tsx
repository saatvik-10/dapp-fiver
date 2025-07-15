'use client';

import React, { useEffect } from 'react';
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { BACKEND_URL } from '@/utils/lib';
import axios from 'axios';

const Appbar = () => {
  const { publicKey, signMessage } = useWallet();
  const [balance, setBalance] = React.useState<number>(0);

  async function handleSignMessage() {
    if (!publicKey) {
      return;
    }
    const msg = new TextEncoder().encode(
      `Welcome to D@pp-Fiv€₹!\n\nSign this message to authenticate your wallet and start earning by completing tasks.\n\nWallet: ${publicKey?.toString()}`
    );
    const signature = await signMessage?.(msg);

    const res = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
      signature,
      publicKey: publicKey?.toString(),
    });

    setBalance(res.data.amount / 1000000000);

    localStorage.setItem('token', res.data.token);
  }

  useEffect(() => {
    if (publicKey && signMessage) {
      handleSignMessage();
    }
  }, [publicKey, signMessage]);

  return (
    <div className='bg-white p-3 shadow-md'>
      <div className='flex items-center justify-between max-w-7xl mx-auto'>
        <span className='font-bold text-xl text-purple-800'>
          D@pp-Fiv€₹ (wo₹ke₹)
        </span>
        <div className='flex items-center justify-center gap-4'>
          <button className='border-2 cursor-pointer hover:bg-purple-200 font-semibold rounded-lg p-1 border-purple-800 bg-white text-purple-800'>
            Pay me {balance} SOL
          </button>
          {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
        </div>
      </div>
    </div>
  );
};

export default Appbar;
