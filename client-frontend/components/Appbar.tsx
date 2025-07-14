'use client';

import React from 'react';
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

const Appbar = () => {
  const { publicKey } = useWallet();

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
