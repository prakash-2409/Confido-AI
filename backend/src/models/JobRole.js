const mongoose = require('mongoose');

const expectedProjectSchema = new mongoose.Schema({
    count: { type: Number, default: 2 },
    description: { type: String, default: '' }
}, { _id: false });

const jobRoleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Job role title is required'],
            unique: true,
            trim: true
        },
        requiredSkills: [{
            type: String,
            trim: true
        }],
        preferredSkills: [{
            type: String,
            trim: true
        }],
        softSkills: [{
            type: String,
            trim: true
        }],
        expectedProjects: {
            type: expectedProjectSchema,
            default: () => ({})
        },
        expectedExperience: {
            type: String,
            default: '0-2 years'
        },
        expectedTools: [{
            type: String,
            trim: true
        }],
        expectedTechnologies: [{
            type: String,
            trim: true
        }]
    },
    {
        timestamps: true
    }
);

const JobRole = mongoose.model('JobRole', jobRoleSchema);

module.exports = JobRole;
