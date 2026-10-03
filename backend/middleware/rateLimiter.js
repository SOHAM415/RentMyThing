import rateLimit from "express-rate-limit";

const limiter = rateLimit({windowMs: 15 * 60 * 1000, max: 100,
        message: {
        message: "Too many requests. Try again later."
    }

});

export default limiter;