
import express from "express";
import {registerUser, verifyRegistrationOtp, resendRegistrationOtp, loginUser, logoutUser, requestPasswordReset, resetPassword, getUserDetails, updatePassword, updateUserDetails, getUsersList, getSingleUser, updateUserRole,  deleteUser, toggleFavorite, removeFavorite,getMyFavorites, removeAllFavorites} from "../controller/userController.js";
import { roleBaseAccess, verifyUserAuth } from "../midleware/userAuth.js";




const router = express.Router();

router.route("/register").post(registerUser);
router.route("/register/verify").post(verifyRegistrationOtp);
router.route("/register/resend-otp").post(resendRegistrationOtp);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/password/forgot").post(requestPasswordReset);
router.route("/reset/:token").post(resetPassword);
router.route("/profile").get(verifyUserAuth, getUserDetails);
router.route("/password/update").put(verifyUserAuth, updatePassword);
router.route("/profile/update").put(verifyUserAuth, updateUserDetails);
router.route("/Admin/user").get(verifyUserAuth, roleBaseAccess("admin"),getUsersList);


router.route("/admin/user/:id")
.get(verifyUserAuth, roleBaseAccess("admin"),getSingleUser);
router.route("/admin/user/:id")
.put(verifyUserAuth, roleBaseAccess("admin"),updateUserRole)
.delete(verifyUserAuth, roleBaseAccess("admin"),deleteUser)


//  fav product
router.route("/favorite/toggle/:productId").post(verifyUserAuth, toggleFavorite);
router.route("/favorite/:productId").delete(verifyUserAuth, removeFavorite);
router.route("/favorites/me").get(verifyUserAuth, getMyFavorites);
router.route("/favorites/remove-all").delete(verifyUserAuth, removeAllFavorites);


export default router; 