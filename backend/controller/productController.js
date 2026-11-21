import Product from "../model/productModel.js"
import HandleError from "../utils/handlerror.js"
import handleAsyncError from "../midleware/handleasyncerror.js";
import APIFunctionality from "../utils/apiFunctionality.js";
import {v2 as cloudinary} from "cloudinary";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

// Parse variants from FormData string
function parseVariants(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Convert FormData strings into proper hasVariants / variants values.
// Total stock is calculated by the model's pre("validate") hook.
// If hasVariants was not sent at all, nothing is touched (safe for partial updates).
function applyVariantFields(body) {
    if (body.hasVariants === undefined) return;

    const has = body.hasVariants === "true" || body.hasVariants === true;
    body.hasVariants = has;
    body.variants    = has ? parseVariants(body.variants) : [];
}

async function uploadImages(files) {
    if (!Array.isArray(files)) files = [files];

    const imageLinks = [];
    for (let i = 0; i < files.length; i++) {
        const fileBase64 = `data:${files[i].mimetype};base64,${files[i].data.toString("base64")}`;
        const result     = await cloudinary.uploader.upload(fileBase64, { folder: "products" });
        imageLinks.push({ public_id: result.public_id, url: result.secure_url });
    }
    return imageLinks;
}

async function destroyImages(publicIds) {
    for (const id of publicIds) {
        try { await cloudinary.uploader.destroy(id); } catch { /* ignore cleanup errors */ }
    }
}


function parseJSON(raw, fallback) {
    if (!raw) return fallback;
    if (typeof raw !== "string") return raw;
    try { return JSON.parse(raw); } catch { return fallback; }
}

// Every Cloudinary public_id currently used by a product
function collectIds(product) {
    const ids = new Set();
    (product.image || []).forEach(i => ids.add(i.public_id));
    (product.colors || []).forEach(c => (c.images || []).forEach(i => ids.add(i.public_id)));
    if (product.sizeChart?.public_id) ids.add(product.sizeChart.public_id);
    return ids;
}

// Handles colors (+ their images, sent as colorImages_<index>) and sizeChartImage.
// existing = colors already saved on the product (update only) so their images are kept.
// Every newly uploaded public_id is pushed to `uploaded` for cleanup on failure.
async function processMedia(req, uploaded, existingColors = []) {
    const result = {};
    const colors = parseJSON(req.body.colors, []);

    if (Array.isArray(colors) && colors.length > 0) {
        result.colors = [];
        for (let i = 0; i < colors.length; i++) {
            const c    = colors[i];
            const prev = existingColors.find(e => e.name === c.name);
            const images = prev
                ? prev.images.map(img => ({ public_id: img.public_id, url: img.url }))
                : [];

            const files = req.files?.[`colorImages_${i}`];
            if (files) {
                const links = await uploadImages(files);
                uploaded.push(...links.map(l => l.public_id));
                images.push(...links);
            }

            result.colors.push({ name: c.name, hex: c.hex || "#cccccc", images });
        }
    }

    if (req.files?.sizeChartImage) {
        const [link] = await uploadImages(req.files.sizeChartImage);
        uploaded.push(link.public_id);
        result.sizeChart = link;
    }

    return result;
}

// ─────────────────────────────────────────────────────────────
// Create Product -- Admin
// ─────────────────────────────────────────────────────────────
export const createProduct = handleAsyncError(async (req, res, next) => {

    req.body.user = req.user.id;
    if (req.body.hasVariants === undefined) req.body.hasVariants = false;
    applyVariantFields(req.body);

    // Color-wise images replace the main image upload when colors are used
    const colors    = req.body.hasVariants ? parseJSON(req.body.colors, []) : [];
    const colorMode = Array.isArray(colors) && colors.length > 0;

    if (colorMode) {
        const missing = colors.filter((c, i) => !req.files?.[`colorImages_${i}`]).map(c => c.name);
        if (missing.length > 0) {
            return next(new HandleError(`Please upload at least one image for: ${missing.join(", ")}`, 400));
        }
    } else if (!req.files || !req.files.image) {
        return next(new HandleError("Please upload at least one product image", 400));
    }

    const uploaded = [];
    let product;

    try {
        if (colorMode) {
            const media = await processMedia(req, uploaded);
            req.body.colors = media.colors;
            // Flattened so product cards / old pages that use image[0] keep working
            req.body.image  = media.colors.flatMap(c => c.images);
            if (media.sizeChart) req.body.sizeChart = media.sizeChart;
        } else {
            const links = await uploadImages(req.files.image);
            uploaded.push(...links.map(l => l.public_id));
            req.body.image  = links;
            req.body.colors = [];
        }

        product = await Product.create(req.body);
    } catch (err) {
        console.error("CREATE PRODUCT ERROR:", err);
        // Don't leave orphan images in Cloudinary
        await destroyImages(uploaded);
        if (err.http_code) return next(new HandleError(`Image upload failed: ${err.message}`, 500));
        throw err;
    }

    res.status(201).json({ success: true, product });
})

// ─────────────────────────────────────────────────────────────
// Get All Products
// ─────────────────────────────────────────────────────────────
export const getAllproducts = handleAsyncError(async (req, res, next) => {

    const resultsPerPage = 20;
    const apiFeatures = new APIFunctionality(Product.find(), req.query).search().filter();

    const filteredQuery  = apiFeatures.query.clone();
    const ProductsCount  = await filteredQuery.countDocuments();
    const totalPages     = Math.ceil(ProductsCount / resultsPerPage);
    const Page           = Number(req.query.page) || 1;

    if (Page > totalPages && ProductsCount > 0) {
        return next(new HandleError("This page does not exist", 404));
    }

    apiFeatures.pagination(resultsPerPage);
    const products = await apiFeatures.query;

    if (!products || products.length === 0) {
        return next(new HandleError("Products Not Found", 404));
    }

    res.status(200).json({ success: true, products, ProductsCount, resultsPerPage, totalPages, CurrentPage: Page });
})


// ─────────────────────────────────────────────────────────────
// Update Product -- Admin
// Uses document.save() (not findByIdAndUpdate) so the model's
// pre("validate") hook runs: stock sync, duplicate variants,
// original price checks.
// ─────────────────────────────────────────────────────────────
export const updateProduct = handleAsyncError(async (req, res, next) => {

    const product = await Product.findById(req.params.id);
    if (!product) return next(new HandleError("Product Not Found", 404));

    // Never let the client overwrite these
    ["user", "reviews", "ratings", "numOfReviews", "createdAt", "_id"].forEach(k => delete req.body[k]);

    const oldIds   = collectIds(product);
    const uploaded = [];

    try {
        // New main images replace the old ones
        if (req.files && req.files.image) {
            const links = await uploadImages(req.files.image);
            uploaded.push(...links.map(l => l.public_id));
            req.body.image = links;
        }

        applyVariantFields(req.body);

        if (req.body.hasVariants === false) {
            req.body.colors = [];
        } else if (req.body.colors !== undefined || req.files?.sizeChartImage) {
            const existing = product.colors.map(c => ({
                name: c.name,
                images: c.images.map(i => ({ public_id: i.public_id, url: i.url })),
            }));
            const media = await processMedia(req, uploaded, existing);

            if (media.colors) {
                req.body.colors = media.colors;
                if (!req.files?.image) req.body.image = media.colors.flatMap(c => c.images);
            } else {
                delete req.body.colors;
            }
            if (media.sizeChart) req.body.sizeChart = media.sizeChart;
        }

        product.set(req.body);
        await product.save();
    } catch (err) {
        await destroyImages(uploaded);
        if (err.http_code) return next(new HandleError(`Image upload failed: ${err.message}`, 500));
        throw err;
    }

    // Remove only images that are no longer used anywhere on the product
    const newIds = collectIds(product);
    await destroyImages([...oldIds].filter(id => !newIds.has(id)));

    res.status(200).json({ success: true, message: "Product Updated Successfully", product });
});


// ─────────────────────────────────────────────────────────────
// Delete Product -- Admin
// ─────────────────────────────────────────────────────────────
export const deleteProduct = handleAsyncError(async (req, res, next) => {

    const product = await Product.findById(req.params.id)
    if (!product) return next(new HandleError("Product Not Found", 404));

    await destroyImages([...collectIds(product)]);

    await product.deleteOne();
    res.status(200).json({ success: true, message: "Product Deleted Successfully" })
})

// ─────────────────────────────────────────────────────────────
// Get Single Product Details
// ─────────────────────────────────────────────────────────────
export const getSingleProductDetails = handleAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
    if (!product) return next(new HandleError("Product Not Found", 404));
    res.status(200).json({ success: true, product })
})


