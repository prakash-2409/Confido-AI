/**
 * CoachChat Model
 * 
 * Manages persistent user conversation history with the AI Career Coach,
 * supporting normal messages and specialized structured outputs (e.g. project recommendations, resume edits).
 */

const mongoose = require('mongoose');

const coachChatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // One chat history per user
            index: true,
        },
        messages: [
            {
                sender: {
                    type: String,
                    enum: ['user', 'assistant'],
                    required: true,
                },
                text: {
                    type: String,
                    required: true,
                },
                type: {
                    type: String,
                    enum: ['text', 'resume_improvement', 'project_recommendations', 'readiness_check'],
                    default: 'text',
                },
                // Stores structured data if the message is a specialized recommendation
                data: {
                    type: mongoose.Schema.Types.Mixed,
                    default: null,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const CoachChat = mongoose.model('CoachChat', coachChatSchema);

module.exports = CoachChat;
