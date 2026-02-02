/**
 * Question Generator Service
 * 
 * Generates relevant interview questions based on:
 * - Job role
 * - Job Description keywords
 * - Predefined question templates
 * 
 * Categories: behavioral, technical, situational
 */

// ============================================================
// SKILL EXTRACTION UTILITIES
// ============================================================

// Common technical skills to look for in job descriptions
const TECH_SKILLS = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'nextjs', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring',
    'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'sql', 'nosql',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'devops',
    'graphql', 'rest', 'api', 'microservices', 'serverless',
    'machine learning', 'ml', 'ai', 'data science', 'pandas', 'numpy', 'tensorflow', 'pytorch',
    'agile', 'scrum', 'git', 'linux', 'security', 'testing', 'tdd'
];

// Common soft skills/concepts
const SOFT_SKILLS = [
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
    'project management', 'collaboration', 'mentoring', 'presentation', 'stakeholder'
];

/**
 * Extract skills from job description text
 * @param {string} jobDescription - Job description text
 * @returns {Object} - { technicalSkills: [], softSkills: [] }
 */
const extractSkillsFromJD = (jobDescription) => {
    const jdLower = jobDescription.toLowerCase();
    
    const technicalSkills = TECH_SKILLS.filter(skill => 
        jdLower.includes(skill.toLowerCase())
    );
    
    const softSkills = SOFT_SKILLS.filter(skill => 
        jdLower.includes(skill.toLowerCase())
    );
    
    return { technicalSkills, softSkills };
};

// ============================================================
// QUESTION TEMPLATES
// ============================================================

// Behavioral questions (STAR method)
const BEHAVIORAL_QUESTIONS = [
    {
        text: "Tell me about a time when you had to deal with a difficult team member. How did you handle it?",
        keywords: ['conflict', 'resolution', 'communication', 'team', 'approach'],
        difficulty: 'medium'
    },
    {
        text: "Describe a situation where you had to meet a tight deadline. What was your approach?",
        keywords: ['deadline', 'prioritization', 'time management', 'delivery', 'result'],
        difficulty: 'medium'
    },
    {
        text: "Give me an example of a time when you took initiative on a project without being asked.",
        keywords: ['initiative', 'proactive', 'ownership', 'impact', 'result'],
        difficulty: 'medium'
    },
    {
        text: "Tell me about a time when you received critical feedback. How did you respond?",
        keywords: ['feedback', 'growth', 'improvement', 'learning', 'adaptation'],
        difficulty: 'easy'
    },
    {
        text: "Describe a situation where you had to persuade someone to see things your way.",
        keywords: ['persuasion', 'influence', 'communication', 'evidence', 'outcome'],
        difficulty: 'hard'
    },
    {
        text: "Tell me about your most successful project and what made it successful.",
        keywords: ['success', 'achievement', 'contribution', 'impact', 'metrics'],
        difficulty: 'medium'
    },
    {
        text: "Describe a time when you failed at something. What did you learn?",
        keywords: ['failure', 'learning', 'resilience', 'improvement', 'growth'],
        difficulty: 'medium'
    },
    {
        text: "How do you handle stress and pressure at work? Give a specific example.",
        keywords: ['stress', 'pressure', 'coping', 'performance', 'balance'],
        difficulty: 'easy'
    }
];

// Situational questions (hypothetical scenarios)
const SITUATIONAL_QUESTIONS = [
    {
        text: "If you discovered a critical bug in production right before a major release, how would you handle it?",
        keywords: ['prioritization', 'communication', 'decision', 'risk', 'stakeholder'],
        difficulty: 'hard'
    },
    {
        text: "If you disagreed with a decision made by your manager, how would you approach the situation?",
        keywords: ['communication', 'respect', 'evidence', 'professional', 'resolution'],
        difficulty: 'medium'
    },
    {
        text: "How would you handle a situation where you need to deliver bad news to a client or stakeholder?",
        keywords: ['communication', 'transparency', 'solution', 'empathy', 'professional'],
        difficulty: 'medium'
    },
    {
        text: "If you were assigned to a project with unclear requirements, what would be your first steps?",
        keywords: ['clarification', 'requirements', 'stakeholder', 'documentation', 'planning'],
        difficulty: 'medium'
    },
    {
        text: "How would you prioritize if you had three urgent tasks due at the same time?",
        keywords: ['prioritization', 'impact', 'communication', 'delegation', 'time management'],
        difficulty: 'easy'
    },
    {
        text: "If a junior team member was struggling, how would you help them improve?",
        keywords: ['mentoring', 'patience', 'feedback', 'support', 'development'],
        difficulty: 'medium'
    }
];

