const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true },
    image: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

categorySchema.index({ slug: 1 });

module.exports = mongoose.model('Category', categorySchema);
