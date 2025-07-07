import { Resend } from "resend";

export const createClient = () => new Resend(process.env.RESEND_API_KEY!);
