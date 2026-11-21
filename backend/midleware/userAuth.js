
import handleasyncerror from "./handleasyncerror.js";
import jwt from "jsonwebtoken";
import user from "../model/userModel.js";
import HandleError from "../utils/handlerror.js";

export const verifyUserAuth = handleasyncerror(async (req, res, next) => {
    const token = req.cookies.token;
    console.log(token);
    if(!token){
        return next(new HandleError("Please Login to Access this Resource", 401)); 
    }

    const decodedData = jwt.verify(token,process.env.JWT_SECRET_KEY);
    console.log(decodedData);
    req.user = await user.findById(decodedData.id);
    next();
})

export const roleBaseAccess = (...roles) => {
return (req, res, next) => {
    if(!roles.includes(req.user.role)){
        return next(new HandleError(`Role - ${req.user.role} is not allowed to access this resource`, 403));
    }
    next();
}
}
    
