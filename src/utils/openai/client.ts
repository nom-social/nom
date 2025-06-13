import OpenAI from "openai";

export const createClient = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
