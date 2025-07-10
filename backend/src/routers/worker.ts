import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { workerMiddleware } from '../middleware';

const route = Router();
const prismaClient = new PrismaClient();

route.get('/nextTask', workerMiddleware, async (req, res) => {
  // @ts-ignore
  const workerId = req.workerId;

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
      title: true,
      options: true,
    },
  });

  if (!task) {
    res.status(404).json({
      message: 'No more task available!',
    });
    return;
  }

  res.status(200).json({
    task,
  });
});

//signin with wallet
route.post('/signin', async (req, res) => {
  const walletAddress = '8dAkchckXn9mEtan911z1aA4ebgzK3HZWM8B4ZwmGrXU';

  const worker = await prismaClient.worker.findFirst({
    where: {
      address: walletAddress,
    },
  });

  if (worker) {
    const token = jwt.sign(
      {
        workerId: worker?.id,
      },
      process.env.JWT_SECRET_WORKER!
    );
    res.status(201).json({
      token,
    });
  } else {
    const newWorker = await prismaClient.worker.create({
      data: {
        address: walletAddress,
        pending_amount: 0,
        locked_amount: 0,
      },
    });
    const token = jwt.sign(
      {
        workerId: newWorker?.id,
      },
      process.env.JWT_SECRET_WORKER!
    );
    res.status(201).json({
      token,
    });
  }
});

export default route;
