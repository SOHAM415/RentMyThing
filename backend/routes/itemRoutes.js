import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";
import redisClient  from "../config/redis.js";
import { itemSchema } from "../validations/itemValidation.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/items", authMiddleware, upload.single("image"), async (req, res) => {
    try {
   const validation = itemSchema.safeParse(req.body);

   if(!validation.success){
    return res.status(400).json({
        errors: validation.error.issues,
    });
   }





        const { title, description, category, price_per_day, city } = req.body;

if (!title  || !price_per_day){
    return res.status(400).json({message: "Required fields missing"});
}

let imageUrl = null;

 if (req.file){
    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {folder: "rentmything"},
            (error, result) => {
                  if(error) reject(error);
            else resolve(result);
            }
        );
        stream.end(req.file.buffer);
    });
    imageUrl = uploadResult.secure_url;
 }
const result = await pool.query('INSERT INTO items (title, description, category, price_per_day, city, owner_id, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', 
    [title, description, category, price_per_day, city, req.user.id, imageUrl]
);

res.json({
    message: "Item created with image",
    item: result.rows[0],
});

 } catch (error) {
        console.error(error);
        res.status(500).json({message: "Error creating item"});
    }
    
});

router.get("/my-items", authMiddleware, async (req, res) => {

    try {
        const result = await pool.query("SELECT * FROM items WHERE owner_id = $1", [req.user.id]);
        
        res.json({
            items: result.rows,
        })
    } catch (error) {
        res.status(500).json({message: " Error fetching items"});
    }
    
});

router.delete("/items/:id", authMiddleware, async (req, res) => {
    try {
        const itemId = req.params.id;
    
        const item = await pool.query(
            "SELECT * FROM items WHERE id = $1",
            [itemId]
        );

        if (item.rows.length === 0) {
            return res.status(404).json({ message: "Item not found" });
        }
       
        if (item.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }
        await pool.query(
            "DELETE FROM items WHERE id = $1",
            [itemId]
        );

        res.json({ message: "Item deleted" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting item" });
    }
});

router.patch("/items/:id", authMiddleware, async (req, res) => {
    try {
        const itemId = Number(req.params.id) ;

         const updates = req.body;

        const item = await pool.query("SELECT * FROM items WHERE id = $1", [itemId]);

        if(item.rows.length === 0){
            return res.status(404).json({message: "item not found"});
        }

        if(item.rows[0].owner_id !== req.user.id){
            return res.status(403).json({message:"Not authorized"});
        }
        
        const fields = [];
        const values = [];
        let count = 1;

const allowedFields = ["title", "description", "category", "price_per_day", "city"];

for (let key in updates) {
  if (!allowedFields.includes(key)) continue;

  fields.push(`${key} = $${count}`);
  values.push(updates[key]);
  count++;
}

        // for( let key in updates){
        //     fields.push(`${key} = $${count}`);
        //     values.push(updates[key]);
        //     count++;
        // }

        values.push(itemId);

        const query = `
  UPDATE items
  SET ${fields.join(", ")}
  WHERE id = $${count}
  RETURNING *
`;

          const result = await pool.query(query, values);

        res.json({
            message: "item updated",
            item: result.rows[0],
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Error updating items"});
    }
});


router.get("/items", async (req,res) => {
    try {
        console.log("QUERY PARAMS:", req.query);

        const {city, category, minPrice, maxPrice, sort } = req.query;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        // const cacheKey = `items:${JSON.stringify(req.query)}`;
        // const cacheData = await redisClient.get(cacheKey);

        // if(cacheData){
        //     console.log("CACHE HIT");
        //      return res.json(JSON.parse(cacheData));
        // }
        
       

        let query = "SELECT * FROM items WHERE 1=1";

        const values = [];
        let count = 1;

        if(city){
             console.log("CITY FILTER TRIGGERED:", city);
            query += ` AND LOWER(city) = LOWER( $${count})`;
            values.push(city);
            count++ ;
        }
        
        if(category){
               console.log("CATEGORY FILTER TRIGGERED:", category);
            query += ` AND LOWER(category) = LOWER($${count})`;
            values.push(category);
            count++ ;
        }

        if(minPrice){
            console.log("MAX PRICE FILTER:", maxPrice);
            query += ` AND price_per_day >= $${count}`;
            values.push(minPrice);
            count++ ;
        }

        if(maxPrice){
            query += ` AND price_per_day <= $${count}`;
            values.push(maxPrice);
            count++ ;
        }
 if(sort === "price_asc") {
    query += " ORDER BY price_per_day ASC";
 } else if (sort === "price_desc"){
    query += " ORDER BY price_per_day DESC";
 }else{
    query += " ORDER BY id DESC";
 }
    console.log("FINAL QUERY:", query);
    console.log("VALUES:", values);

query += ` LIMIT $${count} OFFSET $${count + 1}`;
values.push(limit, offset);

        const result = await pool.query(query, values);

        const responseData = {
            page,
            limit,
            count: result.rows.length,
            items: result.rows,
        };

        // await redisClient.setEx(cacheKey, 60, JSON.stringify(responseData)) //  Set + Expiry

        res.json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Error fetching items"});
    }
});

router.get("/items/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM items WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Item not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching item" });
  }
});

router.get("/items/:id/availability", async (req, res) => {
    try {
        const itemId = req.params.id;
        const {start_date, end_date } = req.query;

        if(!start_date || !end_date){
            return res.status(400).json({message: "Dates required"});
        }

        const overlap = await pool.query(`SELECT * FROM bookings
            WHERE item_id = $1
            AND status = 'confirmed'
            AND (start_date <=$3 AND end_date >= $2)`, [itemId, start_date, end_date]);
            
            if(overlap.rows.length > 0){
                return res.json({available: false});
            }

            res.json({available: true});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Error checking availability"});
    }
});

router.delete("/admin/items/:id", authMiddleware,adminMiddleware, async(req,res) => {

});
export default router;