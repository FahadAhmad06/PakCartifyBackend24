import mongoose from "mongoose";

export const connectMongoDB = () => {
  mongoose
    .connect(process.env.DB_URL)
    .then((data) => {
      console.log(`Mongoose connected with server ${data.connection.host}`);
    })
    .catch((err) => {
      console.log(`Mongoose connection error: ${err}`);
    });
};
