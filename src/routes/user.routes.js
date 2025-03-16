import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

// const router = Router();
const userRouter = Router();

userRouter.route("/register").post(registerUser)

// export default router;
export default userRouter