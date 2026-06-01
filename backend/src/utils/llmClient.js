/**
 * LLM Client Utility
 * 
 * Interacts with OpenAI or Google Gemini APIs using raw HTTP requests.
 * Loads keys and provider type from env configuration.
 */

const axios = require('axios');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Call the configured LLM provider (OpenAI or Gemini)
 * @param {string} systemPrompt - Guidelines and context for the AI
 * @param {string} userPrompt - User's query or task description
 * @param {number} [temperature=0.7] - Creativity setting (0.0 to 1.0)
 * @returns {Promise<string|null>} Response text from the LLM or null if failed
 */
const callLLM = async (systemPrompt, userPrompt, temperature = 0.7) => {
    const provider = config.llm.provider?.toLowerCase() || 'openai';
    const model = config.llm.model || 'gpt-4o-mini';

    try {
        if (provider === 'openai') {
            const apiKey = config.llm.openaiApiKey;
            if (!apiKey) {
                logger.warn('OpenAI API Key is missing in configuration.');
                return null;
            }

            logger.info(`Calling OpenAI API with model: ${model}`);
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: temperature,
                    max_tokens: 1500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 25000 // 25s timeout
                }
            );

            return response.data?.choices?.[0]?.message?.content || null;
        } 
        
        if (provider === 'gemini') {
            const apiKey = config.llm.geminiApiKey;
            if (!apiKey) {
                logger.warn('Gemini API Key is missing in configuration.');
                return null;
            }

            // Map standard models if needed, fallback to gemini-1.5-flash
            const geminiModel = model.includes('gemini') ? model : 'gemini-1.5-flash';
            logger.info(`Calling Gemini API with model: ${geminiModel}`);

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
                {
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: userPrompt }]
                        }
                    ],
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: 1500
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 25000
                }
            );

            return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        }

        logger.error(`Unknown LLM provider specified: ${provider}`);
        return null;
    } catch (error) {
        logger.error(`LLM Client Error (${provider}):`, error.response?.data || error.message);
        return null;
    }
};

module.exports = {
    callLLM
};
