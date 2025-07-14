'use client';

import React from 'react';
import axios from 'axios';
import { BACKEND_URL } from '@/utils/lib';

const Appbar = () => {
  const signin = async () => {
    const res = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {});
    localStorage.setItem('token', res.data.token);
  };

  return (
    <div className='bg-purple-800 p-4'>
      <div className='flex items-center justify-between max-w-7xl mx-auto'>
        <span className='font-bold text-xl text-white'>
          Dapp-Fiver <span className='text-xs'>(Worker)</span>
        </span>
        <button
          className='cursor-pointer bg-white p-1.5 text-purple-800 rounded-lg font-medium'
          onClick={signin}
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
};

export default Appbar;
