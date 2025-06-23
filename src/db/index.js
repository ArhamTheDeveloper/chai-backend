import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    // console.log(connectionInstance)
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:\n", error.message || error);
    process.exit(1);
  }
};

// Above function just with promises
// const connectDB = () => {
//   return mongoose
//     .connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     .then((connectionInstance) => {
//       console.log(
//         `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
//       );
//       return connectionInstance;
//     })
//     .catch((error) => {
//       console.error("MongoDB connection failed:\n", error.message || error);
//       process.exit(1);
//     });
// };



export default connectDB;
