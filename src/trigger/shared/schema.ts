import { z } from "zod";

export const starredRepoSchema = z.array(
  z.object({
    owner: z.object({ login: z.string() }),
    name: z.string(),
  })
);

export const watchedRepoSchema = z.array(
  z.object({
    owner: z.object({ login: z.string() }),
    name: z.string(),
  })
);
