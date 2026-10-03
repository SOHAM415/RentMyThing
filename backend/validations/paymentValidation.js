import {z} from "zod";

export const paymentSchema = z.object({
    bookingId: z.number(),
})
