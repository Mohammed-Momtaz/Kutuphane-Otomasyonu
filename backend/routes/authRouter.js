import express from "express";
import {
    register,
    verifyOtp,
    login,
    logout,
    getUser,
    getAllUsers,
    deleteUser,
    updateUser
} from "../controllers/authController.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getUser);
router.get("/getallusers", isAuthenticated, authorizeRoles("admin"), getAllUsers)
router.delete('/user/:id', isAuthenticated, authorizeRoles('admin'), deleteUser);
router.put('/user/:id', isAuthenticated, authorizeRoles('admin'), updateUser);

export default router;