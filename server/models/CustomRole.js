/**
 * Enterprise Custom Role Model
 * Author: Axiocruit Enterprise Integration Platform
 */

const mongoose = require('mongoose');

const customRoleSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  permissions: [
    {
      type: String,
      trim: true,
    },
  ],
  isSystemDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

customRoleSchema.index({ organization: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CustomRole', customRoleSchema);
