import {z} from "zod";

export const itemSchema = z.object({
    title:z.string().min(3),
    city: z.string().min(2),
    price_per_day:
    z.coerce.number().positive(),
    description: z.string().optional(),
    category: z.string().optional(),
})