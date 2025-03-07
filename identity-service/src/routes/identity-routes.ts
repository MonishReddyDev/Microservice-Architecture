import express from "express";
import {
  loginUser,
  logoutUser,
  RefreshUserToken,
  registerUser,
} from "../controllers/identity-controller";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/logOut", logoutUser);

router.post("/refreshToken", RefreshUserToken);

export default router;
