import { S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { createTaskInput } from '../types';

const route = Router();
const prismaClient = new PrismaClient();

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
  });
});

route.post('/task', authMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;

  //validating user inputs
  const body = req.body;

  const parseData = createTaskInput.safeParse(body);

  if (!parseData.success) {
    res.status(400).json({
      message: 'Invalid input data',
      error: parseData.error.errors,
    });
  }

  const response = await prismaClient.$transaction(async (tx) => {
    //avoid partial updates, either both title and options should happen or none
    const res = await tx.task.create({
      data: {
        title: parseData.data?.title,
        amount: '1',
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
    Key: `/fiver-uploads/${userId}/${Math.random()}/image.jpg`,
    Conditions: [
      ['content-length-range', 0, 10485760], // 10 MB
    ],
    Fields: {
      'Content-Type': 'image/png',
    },
    Expires: 3600,
  });

  res.json({
    presignedUrl: url,
    fields,
  });
});

//signin with wallet
route.post('/signin', async (req, res) => {
  const walletAddress = '3sXPJophwvX6crRSEoKXXdH6hLRdNKKUazwaXEpuxhLS';

  const user = await prismaClient.user.findFirst({
    where: {
      address: walletAddress,
    },
  });

  if (user) {
    const token = jwt.sign(
      {
        userId: user?.id,
      },
      process.env.JWT_SECRET!
    );
    res.status(201).json({
      token,
    });
  } else {
    const newUser = await prismaClient.user.create({
      data: {
        address: walletAddress,
      },
    });
    const token = jwt.sign(
      {
        userId: newUser?.id,
      },
      process.env.JWT_SECRET!
    );
    res.status(201).json({
      token,
    });
  }
});

export default route;
