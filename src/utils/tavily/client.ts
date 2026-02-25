import { tavily } from "@tavily/core";

export const createClient = () =>
  tavily({ apiKey: process.env.TAVILY_API_KEY! });
