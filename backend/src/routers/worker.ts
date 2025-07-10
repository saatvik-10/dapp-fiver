import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { workerMiddleware } from '../middleware';
import { getNextTask } from '../config/db';
import { createSubmissionInput } from '../types';
import { TOTAL_DECIMALS } from '../config/config';

const TOTAL_SUBMISSION = 100;

const route = Router();
const prismaClient = new PrismaClient();

route.get('/balance', workerMiddleware, async (req, res) => {
  //@ts-ignore
  const workerId = req.workerId;

  const worker = await prismaClient.worker.findFirst({
    where: {
      id: workerId,
    },
  });

  res.json({
    pendingAmount: worker?.pending_amount,
    lockedAmount: worker?.locked_amount,
  });
});

route.post('/submission', workerMiddleware, async (req, res) => {
  // @ts-ignore
  const workerId = req.workerId;

  const body = req.body;
  const parsedBody = createSubmissionInput.safeParse(body);

  if (parsedBody.success) {
    const task = await getNextTask(Number(workerId));

    if (!task || task?.id !== Number(parsedBody.data.taskId)) {
      res.status(404).json({
        message: 'Incorrect task ID',
      });
    }

    const amount = Number(task?.amount) / TOTAL_SUBMISSION;

    const response = await prismaClient.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          option_id: Number(parsedBody.data.selection),
          worker_id: workerId,
          task_id: Number(parsedBody.data.taskId),
          amount,
        },
      });

      await tx.worker.update({
        where: {
          id: workerId,
        },
        data: {
          pending_amount: {
            increment: Number(amount),
          },
        },
      });

      return submission;
    });

    const nextTask = await getNextTask(Number(workerId));
    res.json({
      nextTask,
      amount: (Number(task?.amount) / TOTAL_SUBMISSION).toString(),
    });
  }
});

route.get('/nextTask', workerMiddleware, async (req, res) => {
  // @ts-ignore
  const workerId = req.workerId;

  const task = await getNextTask(Number(workerId));

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
