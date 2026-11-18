import { z } from "zod";

export const volunteerInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email(),
  phone: z.string().trim().optional(),
});