import { z } from "zod";

export const CreateTripSchema = z.object({
  destination: z.string().min(2).max(120),
  startDate: z.string().min(10).max(10),
  endDate: z.string().min(10).max(10),
  budget: z.coerce.number().int().positive().optional(),
  pax: z.coerce.number().int().min(1).max(99).default(1),
  interests: z.string().min(1),
  travelStyle: z.string().max(60).optional()
});
