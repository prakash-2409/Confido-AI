/**
 * Career Coach Controller
 * 
 * Exposes endpoints to retrieve history, send a message/action, and clear conversation logs.
 */

const CoachChat = require('../models/CoachChat');
const coachService = require('../services/coachService');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Get current user's chat history
 */
const getHistory = async (req, res, next) => {
    try {
        const userId = req.userId;
        let chat = await CoachChat.findOne({ user: userId });
        
        if (!chat) {
            // Return empty messages list
            chat = new CoachChat({ user: userId, messages: [] });
            await chat.save();
        }

        res.json({
            success: true,
            data: {
                messages: chat.messages
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Send a new chat message or trigger a quick action
 */
const sendMessage = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { message, action } = req.body;

        if (!message && !action) {
            throw new ApiError(400, 'Either message or action parameter must be provided');
        }

        const result = await coachService.processMessage(userId, message, action);

        res.json({
            success: true,
            data: {
                response: result.assistantMessage.text,
                message: result.assistantMessage,
                userMessage: result.userMessage,
                messages: result.history
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Clear the user's chat history
 */
const clearHistory = async (req, res, next) => {
    try {
        const userId = req.userId;
        let chat = await CoachChat.findOne({ user: userId });
        
        if (chat) {
            chat.messages = [];
            await chat.save();
        }

        res.json({
            success: true,
            message: 'Chat history cleared successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getHistory,
    sendMessage,
    clearHistory
};
