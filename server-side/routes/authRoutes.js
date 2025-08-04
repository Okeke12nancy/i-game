import express from "express";
import AuthController from "../controllers/AuthController.js";
import ValidationMiddleware from "../middleware/validateMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";
import preventLogoutIfInSession from "../middleware/preventLogoutIfInSession.js";

const authRouter = express.Router();

authRouter.post(
  "/register",
  ValidationMiddleware.validate(ValidationMiddleware.schemas.register),
  AuthController.register
);

authRouter.post(
  "/login",
  ValidationMiddleware.validate(ValidationMiddleware.schemas.login),
  AuthController.login
);

authRouter.get(
  "/profile",
  authMiddleware.authMiddlewares,
  AuthController.getProfile
);

authRouter.post(
  "/logout",
  authMiddleware.authMiddlewares,
  preventLogoutIfInSession,
  AuthController.logout
);

export default authRouter;
