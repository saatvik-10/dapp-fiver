'use client';

import { BACKEND_URL } from '@/config/lib';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React from 'react';
import UploadImage from './UploadImage';

const Upload = () => {
  const route = useRouter();
  const [images, setImages] = React.useState<string[]>([]);
  const [title, setTitle] = React.useState<string>('');

  async function onSubmit() {
    const res = await axios.post(
      `${BACKEND_URL}/v1/user/task`,
      {
        options: images?.map((image) => ({
          imageUrl: image,
        })),
        title,
        signature: '0x123',
      },
      {
        headers: {
          Authorization: localStorage.getItem('token'),
        },
      }
    );
    route.push(`/task/${res.data.id}`);
  }

  return (
    <div className='flex justify-center'>
      <div className='max-w-screen-lg w-full'>
        <span className='text-3xl text-center fonr-sermibold'>
          Create a new task
        </span>

        <label className='text-sm font-medium text-black'>Details</label>
        <input
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          type='text'
          className='p-2 border-gray-400 text-gray-800 focus:border-gray-700 w-full'
          placeholder='Enter your task'
          required
        />

        <label className='text-sm font-medium text-black'>Add Images</label>
        <div className='flex items-center max-w-screen-lg pt-3'>
          {images.map((image, idx) => (
            <UploadImage
              key={idx}
              image={image}
              onImageAdd={(imageUrl) => {
                setImages((prev) => [...prev, imageUrl]);
              }}
            />
          ))}
        </div>

        <div className='flex pt-2 justify-center'>
          <UploadImage
            onImageAdd={(imageUrl) => {
              setImages((prev) => [...prev, imageUrl]);
            }}
          />
        </div>

        <button
          className='rounded-xl bg-blue-500 text-white'
          onClick={onSubmit}
        >
          Submit Task
        </button>
      </div>
    </div>
  );
};

export default Upload;
