import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({message:"No token"});
    }
        const token = authHeader.split(" ")[1];

  if(!token){
   return  res.status(401).json({message:"No token"});
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = decoded;
  next();

    } catch (error) {
        console.error(error);
        return res.status(401).json({message: "Invalid token"});
    }
};

export default authMiddleware;