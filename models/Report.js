const mongoose = require('mongoose');

// Day schema for daily activities
const daySchema = new mongoose.Schema({
  date: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  namaz: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  hifz: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  nazra: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  tafseer: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  hadees: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  literature: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  darsiKutab: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  karkunaanMulakaat: {
    type: Number,
    default: 0,
    min: 0
  },
  amoomiAfraadMulakaat: {
    type: Number,
    default: 0,
    min: 0
  },
  khatootTadaad: {
    type: Number,
    default: 0,
    min: 0
  },
  ghrKaKaam: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  }
});

// Q&A schema
const qaSchema = new mongoose.Schema({
  q1: { type: String, default: '' },
  q2: { type: String, default: '' },
  q3: { type: String, default: '' },
  q4: { type: String, default: '' },
  q5: { type: String, default: '' },
  q6: { type: String, default: '' },
  q7: { type: String, default: '' },
  q8: { type: String, default: '' },
  q9: { type: String, default: '' },
  q10: { type: String, default: '' },
  q11: { type: String, default: '' },
  q12: { type: String, default: '' },
  q13: { type: String, default: '' },
  q14: { type: String, default: '' },
  q15: { type: String, default: '' },
  q16: { type: String, default: '' },
  q17: { type: String, default: '' },
  q18: { type: String, default: '' },
  q19: { type: String, default: '' },
  q20: { type: String, default: '' },
  q21: { type: String, default: '' },
  q22: { type: String, default: '' },
  q23: { type: String, default: '' },
  q24: { type: String, default: '' },
  q25: { type: String, default: '' },
  q26: { type: String, default: '' },
  q27: { type: String, default: '' },
  q28: { type: String, default: '' }
});

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  days: [daySchema],
  qa: {
    type: Object,
    default: {}
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure unique report per user per month
reportSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema); 