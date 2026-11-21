import express from "express";
import { getAllproducts, createProduct, updateProduct, deleteProduct, getSingleProductDetails, getAdminProducts , createReviewandUpdate, getAllReviews, deleteReview} from "../controller/productController.js";
import {roleBaseAccess ,verifyUserAuth} from "../midleware/userAuth.js";

const router = express.Router();


// ! Product Routes

router.route("/products")
.get(getAllproducts);

router.route("/admin/products")
.get(verifyUserAuth, roleBaseAccess("admin"), getAdminProducts);

router.route("/admin/product/create").post( verifyUserAuth,roleBaseAccess("admin"), createProduct);

router.route("/admin/products/:id")
.put(verifyUserAuth,roleBaseAccess("admin"), updateProduct)
.delete(verifyUserAuth, roleBaseAccess("admin"), deleteProduct)


router.route("/product/:id").get(getSingleProductDetails);

router.route("/review").put(verifyUserAuth, createReviewandUpdate);
router.route("/admin/reviews").get(verifyUserAuth, roleBaseAccess("admin"),getAllReviews)
.delete(verifyUserAuth,roleBaseAccess("admin"), deleteReview);


export default router;