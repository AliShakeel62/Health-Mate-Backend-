// models/reportModel.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportType: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['processing', 'analyzed'],
      default: 'processing',
    },
    analysis: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
