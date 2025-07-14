'use client';

import Appbar from '@/components/Appbar';
import { BACKEND_URL } from '@/utils/lib';
import axios from 'axios';
import { useState, useEffect, use } from 'react';
import { Pie, PieChart } from 'recharts';

const data01 = [
  {
    name: 'Group A',
    value: 400,
  },
  {
    name: 'Group B',
    value: 300,
  },
  {
    name: 'Group C',
    value: 300,
  },
  {
    name: 'Group D',
    value: 200,
  },
  {
    name: 'Group E',
    value: 278,
  },
  {
    name: 'Group F',
    value: 189,
  },
];

async function getTask(id: string) {
  const res = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${id}`, {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  });
  return res.data;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [result, setResult] = useState<
    Record<
      string,
      {
        count: number;
        option: {
          imageUrl: string;
        };
      }
    >
  >({});

  const [taskDetails, setTaskDetails] = useState<{ title?: string }>({});

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      const data = await getTask(id);
      setResult(data.result);
      setTaskDetails(data.taskDetails);
      timeoutId = setTimeout(fetchData, 5000);
    };

    fetchData();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [id]);

  const pieData = Object.keys(result).map((id) => ({
    name: `Image ${id}`,
    value: result[id].count,
  }));

  return (
    <div>
      <Appbar />
      <div className='text-3xl pt-20 flex justify-center font-semibold underline text-purple-800'>
        {taskDetails?.title}
      </div>
      <div className='flex justify-center pt-6'>
        {Object.keys(result).map((id) => (
          <Task
            key={id}
            imageUrl={result[id].option.imageUrl}
            votes={result[id].count}
            id={id}
          />
        ))}
      </div>
      <div className='flex items-center justify-between pt-10'>
        <PieChart width={800} height={400} key={id}>
          <Pie
            data={pieData}
            dataKey='value'
            nameKey='name'
            cx='50%'
            cy='50%'
            outerRadius={150}
            fill='#8884d8'
            label
          />
        </PieChart>
      </div>
    </div>
  );
}

function Task({
  imageUrl,
  votes,
  id,
}: {
  imageUrl: string;
  votes: number;
  id: string;
}) {
  return (
    <div>
      <img src={imageUrl} alt='' className='p-2 w-96 rounded-lg' />
      <div className='flex justify-center items-center font-medium'>
        Image-{id}
        <br />
        Votes: {votes}
      </div>
    </div>
  );
}
