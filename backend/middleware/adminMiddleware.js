const adminMiddleware = (req,res, next) => {
    if(req.user.role!= "admin"){
        return res.stauts(403).json({
            message: "Admin access required"
        });
    }
    next();
};

export default adminMiddleware;

