/**
 * Mock Authentication Middleware (FOR TESTING ONLY)
 *
 * Adds a fake user to requests to bypass authentication.
 * This allows testing functionality without login.
 *
 * DO NOT USE IN PRODUCTION!
 */

/**
 * Mock user ID for testing
 * You can change this to match an existing user in your database
 */
const MOCK_USER_ID = '000000000000000000000000'; // Replace with real user ID if needed

/**
 * Mock authentication - adds fake user to request
 */
const mockAuth = async (req, res, next) => {
    try {
        // Create a mock user object
        req.user = {
            _id: MOCK_USER_ID,
            id: MOCK_USER_ID,
            email: 'test@example.com',
            name: 'Test User',
            isEmailVerified: true,
            profileCompleteness: 100,
            hasUploadedResume: false,
        };

        req.userId = MOCK_USER_ID;

        next();
    } catch (error) {
        console.error('Mock auth error:', error);
        next(error);
    }
};

module.exports = { mockAuth };
