const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    shortDescription: { type: String, default: '', maxlength: 300 },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // original price
    discountPrice: { type: Number, min: 0 }, // final selling price
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    images: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

productSchema.pre('validate', function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 7);
  }
  // Auto-calc discount percent if discountPrice is set
  if (this.discountPrice && this.price) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  next();
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);
