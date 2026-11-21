import Order from "../model/ordermodel.js";
import Product from "../model/productModel.js";
import handleAsyncError from "../midleware/handleasyncerror.js";
import HandleError from "../utils/handlerror.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderConfirmationEmailTemplate, orderDeliveredEmailTemplate } from "../utils/emaiTemplate.js";

// ─────────────────────────────────────────────────────────────
// Helper: decrement variant stock (if product has variants)
//         or flat product stock (if no variants).
// Called when an order is marked as "Shipped".
// ─────────────────────────────────────────────────────────────
async function decrementStock(productId, quantity, color, size) {
    const product = await Product.findById(productId);
    if (!product) {
        console.error(`Product ${productId} not found during stock decrement`);
        return;
    }

    if (product.hasVariants && product.variants.length > 0 && color && size) {
        const variant = product.variants.find(
            v => v.color === color && v.size === size
        );
        if (variant) {
            variant.stock = Math.max(0, variant.stock - quantity);
        } else {
            console.warn(`Variant ${color}/${size} not found on product ${productId}`);
        }
        // Recalculate total stock from all variants
        product.stock = product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    } else {
        product.stock = Math.max(0, product.stock - quantity);
    }

    await product.save({ validateBeforeSave: false });
}

// ─────────────────────────────────────────────────────────────
// Helper: restore stock (used on cancel/delete order)
// ─────────────────────────────────────────────────────────────
async function restoreStock(productId, quantity, color, size) {
    const product = await Product.findById(productId);
    if (!product) return;

    if (product.hasVariants && product.variants.length > 0 && color && size) {
        const variant = product.variants.find(
            v => v.color === color && v.size === size
        );
        if (variant) {
            variant.stock = variant.stock + quantity;
        }
        product.stock = product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    } else {
        product.stock = product.stock + quantity;
    }

    await product.save({ validateBeforeSave: false });
}

// ─────────────────────────────────────────────────────────────
// Create New Order
// ─────────────────────────────────────────────────────────────
export const createOrder = handleAsyncError(async (req, res, next) => {

    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        couponCode,
        discountAmount,
    } = req.body;

    // Validate stock for every item before creating the order
    for (const item of orderItems) {
        const product = await Product.findById(item.product);

        if (!product) {
            return next(new HandleError(`Product not found: ${item.product}`, 404));
        }

        if (product.hasVariants && product.variants.length > 0 && item.color && item.size) {
            // Variant-level stock check
            const variant = product.variants.find(
                v => v.color === item.color && v.size === item.size
            );
            if (!variant) {
                return next(new HandleError(`Variant ${item.color}/${item.size} not found`, 400));
            }
            if (variant.stock < 1) {
                return next(new HandleError(
                    `${product.name} (${item.color} / ${item.size}) is out of stock`, 400
                ));
            }
            if (variant.stock < item.quantity) {
                return next(new HandleError(
                    `Only ${variant.stock} items available for ${product.name} (${item.color} / ${item.size})`, 400
                ));
            }
        } else {
            // Flat stock check
            if (product.stock < 1) {
                return next(new HandleError(`${product.name} is out of stock`, 400));
            }
            if (product.stock < item.quantity) {
                return next(new HandleError(`Only ${product.stock} items left for ${product.name}`, 400));
            }
        }
    }

    // Create the order
    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        couponCode,
        discountAmount,
        paidAt: Date.now(),
        user: req.user._id,
    });

    // NOTE: Stock is NOT decremented here.
    // It is decremented when admin marks the order as "Shipped".

    // Send confirmation email
    try {
        const html = orderConfirmationEmailTemplate({
            name: req.user.name,
            orderId: order._id,
            orderItems: order.orderItems,
            shippingInfo: order.shippingInfo,
            itemsPrice: order.itemsPrice,
            taxPrice: order.taxPrice,
            shippingPrice: order.shippingPrice,
            discountAmount: order.discountAmount,
            totalPrice: order.totalPrice,
            paymentMethod: order.paymentInfo.id,
            orderDate: order.createdAt,
        });

        await sendEmail({
            email: req.user.email,
            subject: `Order Confirmed – PakCartify #${order._id.toString().slice(-6).toUpperCase()}`,
            html,
        });
    } catch (error) {
        console.error("Order confirmation email failed:", error.message);
    }

    res.status(201).json({ success: true, order });
});

