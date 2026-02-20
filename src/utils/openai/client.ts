import { createOpenAI } from "@ai-sdk/openai";
import OpenAI from "openai";

export const createClient = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

export const createOpenAIProvider = () =>
  createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
