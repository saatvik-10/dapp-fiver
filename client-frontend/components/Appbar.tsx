'use client';

import React, { useEffect } from 'react';
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

const Appbar = () => {
  const { publicKey, signMessage } = useWallet();

  async function handleSignMessage() {
    const msg = new TextEncoder().encode(
      `Welcome to D@pp-Fiv€₹!\n\nSign this message to authenticate your wallet and start earning by completing tasks.\n\nTimestamp: ${new Date().toISOString()}\nWallet: ${publicKey?.toString()}`
    );
    const signature = await signMessage?.(msg);
    console.log('Signature:', signature);
  }

  useEffect(() => {
    handleSignMessage();
  }, [publicKey]);

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
