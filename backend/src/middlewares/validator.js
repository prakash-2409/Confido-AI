/**
 * Validation Middleware
 * 
 * Processes express-validator validation results
 * Returns formatted error messages
 */

const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

/**
 * Middleware to check validation results
 * Must be used after express-validator middleware
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value,
        }));

        throw new ApiError(400, 'Validation failed', formattedErrors);
    }

    next();
};

module.exports = {
    validate,
};
