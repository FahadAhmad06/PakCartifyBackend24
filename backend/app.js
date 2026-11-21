import express from 'express';
import cors from 'cors';
import HandleError from './utils/handlerror.js';
import product from './router/productRoutes.js';
import user from './router/userRoutes.js';
import order from './router/orderrouter.js';
import cookieParser from "cookie-parser";
import fileUpload from 'express-fileupload';
import chat from './router/chatRoute.js';



const app = express();

//Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: false,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  abortOnLimit: true,
  limitHandler: (req, res, next) => {
    next(new HandleError('Each image must be under 5MB', 400));
  },
}));

// Route
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1/chat", chat);

// ✅ Error middleware directly here — no separate file needed
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  if(err.name === "CastError"){
    const message = `This is a Invalid resource ${err.path}`;
    err = new HandleError(message, 404);
  }

  if(err.code === 11000){
    const message  = `This ${Object.keys(err.keyValue)} already registered. Please login to Continue.`
    err = new HandleError(message, 400);
  }
  
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
});

export default app;