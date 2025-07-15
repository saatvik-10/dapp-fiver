import { S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { createTaskInput } from '../types';
import { PARENT_WALLET_ADDRESS, TOTAL_DECIMALS } from '../config/config';
import nacl from 'tweetnacl';
import { Connection, PublicKey } from '@solana/web3.js';

const route = Router();
const prismaClient = new PrismaClient();
const connection = new Connection(
  'https://solana-devnet.g.alchemy.com/v2/Kav7irBbUIgH28nBgHy8EvLO0S6ndZOU'
);

route.get('/task', authMiddleware, async (req, res) => {
  const taskId = req.query.taskId;
  // @ts-ignore
  const userId = req.userId;

  const taskDetails = await prismaClient.task.findFirst({
    where: {
      id: Number(taskId),
      user_id: Number(userId),
    },
    include: {
      options: true,
    },
  });

  if (!taskDetails) {
    res.status(404).json({
      message: 'No access to this task',
    });
    return;
  }

  // can be optimized
  const responses = await prismaClient.submission.findMany({
    where: {
      task_id: Number(taskId),
    },
    include: {
      option: true,
    },
  });

  const result: Record<
    string,
    {
      count: number;
      option: {
        imageUrl: string;
      };
    }
  > = {};

  taskDetails.options.forEach((option) => {
    result[option.id] = {
      count: 0,
      option: {
        imageUrl: option.image_url,
      },
    };
  });

  responses.forEach((res) => {
    result[res.option_id].count += 1;
  });

  res.json({
    result,
    taskDetails,
  });
});

route.post('/task', authMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;

  //validating user inputs
  const body = req.body;

  const parseData = createTaskInput.safeParse(body);

  const user = await prismaClient.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!parseData.success) {
    res.status(400).json({
      message: 'Invalid input data',
      error: parseData.error.message,
    });
  }

  const transaction = await connection.getTransaction(
    parseData.data!.signature,
    {
      maxSupportedTransactionVersion: 1,
    }
  );

  if (
    (transaction?.meta?.postBalances[1] ?? 0) -
      (transaction?.meta?.preBalances[1] ?? 0) !=
    100000000
  ) {
    res.status(400).json({
      message: 'Incorrect Transaction signature',
    });
  }

  if (
    transaction?.transaction.message.getAccountKeys().get(1)?.toString() !==
    PARENT_WALLET_ADDRESS
  ) {
    res.status(400).json({
      message: 'Transaction is not sent to the correct wallet',
    });
  }

  if (
    transaction?.transaction.message.getAccountKeys().get(1)?.toString() !==
    user?.address
  ) {
    res.status(400).json({
      message: 'Transaction is not sent to the correct wallet',
    });
  }

  const response = await prismaClient.$transaction(async (tx) => {
    //avoid partial updates, either both title and options should happen or none
    const res = await tx.task.create({
      data: {
        title: parseData.data?.title ?? 'Select the most clickable thumbnail',
        amount: 1 * TOTAL_DECIMALS,
        signature: 'signature',
        user_id: userId,
      },
    });

    await tx.option.createMany({
      data: parseData.data!.options.map((option) => ({
        image_url: option.imageUrl,
        task_id: res.id,
      })),
    });
    return res;
  });

  res.json({
    id: response.id,
  });
});

route.get('/presignedUrl', authMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;

  const s3Client = new S3Client({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_SECRET_KEY!,
    },
  });
  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `fiver-uploads/${userId}/${Math.random()}/image.jpg`,
    Conditions: [
      ['content-length-range', 0, 10 * 1024 * 1024], // 10 MB
    ],
    Expires: 3600,
  });

  res.json({
    preSignedUrl: url,
    fields,
  });
});

//signin with wallet
route.post('/signin', async (req, res) => {
  const { signature, publicKey } = req.body;
  const msg = new TextEncoder().encode(
    `Welcome to D@pp-Fiv€₹!\n\nSign this message to authenticate your wallet and post tasks.\n\nTimestamp: ${new Date().toISOString()}\nWallet: ${publicKey?.toString()}`
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
  }

  const user = await prismaClient.user.findFirst({
    where: {
      address: publicKey,
    },
  });

  if (user) {
    const token = jwt.sign(
      {
        userId: user?.id,
      },
      process.env.JWT_SECRET_USER!
    );
    res.status(201).json({
      token,
    });
  } else {
    const newUser = await prismaClient.user.create({
      data: {
        address: publicKey,
      },
    });
    const token = jwt.sign(
      {
        userId: newUser?.id,
      },
      process.env.JWT_SECRET_USER!
    );
    res.status(201).json({
      token,
    });
  }
});

export default route;
