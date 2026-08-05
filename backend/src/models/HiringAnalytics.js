const mongoose = require('mongoose');

const funnelStageSchema = new mongoose.Schema({
    stage: { type: String, required: true },
    count: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
}, { _id: false });

const skillTrendSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    demand: { type: Number, default: 0 },
    supply: { type: Number, default: 0 }
}, { _id: false });

const hiringMetricSchema = new mongoose.Schema({
    label: { type: String, required: true },
    value: { type: String, required: true },
    change: { type: String, required: true },
    positive: { type: Boolean, default: true }
}, { _id: false });

const hiringAnalyticsSchema = new mongoose.Schema({
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    metrics: [hiringMetricSchema],
    funnelData: [funnelStageSchema],
    skillTrends: [skillTrendSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('HiringAnalytics', hiringAnalyticsSchema);
