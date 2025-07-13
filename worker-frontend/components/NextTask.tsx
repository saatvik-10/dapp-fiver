'use client';

import { BACKEND_URL } from '@/utils/lib';
import axios from 'axios';
import React from 'react';

interface Task {
  id: number;
  amount: number;
  title: string;
  options: [
    {
      id: number;
      image_url: string;
      task_id: number;
    }
  ];
}

export default function NextTask() {
  const [currTask, setCurrTask] = React.useState<Task | null>(null);
  const [loading, setLoading] = React.useState(true);

  const handleSelect = async (optionId: number) => {
    if (!currTask) return;
    try {
      const res = await axios.post(
        `${BACKEND_URL}/v1/worker/submission`,
        {
          taskId: currTask.id,
          submission: optionId,
        },
        {
          headers: {
            Authorization: localStorage.getItem('token'),
          },
        }
      );

      const nextTask = res.data.nextTask;
      if (nextTask) {
        setCurrTask(nextTask);
      } else {
        setCurrTask(null);
      }
      //refresh user balance in navbar
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/v1/worker/nextTask`, {
        headers: {
          Authorization: localStorage.getItem('token'),
        },
      })
      .then((res) => {
        setCurrTask(res.data.task);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className='text-center p-4'>Loading...</div>;
  }

  if (!currTask) {
    return (
      <div className='tect-center p-4'>
        No Task available, please try again later.
      </div>
    );
  }

  return (
    <div>
      <div className='text-3xl pt-20 flex justify-center font-semibold underline text-blue-500'>
        {currTask?.title}
      </div>
      <div className='flex justify-center pt-6'>
        {currTask.options.map((option, id) => (
          <Option
            key={id}
            image_url={option.image_url}
            id={option.id}
            onSelect={() => handleSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Option({
  image_url,
  id,
  onSelect,
}: {
  image_url: string;
  id: number;
  onSelect: () => void;
}) {
  return (
    <div className='rounded-lg p-2'>
      <img
        onClick={onSelect}
        src={image_url}
        alt=''
        className='w-96 rounded-lg cursor-pointer hover:opacity-50 hover:border hover:border-blue-500 hover:shadow-md'
      />
      <div className='flex justify-center items-center font-medium text-white'>
        Image-{id}
      </div>
    </div>
  );
}
