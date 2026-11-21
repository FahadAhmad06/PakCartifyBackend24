import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  color: { type: String, trim: true, default: "Default" },
  size:  { type: String, trim: true, default: "Standard" },
  stock: { type: Number, default: 0, min: [0, "Variant stock cannot be negative"] },
  price: { type: Number, default: null, min: [0, "Variant price cannot be negative"] },
  sku:   { type: String, trim: true, default: "" },
});

// One entry per selected color, with its own images
const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  hex:  { type: String, default: "#cccccc" },
  images: [
    {
      public_id: { type: String, required: true },
      url:       { type: String, required: true },
    },
  ],
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Product Name"],
    trim: true,
    maxLength: [100, "Product name cannot exceed 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Please Enter Product Description"],
    trim: true,
    maxLength: [200, "Product description cannot exceed 200 characters"], // matches the form
  },
  price: {
    type: Number,
    required: [true, "Please Enter Product Price"],
    min: [0, "Product price cannot be negative"],
    max: [9999999, "Product price cannot exceed 7 digits"], // maxLength doesn't work on Number
  },
  originalPrice: {
    type: Number,
    default: null,
    min: [0, "Original price cannot be negative"],
  },
  showOriginalPrice: {
    type: Boolean,
    default: false,
  },
  ratings: {
    type: Number,
    default: 0,
  },
  image: [
    {
      public_id: { type: String, required: true },
      url:       { type: String, required: true },
    },
  ],
  category: {
    type: String,
    required: [true, "Please Enter Product Category"],
  },
  subcategory: {
    type: String,
    required: [true, "Please Enter Product Sub Category"], // form marks it required
  },
  // Total stock. When hasVariants is true this is auto-calculated from variants.
  stock: {
    type: Number,
    required: [true, "Please Enter Product Stock"],
    default: 0,
    min: [0, "Stock cannot be negative"],
  },
  // ── Variant System ──────────────────────────────────────
  hasVariants: {
    type: Boolean,
    default: false,
  },
  variants: {
    type: [variantSchema],
    default: [],
  },
  colors: {
    type: [colorSchema],
    default: [],
  },
  // Optional size chart picture shown on the product page
  sizeChart: {
    public_id: { type: String, default: "" },
    url:       { type: String, default: "" },
  },
  // ────────────────────────────────────────────────────────
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user:    { type: mongoose.Schema.ObjectId, ref: "User", required: true },
      name:    { type: String, required: true },
      rating:  { type: Number, required: true },
      comment: { type: String, required: true },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // was Date.now() which froze the date at server start
  },
});

// Keep variants and stock consistent with what CreateProduct sends
productSchema.pre("validate", function () {
  // Discount price only makes sense if it is higher than the selling price
  if (this.showOriginalPrice && this.originalPrice != null && this.originalPrice <= this.price) {
    this.invalidate("originalPrice", "Original price must be greater than price");
  }
  if (!this.showOriginalPrice) {
    this.originalPrice = null;
  }

  if (this.hasVariants) {
    if (!this.variants || this.variants.length === 0) {
      this.invalidate("variants", "Add at least one variant");
    } else {
      // No duplicate color + size combinations
      const keys = this.variants.map(
        (v) => `${String(v.color).toLowerCase()}|${String(v.size).toLowerCase()}`
      );
      if (new Set(keys).size !== keys.length) {
        this.invalidate("variants", "Each variant must have a unique color and size combination");
      }
      // Total stock = sum of variant stock
      this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
  } else {
    this.variants = [];
    this.colors = [];
  }
});

export default mongoose.model("Product", productSchema);