// Technical questions by skill
const TECHNICAL_QUESTIONS_BY_SKILL = {
    javascript: [
        {
            text: "Explain how closures work in JavaScript and provide a practical use case.",
            keywords: ['closure', 'scope', 'function', 'memory', 'encapsulation'],
            difficulty: 'medium'
        },
        {
            text: "What is the difference between var, let, and const? When would you use each?",
            keywords: ['hoisting', 'scope', 'block', 'reassignment', 'declaration'],
            difficulty: 'easy'
        },
        {
            text: "Explain the JavaScript Event Loop and how it handles asynchronous operations.",
            keywords: ['event loop', 'call stack', 'callback queue', 'microtask', 'async'],
            difficulty: 'hard'
        },
        {
            text: "What are Promises and how do they compare to async/await syntax?",
            keywords: ['promise', 'async', 'await', 'then', 'error handling'],
            difficulty: 'medium'
        }
    ],
    typescript: [
        {
            text: "What are the benefits of using TypeScript over plain JavaScript?",
            keywords: ['type safety', 'compile time', 'intellisense', 'maintainability', 'errors'],
            difficulty: 'easy'
        },
        {
            text: "Explain the difference between interface and type in TypeScript.",
            keywords: ['interface', 'type', 'extension', 'union', 'declaration merging'],
            difficulty: 'medium'
        },
        {
            text: "How do generics work in TypeScript? Provide an example of when you'd use them.",
            keywords: ['generic', 'reusable', 'type parameter', 'constraint', 'flexibility'],
            difficulty: 'medium'
        }
    ],
    react: [
        {
            text: "Explain the Virtual DOM and how React uses it to optimize rendering.",
            keywords: ['virtual dom', 'reconciliation', 'diffing', 'performance', 'update'],
            difficulty: 'medium'
        },
        {
            text: "What is the useEffect hook and how do you prevent unnecessary re-renders?",
            keywords: ['useEffect', 'dependency array', 'cleanup', 'side effects', 'lifecycle'],
            difficulty: 'medium'
        },
        {
            text: "When would you choose Redux over Context API for state management?",
            keywords: ['redux', 'context', 'scale', 'middleware', 'devtools', 'complexity'],
            difficulty: 'hard'
        },
        {
            text: "What are React Hooks rules and why are they important?",
            keywords: ['hooks', 'rules', 'top level', 'conditional', 'order'],
            difficulty: 'easy'
        }
    ],
    nodejs: [
        {
            text: "How does Node.js handle concurrent requests despite being single-threaded?",
            keywords: ['event loop', 'non-blocking', 'async', 'libuv', 'callback'],
            difficulty: 'hard'
        },
        {
            text: "What is the difference between process.nextTick() and setImmediate()?",
            keywords: ['nextTick', 'setImmediate', 'event loop', 'phase', 'priority'],
            difficulty: 'hard'
        },
        {
            text: "How would you handle errors in an Express.js application?",
            keywords: ['error handling', 'middleware', 'try catch', 'async', 'centralized'],
            difficulty: 'medium'
        }
    ],
    python: [
        {
            text: "What are decorators in Python and how would you implement one?",
            keywords: ['decorator', 'wrapper', 'function', 'annotation', 'reusable'],
            difficulty: 'medium'
        },
        {
            text: "Explain the difference between list comprehensions and generator expressions.",
            keywords: ['list comprehension', 'generator', 'memory', 'lazy', 'iteration'],
            difficulty: 'medium'
        },
        {
            text: "What is the Global Interpreter Lock (GIL) and how does it affect multithreading?",
            keywords: ['GIL', 'threading', 'multiprocessing', 'performance', 'concurrency'],
            difficulty: 'hard'
        }
    ],
    sql: [
        {
            text: "Explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN.",
            keywords: ['join', 'inner', 'left', 'outer', 'relationship'],
            difficulty: 'easy'
        },
        {
            text: "How would you optimize a slow-running SQL query?",
            keywords: ['index', 'explain', 'optimization', 'query plan', 'performance'],
            difficulty: 'medium'
        },
        {
            text: "What are database indexes and when should you use them?",
            keywords: ['index', 'performance', 'read', 'write', 'trade-off'],
            difficulty: 'medium'
        }
    ],
    mongodb: [
        {
            text: "When would you choose MongoDB over a relational database?",
            keywords: ['schema', 'flexibility', 'scale', 'document', 'denormalization'],
            difficulty: 'medium'
        },
        {
            text: "How do you handle relationships between documents in MongoDB?",
            keywords: ['embedding', 'reference', 'populate', 'denormalization', 'design'],
            difficulty: 'medium'
        }
    ],
    docker: [
        {
            text: "What is the difference between a Docker image and a container?",
            keywords: ['image', 'container', 'layer', 'runtime', 'template'],
            difficulty: 'easy'
        },
        {
            text: "How would you optimize a Dockerfile for production deployment?",
            keywords: ['multi-stage', 'layer', 'cache', 'size', 'security'],
            difficulty: 'medium'
        }
    ],
    aws: [
        {
            text: "Explain the difference between EC2, Lambda, and ECS. When would you use each?",
            keywords: ['EC2', 'Lambda', 'ECS', 'serverless', 'container', 'use case'],
            difficulty: 'medium'
        },
        {
            text: "How would you design a highly available architecture on AWS?",
            keywords: ['availability', 'redundancy', 'load balancer', 'multi-az', 'scaling'],
            difficulty: 'hard'
        }
    ],
    microservices: [
        {
            text: "What are the pros and cons of microservices architecture vs monolithic?",
            keywords: ['scalability', 'complexity', 'deployment', 'team', 'coupling'],
            difficulty: 'medium'
        },
        {
            text: "How do you handle communication between microservices?",
            keywords: ['REST', 'message queue', 'sync', 'async', 'service mesh'],
            difficulty: 'medium'
        }
    ],
    api: [
        {
            text: "What makes a RESTful API design good? What principles do you follow?",
            keywords: ['REST', 'stateless', 'resource', 'HTTP methods', 'versioning'],
            difficulty: 'medium'
        },
        {
            text: "How do you handle API authentication and authorization?",
            keywords: ['JWT', 'OAuth', 'token', 'security', 'authorization'],
            difficulty: 'medium'
        }
    ],
    git: [
        {
            text: "Explain the difference between git merge and git rebase. When would you use each?",
            keywords: ['merge', 'rebase', 'history', 'conflict', 'branch'],
            difficulty: 'medium'
        }
    ],
    testing: [
        {
            text: "What is the testing pyramid and how do you balance different types of tests?",
            keywords: ['unit', 'integration', 'e2e', 'pyramid', 'coverage'],
            difficulty: 'medium'
        },
        {
            text: "How do you approach testing a complex feature with many dependencies?",
            keywords: ['mock', 'stub', 'isolation', 'dependency injection', 'testable'],
            difficulty: 'medium'
        }
    ],
    agile: [
        {
            text: "How do you handle changing requirements in the middle of a sprint?",
            keywords: ['agile', 'flexibility', 'prioritization', 'communication', 'backlog'],
            difficulty: 'easy'
        }
    ]
};

