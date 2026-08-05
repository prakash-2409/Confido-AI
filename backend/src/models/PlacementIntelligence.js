const mongoose = require('mongoose');

const batchStatSchema = new mongoose.Schema({
    batch: { type: String, required: true },
    total: { type: Number, default: 0 },
    placed: { type: Number, default: 0 },
    rate: { type: Number, default: 0 }
}, { _id: false });

const topEmployerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    hires: { type: Number, default: 0 },
    roles: { type: String, default: '' }
}, { _id: false });

const placementIntelligenceSchema = new mongoose.Schema({
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    batchStats: [batchStatSchema],
    topEmployers: [topEmployerSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('PlacementIntelligence', placementIntelligenceSchema);
