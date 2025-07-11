import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("Server encountered an error:", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(` Server is running at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:\n", err.message || err);
  });
