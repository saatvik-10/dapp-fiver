import express from 'express';
import userRouter from './routers/user';
import wokrerRouter from './routers/worker';

const app = express();

app.use('/v1/user', userRouter);
app.use('/v1/worker', wokrerRouter);

app.listen(3000, () => {
  console.log('Server running on PORT 3000');
});
