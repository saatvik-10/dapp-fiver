import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { workerMiddleware } from '../middleware';
import { getNextTask } from '../config/db';
import { createSubmissionInput } from '../types';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

const TOTAL_SUBMISSION = 100;

const route = Router();
const prismaClient = new PrismaClient();

route.post('/payout', workerMiddleware, async (req, res) => {
  //@ts-ignore
  const workerId = req.workerId;

  const worker = await prismaClient.worker.findFirst({
    where: {
      id: workerId,
    },
  });

  if (!worker) {
    res.status(404).json({
      message: 'User not found',
    });
    return;
  }
  //txn logic
  const txnId = 'x23';

  //add lock here later
  await prismaClient.$transaction(async (tx) => {
    await tx.worker.update({
      where: {
        id: workerId,
      },
      data: {
        pending_amount: {
          decrement: worker?.pending_amount,
        },
        locked_amount: {
          increment: worker?.locked_amount,
        },
      },
    });
    await tx.payouts.create({
      data: {
        user_id: workerId,
        amount: Number(worker?.pending_amount),
        status: 'PROCESSING',
        signature: txnId,
      },
    });
  });

  //send the txn to solana blockchain

  res.json({
    message: 'Processing payout',
    amount: worker?.pending_amount,
  });
});

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
      return;
    }

    const amount = (Number(task?.amount) / TOTAL_SUBMISSION).toString();

    const response = await prismaClient.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          option_id: Number(parsedBody.data.selection),
          worker_id: workerId,
          task_id: Number(parsedBody.data.taskId),
          amount: Number(amount),
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
      amount,
    });
  } else {
    res.status(400).json({
      message: 'Invalid input data',
      error: parsedBody.error.message,
    });
    return;
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
  const { signature, publicKey } = req.body;
  const msg = new TextEncoder().encode(
    `Welcome to D@pp-Fiv€₹!\n\nSign this message to authenticate your wallet and start earning by completing tasks.\n\nWallet: ${publicKey?.toString()}`
  );

  const result = nacl.sign.detached.verify(
    msg,
    new Uint8Array(signature.data),
    new PublicKey(publicKey).toBytes()
  );

  if (!result) {
    res.status(400).json({
      message: 'Invalid signature',
    });
    return;
  }

  const worker = await prismaClient.worker.findFirst({
    where: {
      address: publicKey,
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
      amount: worker?.pending_amount,
    });
  } else {
    const newWorker = await prismaClient.worker.create({
      data: {
        address: publicKey,
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
      amount: 0,
    });
  }
});

export default route;
