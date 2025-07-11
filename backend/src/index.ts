import express from 'express';
import userRouter from './routers/user';
import wokrerRouter from './routers/worker';
import cors from 'cors';

const app = express();

app.use(express.json());

app.use(cors());

app.use('/v1/user', userRouter);
app.use('/v1/worker', wokrerRouter);

app.listen(3000, () => {
  console.log('Server running on PORT 3000');
});
