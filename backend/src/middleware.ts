import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'] ?? '';

  try {
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET_USER!);

    // @ts-ignore
    if (decoded.userId) {
      // @ts-ignore
      req.userId = decoded.userId;
      next();
    } else {
      res.status(403).json({
        message: 'You are not logged in',
      });
      return;
    }
  } catch (err) {
    res.status(403).json({
      message: 'You are not logged in',
    });
    return;
  }
}

export function workerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'] ?? '';

  try {
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET_WORKER!);

    // @ts-ignore
    if (decoded.workerId) {
      // @ts-ignore
      req.workerId = decoded.workerId;
      return next();
    } else {
      res.status(403).json({
        message: 'You are not logged in',
      });
    }
  } catch (err) {
    res.status(403).json({
      message: 'You are not logged in',
    });
  }
}
