/**
 * Question Generator Service
 * 
 * Generates relevant interview questions based on:
 * - Resume skills
 * - Job Description
 * - Role
 */

// Bank of template questions based on skills
// In a real startup, this would be replaced by an LLM call
const SKILL_QUESTION_BANK = {
    'javascript': [
        { text: "Explain how 'this' works in JavaScript and how arrow functions affect it.", level: "medium" },
        { text: "What are closures and how would you use them in a real application?", level: "medium" },
        { text: "Explain the Event Loop in JavaScript.", level: "hard" },
    ],
    'react': [
        { text: "What is the Virtual DOM and how does it improve performance?", level: "medium" },
        { text: "Explain the useEffect dependency array and common pitfalls.", level: "medium" },
        { text: "Compare Redux with Context API. When would you use one over the other?", level: "hard" },
    ],
    'node': [
        { text: "How does Node.js handle concurrency given it is single-threaded?", level: "medium" },
        { text: "Explain the difference between process.nextTick() and setImmediate().", level: "hard" },
    ],
    'python': [
        { text: "What are decorators in Python and how do you implement one?", level: "medium" },
        { text: "Explain the difference between list comprehensions and generator expressions.", level: "medium" },
    ],
    'default': [
        { text: "Tell me about a challenging technical problem you solved recently.", level: "soft-skill" },
        { text: "How do you handle conflicting priorities in a project?", level: "soft-skill" },
        { text: "Describe your experience with Agile methodologies.", level: "soft-skill" },
    ]
};

/**
 * Generate Questions Logic
 * @param {Object} resumeData 
 * @param {string} jobDescription 
 * @param {string} role 
 * @returns {Array} List of questions
 */
const generateQuestions = (resumeData, jobDescription, role) => {
    const questions = [];
    const skills = resumeData.skills || [];

    // 1. Add Role-Specific Questions (Simple matching)
    skills.forEach(skill => {
        const normalizedSkill = skill.toLowerCase();

        // Find matching category in bank
        const match = Object.keys(SKILL_QUESTION_BANK).find(key => normalizedSkill.includes(key));
        if (match) {
            // Pick random question from category
            const options = SKILL_QUESTION_BANK[match];
            const q = options[Math.floor(Math.random() * options.length)];
            questions.push({
                id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                text: q.text,
                category: 'technical',
                complexity: q.level,
                expectedKeywords: [match, 'experience', 'implementation']
            });
        }
    });

    // 2. Add Behavioral Questions (Always include 1-2)
    for (let i = 0; i < 2; i++) {
        const q = SKILL_QUESTION_BANK['default'][i];
        questions.push({
            id: `q-behav-${i}`,
            text: q.text,
            category: 'behavioral',
            complexity: 'medium',
            expectedKeywords: ['situation', 'task', 'action', 'result']
        });
    }

    // Deduplicate and limit to 5 questions
    const uniqueQuestions = [...new Map(questions.map(item => [item.text, item])).values()];
    return uniqueQuestions.slice(0, 5);
};

module.exports = {
    generateQuestions,
};