// Default technical questions for unmatched skills
const DEFAULT_TECHNICAL_QUESTIONS = [
    {
        text: "Describe your approach to debugging a complex technical issue.",
        keywords: ['debug', 'systematic', 'logs', 'reproduce', 'isolation'],
        difficulty: 'medium'
    },
    {
        text: "How do you ensure code quality in your projects?",
        keywords: ['testing', 'code review', 'standards', 'linting', 'documentation'],
        difficulty: 'easy'
    },
    {
        text: "Explain how you would design a scalable system architecture.",
        keywords: ['scalability', 'load balancing', 'caching', 'database', 'microservices'],
        difficulty: 'hard'
    },
    {
        text: "What is your experience with CI/CD pipelines?",
        keywords: ['continuous integration', 'deployment', 'automation', 'testing', 'pipeline'],
        difficulty: 'medium'
    }
];

// ============================================================
// QUESTION GENERATION
// ============================================================

/**
 * Generate a unique question ID
 * @returns {string} Unique ID
 */
const generateQuestionId = () => {
    return `q-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
};

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array 
 * @returns {Array} Shuffled array
 */
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Generate interview questions based on job role and description
 * @param {string} jobRole - Target job role
 * @param {string} jobDescription - Job description text
 * @param {number} totalQuestions - Total questions to generate (default: 8)
 * @returns {Object} - { questions: [], extractedSkills: [] }
 */
const generateQuestions = (jobRole, jobDescription, totalQuestions = 8) => {
    const questions = [];
    const usedTexts = new Set();
    
    // Extract skills from job description
    const { technicalSkills, softSkills } = extractSkillsFromJD(jobDescription);
    const extractedSkills = [...technicalSkills, ...softSkills];
    
    // Question distribution:
    // - 2 Behavioral questions
    // - 4 Technical questions (skill-based)
    // - 2 Situational questions
    const behavioralCount = 2;
    const technicalCount = Math.min(4, Math.max(2, totalQuestions - 4));
    const situationalCount = 2;
    
    // 1. Add Behavioral Questions
    const shuffledBehavioral = shuffleArray(BEHAVIORAL_QUESTIONS);
    for (let i = 0; i < behavioralCount && i < shuffledBehavioral.length; i++) {
        const q = shuffledBehavioral[i];
        if (!usedTexts.has(q.text)) {
            usedTexts.add(q.text);
            questions.push({
                id: generateQuestionId(),
                questionText: q.text,
                category: 'behavioral',
                difficulty: q.difficulty,
                expectedKeywords: q.keywords,
                relatedSkill: null
            });
        }
    }
    
    // 2. Add Technical Questions based on extracted skills
    const addedTechnical = new Set();
    for (const skill of technicalSkills) {
        if (addedTechnical.size >= technicalCount) break;
        
        const skillLower = skill.toLowerCase();
        const matchingKey = Object.keys(TECHNICAL_QUESTIONS_BY_SKILL).find(
            key => skillLower.includes(key) || key.includes(skillLower)
        );
        
        if (matchingKey) {
            const skillQuestions = TECHNICAL_QUESTIONS_BY_SKILL[matchingKey];
            const shuffledSkill = shuffleArray(skillQuestions);
            
            for (const q of shuffledSkill) {
                if (!usedTexts.has(q.text) && addedTechnical.size < technicalCount) {
                    usedTexts.add(q.text);
                    addedTechnical.add(q.text);
                    questions.push({
                        id: generateQuestionId(),
                        questionText: q.text,
                        category: 'technical',
                        difficulty: q.difficulty,
                        expectedKeywords: q.keywords,
                        relatedSkill: skill
                    });
                }
            }
        }
    }
    
    // Fill remaining technical slots with default questions
    if (addedTechnical.size < technicalCount) {
        const shuffledDefault = shuffleArray(DEFAULT_TECHNICAL_QUESTIONS);
        for (const q of shuffledDefault) {
            if (!usedTexts.has(q.text) && addedTechnical.size < technicalCount) {
                usedTexts.add(q.text);
                addedTechnical.add(q.text);
                questions.push({
                    id: generateQuestionId(),
                    questionText: q.text,
                    category: 'technical',
                    difficulty: q.difficulty,
                    expectedKeywords: q.keywords,
                    relatedSkill: null
                });
            }
        }
    }
    
    // 3. Add Situational Questions
    const shuffledSituational = shuffleArray(SITUATIONAL_QUESTIONS);
    for (let i = 0; i < situationalCount && i < shuffledSituational.length; i++) {
        const q = shuffledSituational[i];
        if (!usedTexts.has(q.text)) {
            usedTexts.add(q.text);
            questions.push({
                id: generateQuestionId(),
                questionText: q.text,
                category: 'situational',
                difficulty: q.difficulty,
                expectedKeywords: q.keywords,
                relatedSkill: null
            });
        }
    }
    
    // Shuffle final questions to mix categories
    const finalQuestions = shuffleArray(questions).slice(0, totalQuestions);
    
    return {
        questions: finalQuestions,
        extractedSkills
    };
};

/**
 * Get expected keywords for a question (used in evaluation)
 * @param {string} questionId - Question ID
 * @param {Array} questions - Array of questions
 * @returns {Array} Expected keywords
 */
const getExpectedKeywords = (questionId, questions) => {
    const question = questions.find(q => q.id === questionId);
    return question ? question.expectedKeywords : [];
};

module.exports = {
    generateQuestions,
    extractSkillsFromJD,
    getExpectedKeywords,
    TECH_SKILLS,
    SOFT_SKILLS
};
