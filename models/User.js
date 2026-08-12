const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['customer'], default: 'customer' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
