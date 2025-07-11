'use client';

import { BACKEND_URL, CLOUDFRONT_URL } from '@/config/lib';
import axios from 'axios';
import React from 'react';

const UploadImage = ({
  image,
  onImageAdd,
}: {
  image?: string;
  onImageAdd: (imageUrl: string) => void;
}) => {
  const [uploading, setUploading] = React.useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploading(true);
    try {
      const file = e.target.files?.[0];

      const res = await axios.post(`${BACKEND_URL}/v1/presignedUrl`, {
        headers: {
          Authorization: localStorage.getItem('token'),
        },
      });
      const presignedUrl = res.data.presignedUrl;

      const formData = new FormData();
      formData.set('bucket', res.data.fields['bucket']);
      formData.set('X-Amz-Algorithm', res.data.fields['X-Amz-Algorithm']);
      formData.set('X-Amz-Credential', res.data.fields['X-Amz-Credential']);
      formData.set('X-Amz-Algorithm', res.data.fields['X-Amz-Algorithm']);
      formData.set('X-Amz-Date', res.data.fields['X-Amz-Date']);
      formData.set('key', res.data.fields['key']);
      formData.set('Policy', res.data.fields['Policy']);
      formData.set('X-Amz-Signature', res.data.fields['X-Amz-Signature']);

      {
        file && formData.append('file', file);
      }

      const awsRes = await axios.post(presignedUrl, formData);
      onImageAdd(`${CLOUDFRONT_URL}/${res.data.fields['key']}`);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  }

  if (image) {
    return <img className='p-2 w-80 rounded' src={image} />;
  }

  return (
    <div className='w-96 h-40 border border-dashed text-3xl hover:cursor-pointer rounded border-blue-500'>
      <div className='h-full flex justify-center'>
        <div className='flex flex-col h-full justify-center relative'>
          {uploading ? (
            <div className='text-sm'>Loading...</div>
          ) : (
            <div className='text-blue-400'>
              +
              <input
                className=' bg-red-400 w-72 h-40 opacity-0 absolute top-0 left-0'
                type='file'
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadImage;
