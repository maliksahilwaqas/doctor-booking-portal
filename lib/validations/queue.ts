import { z } from "zod";

export const callNextTokenSchema = z.object({
  locationId: z.string().uuid(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CallNextTokenInput = z.infer<typeof callNextTokenSchema>;
