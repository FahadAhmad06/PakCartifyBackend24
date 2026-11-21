import express from "express";
import { roleBaseAccess, verifyUserAuth } from "../midleware/userAuth.js";
import { createOrder, getAllOrders, getSingleOrder, myOrders , updateOrderStatus, deleteOrder, cancelMyOrder} from "../controller/orderController.js";

const router = express.Router();

router.route("/new/order").post(verifyUserAuth, createOrder);

router.route("/admin/order/:id")
.get(verifyUserAuth,roleBaseAccess("admin") ,getSingleOrder)
.put(verifyUserAuth,roleBaseAccess("admin") ,updateOrderStatus);

router.route("/admin/order/:id").put(verifyUserAuth, roleBaseAccess("admin"), updateOrderStatus)
.delete(verifyUserAuth, roleBaseAccess("admin"), deleteOrder);



router.route("/admin/orders").get(verifyUserAuth,roleBaseAccess("admin") ,getAllOrders );

// ⚠️ /order/user MUST be before /order/:id — otherwise Express treats "user" as the :id param
router.route("/order/user").get(verifyUserAuth,myOrders);

router.route("/order/:id")
.get(verifyUserAuth,getSingleOrder)
.delete(verifyUserAuth, cancelMyOrder)


export default router;