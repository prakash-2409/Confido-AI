const mongoose = require('mongoose');

const scoreSnapshotSchema = new mongoose.Schema({
    readinessScore: { type: Number, required: true },
    atsScore: { type: Number, required: true },
    githubScore: { type: Number, required: true },
    projectsScore: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const historyTimelineSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        scores: [scoreSnapshotSchema]
    },
    {
        timestamps: true
    }
);

const HistoryTimeline = mongoose.model('HistoryTimeline', historyTimelineSchema);

module.exports = HistoryTimeline;
