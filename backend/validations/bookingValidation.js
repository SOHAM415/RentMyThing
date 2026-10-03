import {z} from "zod";

export const bookingSchema = z.object({
    item_id: z.number(),
    start_date: z.string(),
    end_date: z.string(),
});