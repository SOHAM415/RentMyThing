import { createClient } from "redis";

const redisclient = createClient();

redisclient.on("error", (err) =>
    console.log("Redis Error", err)
);

try {
    // await redisclient.connect();
    console.log("Redis Connected");
} catch (error) {
    console.log("Redis not running. Continuing without cache.");
}

export default redisclient;

// .on is like event listener