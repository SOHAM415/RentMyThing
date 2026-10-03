import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";
import { registerSchema } from "../validations/authValidation.js";

const router = express.Router();

router.post("/signup", async (req, res) => {

    try {

        const validation = registerSchema.safeParse(req.body);

        if(!validation.success){
            return res.status(400).json({errors: validation.error.issues});
        }

        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return  res.status(400).json({message:"All fields are required"});
        }

        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1", [email]
        );

        if(existingUser.rows.length > 0){
            return res.status(400).json({message:"user already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
            [name, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
          message: "user created",
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

        
        
    } catch (error) {
        console.error(error);
       return res.status(500).json({message: " Error creating user"});
    }
   
});

router.post("/login", async (req, res) => {

    try {
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({message:"All fields are required"});
        }
const result = await pool.query(
    "SELECT * FROM users WHERE email =$1", [email]
);

if(result.rows.length === 0 ){
    return res.status(400).json({message:"user not found"});
}
const user = result.rows[0];

const isMatch = await bcrypt.compare(password, user.password);

if(!isMatch){
    return res.status(400).json({message:"Invalid password"});
}

const token = jwt.sign(
    {id: user.id, email: user.email, role:user.role},
   process.env.JWT_SECRET,
    { expiresIn: "1d"}
);


res.json({
    message:"Login successful",
    token,
    user:{
        id: user.id,
        name: user.name,
        email:user.email
    }
    
});

    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Error logging in"});
    }
});

router.get("/profile", authMiddleware, (req, res) => {
    res.json({
        message:"Protected route",
        user: req.user
    });
});

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
    try {

        const { token } = req.body;
        
       const ticket = await client.verifyIdToken({
        idToken: token,
        audience:
        process.env.GOOGLE_CLIENT_ID,
       });

       const payload = ticket.getPayload();

        const email = payload.email;
        const name = payload.name;

        let user = await pool.query(
            "SELECT * FROM users WHERE email = $1", [email]
        );

        if(user.rows.length === 0){
            user = await pool.query(
                "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *", [name, email]
            );
        }

        const jwtToken = jwt.sign( {id: user.rows[0].id},
            process.env.JWT_SECRET,
        { expiresIn: "1d"} );

        res.json({token: jwtToken});
    } catch (error) {
        console.error("GOOGLE LOGIN ERROR:", error);
        res.status(500).json({message: "Google login failed"});
    }
});

export default router;