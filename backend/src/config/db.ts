import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export const getNextTask = async (workerId: number) => {
  const task = await prismaClient.task.findFirst({
    where: {
      done: false,
      submissions: {
        none: {
          worker_id: workerId,
        },
      },
    },
    select: {
      id: true,
      title: true,
      amount: true,
      options: true,
    },
  });
  return task;
};
