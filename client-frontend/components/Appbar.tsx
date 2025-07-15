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

  async function handleSignMessage() {
    if (!publicKey) {
      return;
    }
    const msg = new TextEncoder().encode(
      `Welcome to D@pp-Fiv€₹!\n\nSign this message to authenticate your wallet and post tasks.\n\nWallet: ${publicKey?.toString()}`
    );
    const signature = await signMessage?.(msg);

    const res = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
      signature,
      publicKey: publicKey?.toString(),
    });

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
        <span className='font-bold text-xl text-purple-800'>D@pp-Fiv€₹</span>
        {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
      </div>
    </div>
  );
};

export default Appbar;
