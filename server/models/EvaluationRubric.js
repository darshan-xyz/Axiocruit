/**
 * Enterprise Evaluation Rubric Model
 * Multi-criteria structured assessment template for calibrated interviews
 * Author: Axiocruit Enterprise Integration Platform
 */

const mongoose = require('mongoose');

const evaluationRubricSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  criteria: [
    {
      name: { type: String, required: true },
      weight: { type: Number, default: 1.0, min: 0.1, max: 10.0 },
      description: { type: String, default: '' },
      levels: [
        {
          score: { type: Number, min: 1, max: 5 },
          description: { type: String, default: '' },
        },
      ],
    },
  ],
  isDefault: {
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

evaluationRubricSchema.index({ organization: 1, title: 1 });

module.exports = mongoose.model('EvaluationRubric', evaluationRubricSchema);
