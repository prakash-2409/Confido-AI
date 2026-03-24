/**
 * User Model
 * 
 * Mongoose schema for user data with:
 * - Email validation and uniqueness
 * - Password hashing (bcrypt)
 * - Profile data
 * - Timestamps
 * - Method to compare passwords
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        // Authentication fields
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't return password by default in queries
        },

        // Profile information
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },

        // Optional profile fields
        phone: {
            type: String,
            trim: true,
            default: null,
        },

        // Career information
        currentRole: {
            type: String,
            trim: true,
            default: null,
        },
        targetRole: {
            type: String,
            trim: true,
            default: null,
        },
        experienceYears: {
            type: Number,
            min: 0,
            default: 0,
        },

        // Account status
        isActive: {
            type: Boolean,
            default: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        // Role-based access
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },

        // Email verification
        emailVerificationCode: {
            type: String,
            select: false,
        },
        emailVerificationToken: {
            type: String,
            select: false,
        },
        emailVerificationExpires: {
            type: Date,
            select: false,
        },

        // Password reset
        passwordResetCode: {
            type: String,
            select: false,
        },
        passwordResetToken: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },

        // Subscription
        subscription: {
            plan: {
                type: String,
                enum: ['free', 'pro', 'enterprise'],
                default: 'free',
            },
            stripeCustomerId: {
                type: String,
                default: null,
            },
            stripeSubscriptionId: {
                type: String,
                default: null,
            },
            currentPeriodEnd: {
                type: Date,
                default: null,
            },
            cancelAtPeriodEnd: {
                type: Boolean,
                default: false,
            },
        },

        // Profile completion tracking
        profileCompleteness: {
            type: Number,
            min: 0,
            max: 100,
            default: 30, // After registration: name + email
        },

        // Resume tracking
        hasUploadedResume: {
            type: Boolean,
            default: false,
        },

        // Refresh tokens (for JWT refresh)
        refreshTokens: [{
            token: String,
            createdAt: {
                type: Date,
                default: Date.now,
            },
            expiresAt: Date,
        }],

        // Last login tracking
        lastLogin: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
        toJSON: {
            transform: function (doc, ret) {
                // Remove sensitive fields from JSON responses
                delete ret.password;
                delete ret.refreshTokens;
                delete ret.__v;
                delete ret.emailVerificationCode;
                delete ret.emailVerificationToken;
                delete ret.emailVerificationExpires;
                delete ret.passwordResetCode;
                delete ret.passwordResetToken;
                delete ret.passwordResetExpires;
                return ret;
            },
        },
    }
);

/**
 * Pre-save middleware to hash password
 * Only hashes if password is modified
 */
userSchema.pre('save', async function (next) {
    // Only hash password if it's new or modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Instance method to compare password
 * @param {string} candidatePassword - Password to check
 * @returns {Promise<boolean>} - True if password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

/**
 * Instance method to add refresh token
 * @param {string} token - Refresh token
 * @param {number} expiresIn - Expiry time in milliseconds
 */
userSchema.methods.addRefreshToken = function (token, expiresIn) {
    const expiresAt = new Date(Date.now() + expiresIn);

    this.refreshTokens.push({
        token,
        createdAt: new Date(),
        expiresAt,
    });

    // Keep only last 5 refresh tokens (user can be logged in on 5 devices)
    if (this.refreshTokens.length > 5) {
        this.refreshTokens = this.refreshTokens.slice(-5);
    }
};

/**
 * Instance method to remove refresh token
 * @param {string} token - Refresh token to remove
 */
userSchema.methods.removeRefreshToken = function (token) {
    this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

/**
 * Instance method to remove expired refresh tokens
 */
userSchema.methods.removeExpiredTokens = function () {
    const now = new Date();
    this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > now);
};

/**
 * Static method to find user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

/**
 * Index for faster email lookups
 */
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
