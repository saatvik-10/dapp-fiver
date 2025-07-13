import z from 'zod';

export const createTaskInput = z.object({
  options: z
    .array(
      z.object({
        imageUrl: z.string(),
      })
    )
    .min(2, {
      message: 'At least 2 images are required',
    }),
  title: z.string().optional(),
  signature: z.string(),
});

export const createSubmissionInput = z.object({
  taskId: z.string(),
  selection: z.string(),
});
