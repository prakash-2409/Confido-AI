/**
 * Resume Diff Engine
 * 
 * Compares two resume version snapshots, calculating changes in:
 * - Technical Skills (added/removed)
 * - Projects (new listings)
 * - Score shifts (ATS, readiness, GitHub)
 */

/**
 * Compare two resume versions
 * @param {Object} oldVer - Older resume snapshot
 * @param {Object} newVer - Newer resume snapshot
 * @returns {Object} - Difference delta report
 */
const compareVersions = (oldVer, newVer) => {
    if (!oldVer || !newVer) {
        return {
            addedSkills: [],
            removedSkills: [],
            newProjects: [],
            scoreChanges: {
                readiness: 0,
                ats: 0,
                github: 0,
                projects: 0
            },
            summary: ['No valid version snapshots found for comparison.']
        };
    }

    const oldSkills = new Set((oldVer.parsedResume?.skills || []).map(s => s.toLowerCase()));
    const newSkills = (newVer.parsedResume?.skills || []).map(s => s.toLowerCase());

    // Technical skills difference
    const addedSkills = (newVer.parsedResume?.skills || []).filter(s => !oldSkills.has(s.toLowerCase()));
    const newSkillsSet = new Set(newSkills);
    const removedSkills = (oldVer.parsedResume?.skills || []).filter(s => !newSkillsSet.has(s.toLowerCase()));

    // Projects difference
    const oldProjNames = new Set((oldVer.parsedResume?.projects || []).map(p => p.name?.toLowerCase()));
    const newProjects = (newVer.parsedResume?.projects || []).filter(p => !oldProjNames.has(p.name?.toLowerCase()));

    // Score changes
    const scoreChanges = {
        readiness: (newVer.readinessScore || 0) - (oldVer.readinessScore || 0),
        ats: (newVer.atsScore || 0) - (oldVer.atsScore || 0),
        github: (newVer.githubSnapshot?.githubScore || 0) - (oldVer.githubSnapshot?.githubScore || 0),
        projects: (newVer.categoryScores?.projects || 0) - (oldVer.categoryScores?.projects || 0)
    };

    // Construct detailed summary
    const summary = [];
    if (scoreChanges.readiness !== 0) {
        summary.push(`Placement Readiness score shifted by ${scoreChanges.readiness > 0 ? '+' : ''}${scoreChanges.readiness} points (${oldVer.readinessScore} → ${newVer.readinessScore})`);
    }
    if (scoreChanges.ats !== 0) {
        summary.push(`ATS Score changed by ${scoreChanges.ats > 0 ? '+' : ''}${scoreChanges.ats} points (${oldVer.atsScore} → ${newVer.atsScore})`);
    }
    addedSkills.forEach(skill => {
        summary.push(`+ Added Technical Skill: ${skill}`);
    });
    removedSkills.forEach(skill => {
        summary.push(`- Removed Technical Skill: ${skill}`);
    });
    newProjects.forEach(proj => {
        summary.push(`+ Added Project profile: ${proj.name}`);
    });

    if (summary.length === 0) {
        summary.push('No significant differences detected between the versions.');
    }

    return {
        addedSkills,
        removedSkills,
        newProjects: newProjects.map(p => p.name),
        scoreChanges,
        summary
    };
};

module.exports = {
    compareVersions
};
