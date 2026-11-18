import { z } from "zod";

export const emailLinkSchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(["email", "invite"]),
});

export type EmailLink = z.infer<typeof emailLinkSchema>;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

// Supabase sends 6 to 10 digits, depending on the project's settings.
export const otpCodeSchema = z
  .string()
  .transform((code) => code.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^\d{6,10}$/, "Enter the code from the email."));
