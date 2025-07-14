'use client';

import { BACKEND_URL } from '@/utils/lib';
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
    <div className='flex justify-center pt-8'>
      <div className='max-w-screen-lg w-full'>
        <span className='text-3xl text-start font-semibold text-purple-800'>
          Create a new task
        </span>

        <div className='flex flex-col gap-y-1 py-4'>
          <label className='text-sm font-medium text-black'>Details</label>
          <input
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            type='text'
            className='p-2 border-gray-400 text-gray-800 focus:border-gray-700 w-full border rounded-lg'
            placeholder='Enter your task'
            required
          />
        </div>

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

        <div className='flex flex-col items-center justify-center'>
          <div className='flex pt-2 pb-4 justify-center'>
            <UploadImage
              onImageAdd={(imageUrl) => {
                setImages((prev) => [...prev, imageUrl]);
              }}
            />
          </div>

          <button
            className='rounded-lg bg-purple-800 text-white p-1.5 hover:cursor-pointer hover:bg-purple-500'
            onClick={onSubmit}
          >
            Submit Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