// ─────────────────────────────────────────────────────────────
// Get All Products (Admin)
// ─────────────────────────────────────────────────────────────
export const getAdminProducts = handleAsyncError(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).json({ success: true, products })
})


// ─────────────────────────────────────────────────────────────
// Create / Update Review
// ─────────────────────────────────────────────────────────────
export const createReviewandUpdate = handleAsyncError(async (req, res, next) => {

    const { rating, comment, productId } = req.body

    const review = {
        user:    req.user._id,
        name:    req.user.name,
        rating:  Number(rating),
        comment
    }

    const product = await Product.findById(productId);
    if (!product) return next(new HandleError("Product Not Found", 400));

    const reviewExist = product.reviews.find(r => r.user.toString() === req.user.id.toString());

    if (reviewExist) {
        product.reviews.forEach(r => {
            if (r.user.toString() === req.user.id.toString()) {
                r.rating  = rating;
                r.comment = comment;
            }
        })
    } else {
        product.reviews.push(review);
    }

    product.numOfReviews = product.reviews.length;
    let sum = 0;
    product.reviews.forEach(r => { sum += r.rating; });
    product.ratings = product.reviews.length ? sum / product.reviews.length : 0;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: "Review Added/Updated Successfully" })
})


// ─────────────────────────────────────────────────────────────
// Get All Reviews of a Product
// ─────────────────────────────────────────────────────────────
export const getAllReviews = handleAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    if (!product) return next(new HandleError("Product Not Found", 400));
    res.status(200).json({ success: true, reviews: product.reviews })
})

// ─────────────────────────────────────────────────────────────
// Delete Review of a Product
// ─────────────────────────────────────────────────────────────
export const deleteReview = handleAsyncError(async (req, res, next) => {

    const product = await Product.findById(req.query.productId);
    if (!product) return next(new HandleError("Product Not Found", 400));

    const reviews = product.reviews.filter(
        r => r._id.toString() !== req.query.id.toString()
    );

    let sum = 0;
    reviews.forEach(r => { sum += r.rating; });
    const ratings      = reviews.length === 0 ? 0 : sum / reviews.length;
    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(
        req.query.productId,
        { reviews, ratings, numOfReviews },
        { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: "Review Deleted Successfully" });
});