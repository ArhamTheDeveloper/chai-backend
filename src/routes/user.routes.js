import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

userRouter.route("/login").post(loginUser);

// secured routes : we are calling it that coz only the authenticated users can access them
userRouter.route("/logout").post(verifyJWT, logoutUser); // middlewares ka game he ye hai ke req fulfil hone se pehle middle main in between aik functionality execute karwalo
userRouter.route("/refresh-token").post(refreshAccessToken)

// export default router;
export default userRouter;
