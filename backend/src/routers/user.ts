import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const route = Router();
const prismaClient = new PrismaClient();

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