// ─────────────────────────────────────────────────────────────
// Get Single Order
// ─────────────────────────────────────────────────────────────
export const getSingleOrder = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return next(new HandleError("Order Not Found with this Id", 404));
    res.status(200).json({ success: true, order });
});

// ─────────────────────────────────────────────────────────────
// My Orders
// ─────────────────────────────────────────────────────────────
export const myOrders = handleAsyncError(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id });
    if (!orders) return next(new HandleError("No Orders Found", 404));
    res.status(200).json({ success: true, orders });
});

// ─────────────────────────────────────────────────────────────
// Get All Orders (Admin)
// ─────────────────────────────────────────────────────────────
export const getAllOrders = handleAsyncError(async (req, res, next) => {
    const orders = await Order.find().populate("user", "name email");
    let totalAmount = 0;
    orders.forEach(order => { totalAmount += order.totalPrice; });
    res.status(200).json({ success: true, orders, totalAmount });
});

// ─────────────────────────────────────────────────────────────
// Update Order Status (Admin)
// Stock is decremented HERE when status changes to "Shipped".
// ─────────────────────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("user", "name email");
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const previousStatus = order.orderStatus;
        const newStatus      = req.body.status;

        const wasDelivered = previousStatus === "Delivered";

        order.orderStatus = newStatus;
        if (newStatus === "Delivered") order.deliveredAt = Date.now();

        await order.save({ validateBeforeSave: false });

        // ── Decrement stock when order is first marked as Shipped ──
        // Only decrement once: when moving FROM a pre-ship status TO "Shipped".
        const preShipStatuses = ["Processing"];
        if (newStatus === "Shipped" && preShipStatuses.includes(previousStatus)) {
            for (const item of order.orderItems) {
                await decrementStock(item.product, item.quantity, item.color, item.size);
            }
        }

        // ── Send delivered email ────────────────────────────────────
        if (newStatus === "Delivered" && !wasDelivered && order.user?.email) {
            try {
                const html = orderDeliveredEmailTemplate({
                    name: order.user.name,
                    orderId: order._id,
                    orderItems: order.orderItems,
                    deliveredAt: order.deliveredAt,
                });
                await sendEmail({
                    email: order.user.email,
                    subject: `Order Delivered – Share Your Review | PakCartify #${order._id.toString().slice(-6).toUpperCase()}`,
                    html,
                });
            } catch (error) {
                console.error("Delivered email failed:", error.message);
            }
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// Delete Order (Admin) — restores stock
// ─────────────────────────────────────────────────────────────
export const deleteOrder = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new HandleError("Order Not Found with this Id", 404));

    if (!["Processing", "Shipped", "Delivered"].includes(order.orderStatus)) {
        return next(new HandleError("Only Processing, Shipped, or Delivered orders can be deleted", 400));
    }

    // Only restore stock if the order was already Shipped or Delivered
    // (stock was decremented at Shipped status, so restore only then)
    if (["Shipped", "Delivered"].includes(order.orderStatus)) {
        for (const item of order.orderItems) {
            await restoreStock(item.product, item.quantity, item.color, item.size);
        }
    }

    await order.deleteOne();
    res.status(200).json({ success: true, message: "Order Deleted Successfully" });
});

// ─────────────────────────────────────────────────────────────
// Cancel My Order (User) — restores stock
// ─────────────────────────────────────────────────────────────
export const cancelMyOrder = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new HandleError("Order Not Found with this Id", 404));

    if (order.user.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to cancel this order", 403));
    }

    if (order.orderStatus !== "Processing") {
        return next(new HandleError("Only Processing orders can be cancelled", 400));
    }

    // Stock was NOT yet decremented for Processing orders (decrement happens at Shipped),
    // so no stock restore is needed here.

    await order.deleteOne();
    res.status(200).json({ success: true, message: "Order cancelled successfully" });
});
