import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const route = Router();
const prismaClient = new PrismaClient();

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
