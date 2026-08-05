const mongoose = require('mongoose');

const evidenceSourceSchema = new mongoose.Schema({
    source: { type: String, required: true },
    collected: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
}, { _id: false });

const evidenceSummarySchema = new mongoose.Schema({
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sources: [evidenceSourceSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('EvidenceSummary', evidenceSummarySchema);
