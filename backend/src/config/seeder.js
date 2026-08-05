const Candidate = require('../models/Candidate');
const HiringAnalytics = require('../models/HiringAnalytics');
const PlacementIntelligence = require('../models/PlacementIntelligence');
const EvidenceSummary = require('../models/EvidenceSummary');
const JobRole = require('../models/JobRole');

const DEFAULT_RECRUITER = '000000000000000000000000';

const seedDatabase = async () => {
    try {
        console.log('🔄 Checking if database needs seeding...');

        // 1. Seed Candidates
        const candidateCount = await Candidate.countDocuments();
        if (candidateCount === 0) {
            console.log('🌱 Seeding Candidates...');
            
            const candidates = [
                // Core 6 Candidates
                {
                    name: 'Arjun Mehta',
                    role: 'Senior Backend Engineer',
                    email: 'arjun.mehta@example.com',
                    phone: '+91 98765 43210',
                    location: 'Bangalore, India',
                    experience: '5 years',
                    status: 'Interview',
                    evidenceScore: 87,
                    hiringReadiness: 82,
                    authenticityScore: 91,
                    summary: 'Strong backend engineer with verified experience in distributed systems. GitHub contributions confirm Python/Django expertise. Communication quality rated high from interview analysis. Minor gap in cloud-native infrastructure experience.',
                    skills: [
                        { name: 'Python', confidence: 94, sources: ['Resume', 'GitHub', 'Interview', 'Assessment'], level: 'verified', reasoning: 'Confirmed through 47 GitHub repos, 3 production projects on resume, and correct interview responses on async patterns.' },
                        { name: 'Django', confidence: 88, sources: ['Resume', 'GitHub', 'Interview'], level: 'verified', reasoning: 'Active Django contributor on GitHub. Resume shows 3 years of Django in production. Interview answers demonstrate deep ORM knowledge.' },
                        { name: 'PostgreSQL', confidence: 82, sources: ['Resume', 'Interview'], level: 'collected', reasoning: 'Resume claims PostgreSQL experience. Interview confirmed indexing and query optimization knowledge. No GitHub evidence found.' },
                        { name: 'Docker', confidence: 71, sources: ['Resume', 'GitHub'], level: 'collected', reasoning: 'Dockerfiles found in 5 GitHub repos. Resume mentions containerization. No interview validation yet.' },
                        { name: 'Kubernetes', confidence: 38, sources: ['Resume'], level: 'review', reasoning: 'Only mentioned on resume. No GitHub evidence, no interview validation. Confidence low — needs verification.' },
                        { name: 'AWS', confidence: 45, sources: ['Resume'], level: 'review', reasoning: 'Listed on resume without specific services. No project evidence. Consider probing in next interview round.' }
                    ],
                    hiringDimensions: [
                        { dimension: 'Technical Skills', score: 85, reasoning: 'Strong Python/Django foundation verified across multiple sources.' },
                        { dimension: 'Communication', score: 78, reasoning: 'Clear and structured responses in interview. Minor verbosity in explanations.' },
                        { dimension: 'Problem Solving', score: 82, reasoning: 'Systematic approach observed in system design questions.' },
                        { dimension: 'Project Quality', score: 88, reasoning: 'GitHub repos show clean architecture, tests, and documentation.' },
                        { dimension: 'Learning Velocity', score: 72, reasoning: 'Skill acquisition timeline shows moderate but consistent growth.' },
                        { dimension: 'Authenticity', score: 91, reasoning: 'Evidence is consistent across all sources. No red flags detected.' }
                    ],
                    riskIndicators: [
                        { risk: 'Kubernetes claim unverified', severity: 'medium', detail: 'Resume lists Kubernetes but no supporting evidence from other sources.' },
                        { risk: 'AWS depth unclear', severity: 'low', detail: 'Generic AWS mention without specific services or certifications.' }
                    ],
                    timeline: [
                        { date: '2d ago', action: 'Interview completed', detail: 'Technical round — scored 82%' },
                        { date: '4d ago', action: 'GitHub verified', detail: '47 repos analyzed, 12 relevant to role' },
                        { date: '5d ago', action: 'Resume uploaded', detail: 'PDF parsed, 6 skills extracted' },
                        { date: '5d ago', action: 'Candidate added', detail: 'Added by recruiter' }
                    ],
                    sources: { resume: true, github: true, interview: true, assessment: false, linkedin: false },
                    notes: [
                        { text: 'Strong system design skills. Schedule final round with CTO.', author: 'You', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
                    ],
                    recruiter: DEFAULT_RECRUITER
                },
                {
                    name: 'Priya Sharma',
                    role: 'Full Stack Developer',
                    email: 'priya.sharma@example.com',
                    phone: '+91 98765 43211',
                    location: 'Mumbai, India',
                    experience: '3 years',
                    status: 'Screening',
                    evidenceScore: 74,
                    hiringReadiness: 71,
                    authenticityScore: 85,
                    summary: 'Good communication skills and enthusiasm. Technical knowledge is solid but lacks depth in backend architecture. Shows strong learning potential.',
                    skills: [
                        { name: 'React', confidence: 82, sources: ['Resume', 'GitHub', 'LinkedIn'], level: 'verified', reasoning: 'Confirmed through GitHub projects and LinkedIn endorsements.' },
                        { name: 'Node.js', confidence: 75, sources: ['Resume', 'GitHub'], level: 'collected', reasoning: 'Multiple Express APIs on GitHub.' },
                        { name: 'TypeScript', confidence: 78, sources: ['Resume', 'GitHub'], level: 'verified', reasoning: 'Clean TypeScript templates found on GitHub.' },
                        { name: 'MongoDB', confidence: 68, sources: ['Resume'], level: 'collected', reasoning: 'Mentioned on resume.' }
                    ],
                    hiringDimensions: [
                        { dimension: 'Technical Skills', score: 70, reasoning: 'Strong frontend React skills; backend Node/Express is satisfactory but not senior-level.' },
                        { dimension: 'Communication', score: 82, reasoning: 'Extremely polite, fluent, and structured communicator.' },
                        { dimension: 'Problem Solving', score: 72, reasoning: 'Handled logic questions well, took slightly longer on algorithms.' },
                        { dimension: 'Project Quality', score: 75, reasoning: 'Good repository structure but lacks unit test coverage.' },
                        { dimension: 'Learning Velocity', score: 75, reasoning: 'Learned TypeScript in past 6 months to support stack migration.' },
                        { dimension: 'Authenticity', score: 85, reasoning: 'Data matches background checks; minor mismatch on start date in first job.' }
                    ],
                    riskIndicators: [],
                    timeline: [
                        { date: '5d ago', action: 'Interview completed', detail: 'General technical screening round — Scored 71%' },
                        { date: '6d ago', action: 'Resume uploaded', detail: 'PDF parsed, 4 skills extracted' },
                        { date: '6d ago', action: 'Candidate added', detail: 'Added by recruiter' }
                    ],
                    sources: { resume: true, github: true, interview: false, assessment: false, linkedin: true },
                    notes: [
                        { text: 'Good frontend but needs backend depth assessment.', author: 'You', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    ],
                    recruiter: DEFAULT_RECRUITER
                },
                {
                    name: 'Rahul Verma',
                    role: 'Backend Engineer',
                    email: 'rahul.verma@example.com',
                    phone: '+91 98765 43212',
                    location: 'Delhi, India',
                    experience: '2 years',
                    status: 'Screening',
                    evidenceScore: 42,
                    hiringReadiness: 35,
                    authenticityScore: 65,
                    summary: 'Backend developer with high risk indicators. Resume lists Java/Spring Boot but no supporting evidence found from other sources. Significant timeline inconsistency detected.',
                    skills: [
                        { name: 'Java', confidence: 45, sources: ['Resume'], level: 'review', reasoning: 'Claimed on resume, no GitHub projects or assessments.' },
                        { name: 'Spring Boot', confidence: 40, sources: ['Resume'], level: 'review', reasoning: 'Claimed on resume, no external validation.' },
                        { name: 'MySQL', confidence: 42, sources: ['Resume'], level: 'review', reasoning: 'Generic database claim.' }
                    ],
                    hiringDimensions: [
                        { dimension: 'Technical Skills', score: 40, reasoning: 'Unverified skills. Spring Boot expertise could not be verified.' },
                        { dimension: 'Communication', score: 68, reasoning: 'Basic communication skills. Struggled with conceptual explanations.' },
                        { dimension: 'Problem Solving', score: 50, reasoning: 'Struggled to optimize a simple array search.' },
                        { dimension: 'Project Quality', score: 35, reasoning: 'No project repositories shared.' },
                        { dimension: 'Learning Velocity', score: 45, reasoning: 'Moderate growth in current role.' },
                        { dimension: 'Authenticity', score: 65, reasoning: 'Timeline overlaps found between resume dates and employment verification.' }
                    ],
                    riskIndicators: [
                        { risk: 'Timeline Inconsistency', severity: 'high', detail: 'Significant gap between job transitions' },
                        { risk: 'Weak evidence for SQL claims', severity: 'medium', detail: 'No supporting projects found on GitHub' }
                    ],
                    timeline: [
                        { date: '1d ago', action: 'Resume uploaded', detail: 'PDF parsed, 3 skills extracted' },
                        { date: '1d ago', action: 'Candidate added', detail: 'Added by recruiter' }
                    ],
                    sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false },
                    notes: [],
                    recruiter: DEFAULT_RECRUITER
                },
                {
                    name: 'Ananya Rao',
                    role: 'Data Scientist',
                    email: 'ananya.rao@example.com',
                    phone: '+91 98765 43213',
                    location: 'Hyderabad, India',
                    experience: '4 years',
                    status: 'New',
                    evidenceScore: 68,
                    hiringReadiness: 63,
                    authenticityScore: 78,
                    summary: 'Data scientist with strong Python/TensorFlow skills verified by assessment. No GitHub contributions found. Communication and problem-solving need verification.',
                    skills: [
                        { name: 'Python', confidence: 75, sources: ['Resume', 'Assessment'], level: 'verified', reasoning: 'Passed the python technical assessment with 80% score.' },
                        { name: 'TensorFlow', confidence: 70, sources: ['Resume', 'Assessment'], level: 'verified', reasoning: 'Assessment results demonstrate solid machine learning fundamentals.' },
                        { name: 'SQL', confidence: 60, sources: ['Resume'], level: 'collected', reasoning: 'Listed on resume.' },
                        { name: 'Pandas', confidence: 68, sources: ['Resume', 'Assessment'], level: 'collected', reasoning: 'Used extensively in data parsing task.' }
                    ],
                    hiringDimensions: [
                        { dimension: 'Technical Skills', score: 72, reasoning: 'Validated python/data science skills via coding assessment.' },
                        { dimension: 'Communication', score: 60, reasoning: 'Not interviewed yet.' },
                        { dimension: 'Problem Solving', score: 68, reasoning: 'Solved ML problem statement in the assessment task.' },
                        { dimension: 'Project Quality', score: 65, reasoning: 'Quality of the assessment project was good, cleanly structured.' },
                        { dimension: 'Learning Velocity', score: 70, reasoning: 'Steady career advancement.' },
                        { dimension: 'Authenticity', score: 78, reasoning: 'Details match. Assessment was verified via proctoring.' }
                    ],
                    riskIndicators: [
                        { risk: 'No GitHub evidence', severity: 'low', detail: 'No public repositories found for Python claims' }
                    ],
                    timeline: [
                        { date: '3d ago', action: 'Assessment completed', detail: 'ML and Python task — Score: 78%' },
                        { date: '4d ago', action: 'Resume uploaded', detail: 'PDF parsed, 4 skills extracted' },
                        { date: '4d ago', action: 'Candidate added', detail: 'Added by recruiter' }
                    ],
                    sources: { resume: true, github: false, interview: false, assessment: true, linkedin: false },
                    notes: [],
                    recruiter: DEFAULT_RECRUITER
                },
                {
                    name: 'Vikram Singh',
                    role: 'DevOps Engineer',
                    email: 'vikram.singh@example.com',
                    phone: '+91 98765 43214',
                    location: 'Pune, India',
                    experience: '6 years',
                    status: 'Offer',
                    evidenceScore: 91,
                    hiringReadiness: 88,
                    authenticityScore: 96,
                    summary: 'Outstanding DevOps engineer with all sources verified. High authenticity score, no risk indicators found. Ready for offer.',
                    skills: [
                        { name: 'AWS', confidence: 90, sources: ['Resume', 'GitHub', 'Interview', 'Assessment'], level: 'verified', reasoning: 'Certified AWS Solutions Architect. Confirmed via credentials.' },
                        { name: 'Kubernetes', confidence: 88, sources: ['Resume', 'GitHub', 'Interview'], level: 'verified', reasoning: 'Maintains 3 production K8s clusters. Deep knowledge shown in system interview.' },
                        { name: 'Terraform', confidence: 92, sources: ['Resume', 'GitHub', 'Assessment'], level: 'verified', reasoning: 'GitHub contains extensive Infrastructure-as-code repos.' },
                        { name: 'Docker', confidence: 85, sources: ['Resume', 'GitHub'], level: 'verified', reasoning: 'Standardized container configs across past company.' },
                        { name: 'CI/CD', confidence: 89, sources: ['Resume', 'GitHub', 'Interview'], level: 'verified', reasoning: 'Configured GitHub Actions/Jenkins for dev environments.' }
                    ],
                    hiringDimensions: [
                        { dimension: 'Technical Skills', score: 92, reasoning: 'Highly advanced cloud and infrastructure automation capabilities.' },
                        { dimension: 'Communication', score: 72, reasoning: 'Straightforward and direct, slightly dry but professional.' },
                        { dimension: 'Problem Solving', score: 79, reasoning: 'Logical troubleshooting of complex network failures.' },
                        { dimension: 'Project Quality', score: 88, reasoning: 'Excellent repository structure, automated test pipelines included.' },
                        { dimension: 'Learning Velocity', score: 85, reasoning: 'Adopts new tools quickly. Recently certified in AWS Advanced Networking.' },
                        { dimension: 'Authenticity', score: 96, reasoning: 'Extremely consistent profiles, background checks verified.' }
                    ],
                    riskIndicators: [],
                    timeline: [
                        { date: '3d ago', action: 'Final round completed', detail: 'Approved by hiring committee' },
                        { date: '5d ago', action: 'Resume uploaded', detail: 'PDF parsed, 5 skills extracted' },
                        { date: '6d ago', action: 'GitHub verified', detail: 'DevOps repos analyzed' },
                        { date: '6d ago', action: 'Candidate added', detail: 'Added by recruiter' }
                    ],
                    sources: { resume: true, github: true, interview: true, assessment: true, linkedin: true },
                    notes: [
                        { text: 'Approved for offer. Salary: ₹28L. Start: Sep 1.', author: 'You', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
                    ],
                    recruiter: DEFAULT_RECRUITER
                },
                {
                    name: 'Sneha Gupta',
                    role: 'ML Engineer',
                    email: 'sneha.gupta@example.com',
                    phone: '+91 98765 43215',
                    location: 'Noida, India',
                    experience: '2 years',
                    status: 'New',
                    evidenceScore: 48,
                    hiringReadiness: 45,
                    authenticityScore: 70,
                    summary: 'ML engineer junior profile. Has collected some skills but needs deep interview review.',
                    skills: [
                        { name: 'Python', confidence: 60, sources: ['Resume', 'GitHub'], level: 'collected', reasoning: 'Used Python for college projects, minor scripts on GitHub.' },
                        { name: 'PyTorch', confidence: 50, sources: ['Resume'], level: 'collected', reasoning: 'Mentioned on resume.' },
                        { name: 'Scikit-Learn', confidence: 45, sources: ['Resume'], level: 'review', reasoning: 'No GitHub repos, low confidence.' }
                    ],
                    hiringDimensions: [
                        { dimension: 'Technical Skills', score: 50, reasoning: 'Basic ML understanding, lacks production/deployment experience.' },
                        { dimension: 'Communication', score: 70, reasoning: 'Friendly and descriptive, communicates concepts nicely.' },
                        { dimension: 'Problem Solving', score: 60, reasoning: 'Solves simple coding problems but struggles with scale.' },
                        { dimension: 'Project Quality', score: 50, reasoning: 'Very simple repository structure.' },
                        { dimension: 'Learning Velocity', score: 70, reasoning: 'Eager to learn, takes online courses frequently.' },
                        { dimension: 'Authenticity', score: 70, reasoning: 'Resume claims match background verification.' }
                    ],
                    riskIndicators: [],
                    timeline: [
                        { date: '1d ago', action: 'Resume uploaded', detail: 'PDF parsed, 3 skills extracted' },
                        { date: '1d ago', action: 'Candidate added', detail: 'Added by recruiter' }
                    ],
                    sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false },
                    notes: [],
                    recruiter: DEFAULT_RECRUITER
                },
                
                // Extra candidates to match pipeline counts:
                // Counts needed: Hired = 1 (let's add 1), Offer = 2 (we have 1 Vikram, need 1 more), Interview = 5 (we have 1 Arjun, need 4 more),
                // Screening = 8 (we have 2 Priya/Rahul, need 6 more), New = 12 (we have 2 Ananya/Sneha, need 10 more).
                
                // 1. Hired (1)
                {
                    name: 'Rajesh Kumar',
                    role: 'Lead Data Architect',
                    email: 'rajesh.kumar@example.com',
                    phone: '+91 98765 43216',
                    location: 'Bangalore, India',
                    experience: '8 years',
                    status: 'Hired',
                    evidenceScore: 95,
                    hiringReadiness: 94,
                    authenticityScore: 98,
                    summary: 'Extremely qualified Lead Architect. Proven database migrations at scale. Onboarded and hired.',
                    skills: [
                        { name: 'SQL', confidence: 96, sources: ['Resume', 'Interview'], level: 'verified', reasoning: 'Confirmed deep knowledge of indexes, partition, and sharding.' },
                        { name: 'PostgreSQL', confidence: 94, sources: ['Resume', 'GitHub'], level: 'verified', reasoning: 'Maintains open source postgres extensions.' }
                    ],
                    hiringDimensions: [
                        { dimension: 'Technical Skills', score: 96 },
                        { dimension: 'Communication', score: 90 },
                        { dimension: 'Problem Solving', score: 94 },
                        { dimension: 'Project Quality', score: 95 },
                        { dimension: 'Learning Velocity', score: 88 },
                        { dimension: 'Authenticity', score: 98 }
                    ],
                    riskIndicators: [],
                    timeline: [
                        { date: '1w ago', action: 'Candidate Hired', detail: 'Completed onboarding' }
                    ],
                    sources: { resume: true, github: true, interview: true, assessment: true, linkedin: true },
                    notes: [{ text: 'Great asset. Hired as Lead Data Architect.', author: 'HR', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }],
                    recruiter: DEFAULT_RECRUITER
                },
                
                // 2. Offer (need 1 more, total 2)
                {
                    name: 'Kavita Iyer',
                    role: 'Product Designer',
                    email: 'kavita.iyer@example.com',
                    status: 'Offer',
                    evidenceScore: 88,
                    hiringReadiness: 85,
                    authenticityScore: 90,
                    summary: 'Stunning portfolio. Strong communication, UI design validated via assessment.',
                    skills: [
                        { name: 'Figma', confidence: 95, sources: ['Resume', 'Assessment'], level: 'verified' },
                        { name: 'UI Design', confidence: 90, sources: ['Resume', 'LinkedIn'], level: 'verified' }
                    ],
                    hiringDimensions: [
                        { dimension: 'Technical Skills', score: 90 },
                        { dimension: 'Communication', score: 85 }
                    ],
                    riskIndicators: [],
                    timeline: [{ date: '2d ago', action: 'Offer Letter Sent', detail: 'Pending acceptance' }],
                    sources: { resume: true, github: false, interview: true, assessment: true, linkedin: true },
                    recruiter: DEFAULT_RECRUITER
                },
                
                // 3. Interview (need 4 more, total 5)
                {
                    name: 'Amit Patel',
                    role: 'Backend Engineer',
                    email: 'amit.patel@example.com',
                    status: 'Interview',
                    evidenceScore: 78,
                    hiringReadiness: 75,
                    authenticityScore: 84,
                    skills: [{ name: 'Node.js', confidence: 80, sources: ['Resume', 'Interview'], level: 'verified' }],
                    hiringDimensions: [{ dimension: 'Technical Skills', score: 78 }],
                    riskIndicators: [],
                    timeline: [{ date: '1d ago', action: 'Interview Scheduled', detail: 'Technical Panel Round' }],
                    sources: { resume: true, github: true, interview: true, assessment: false, linkedin: false },
                    recruiter: DEFAULT_RECRUITER
                },
                {
                    name: 'Neha Sen',
                    role: 'Frontend Engineer',
                    email: 'neha.sen@example.com',
                    status: 'Interview',
                    evidenceScore: 81,
                    hiringReadiness: 79,
                    authenticityScore: 88,
                    skills: [{ name: 'React', confidence: 85, sources: ['Resume', 'GitHub', 'Interview'], level: 'verified' }],
                    hiringDimensions: [{ dimension: 'Technical Skills', score: 82 }],
                    riskIndicators: [],
                    timeline: [{ date: '3d ago', action: 'Interview Completed', detail: 'First round passed' }],
                    sources: { resume: true, github: true, interview: true, assessment: false, linkedin: true },
                    recruiter: DEFAULT_RECRUITER
                },
                {
                    name: 'Suresh Raina',
                    role: 'DevOps Specialist',
                    email: 'suresh@example.com',
                    status: 'Interview',
                    evidenceScore: 75,
                    hiringReadiness: 72,
                    authenticityScore: 80,
                    skills: [{ name: 'Docker', confidence: 78, sources: ['Resume', 'Interview'], level: 'verified' }],
                    hiringDimensions: [{ dimension: 'Technical Skills', score: 75 }],
                    riskIndicators: [],
                    timeline: [{ date: '2d ago', action: 'Interview Scheduled', detail: 'System Automation test' }],
                    sources: { resume: true, github: true, interview: true, assessment: false, linkedin: false },
                    recruiter: DEFAULT_RECRUITER
                },
                {
                    name: 'Meera Nair',
                    role: 'QA Automation',
                    email: 'meera@example.com',
                    status: 'Interview',
                    evidenceScore: 70,
                    hiringReadiness: 68,
                    authenticityScore: 76,
                    skills: [{ name: 'Selenium', confidence: 75, sources: ['Resume', 'Interview'], level: 'collected' }],
                    hiringDimensions: [{ dimension: 'Technical Skills', score: 70 }],
                    riskIndicators: [],
                    timeline: [{ date: '4d ago', action: 'Interview Scheduled', detail: 'QA Automation round' }],
                    sources: { resume: true, github: false, interview: true, assessment: true, linkedin: false },
                    recruiter: DEFAULT_RECRUITER
                },

                // 4. Screening (need 6 more, total 8)
                {
                    name: 'Kiran Patel',
                    role: 'Data Analyst',
                    email: 'kiran.patel@example.com',
                    status: 'Screening',
                    evidenceScore: 55,
                    hiringReadiness: 42,
                    authenticityScore: 70,
                    skills: [{ name: 'SQL', confidence: 42, sources: ['Resume'], level: 'risk', reasoning: 'Weak evidence for SQL claims.' }],
                    hiringDimensions: [{ dimension: 'Technical Skills', score: 50 }],
                    riskIndicators: [{ risk: 'Weak evidence for SQL claims', severity: 'medium', detail: 'SQL claims are unverified.' }],
                    timeline: [{ date: '2d ago', action: 'Screening Call Scheduled', detail: 'HR intro' }],
                    sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false },
                    recruiter: DEFAULT_RECRUITER
                },
                { name: 'Aditya Das', role: 'Security Analyst', email: 'aditya@example.com', status: 'Screening', evidenceScore: 62, hiringReadiness: 58, authenticityScore: 75, skills: [{ name: 'Python', confidence: 65, sources: ['Resume'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 60 }], riskIndicators: [], timeline: [{ date: '2d ago', action: 'Added to screening', detail: 'Resume parsed' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Deepa Roy', role: 'HR Manager', email: 'deepa@example.com', status: 'Screening', evidenceScore: 60, hiringReadiness: 55, authenticityScore: 80, skills: [{ name: 'Recruiting', confidence: 70, sources: ['Resume'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 65 }], riskIndicators: [], timeline: [{ date: '3d ago', action: 'Screening scheduled', detail: 'HR review' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: true }, recruiter: DEFAULT_RECRUITER },
                { name: 'Sanjay Dutt', role: 'Support Lead', email: 'sanjay@example.com', status: 'Screening', evidenceScore: 58, hiringReadiness: 50, authenticityScore: 72, skills: [{ name: 'Linux', confidence: 60, sources: ['Resume'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 55 }], riskIndicators: [], timeline: [{ date: '1d ago', action: 'Initial Screen Done', detail: 'Passed HR chat' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Pooja Bose', role: 'Mobile Dev', email: 'pooja@example.com', status: 'Screening', evidenceScore: 65, hiringReadiness: 60, authenticityScore: 82, skills: [{ name: 'Flutter', confidence: 72, sources: ['Resume', 'GitHub'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 68 }], riskIndicators: [], timeline: [{ date: '4d ago', action: 'Screening pending', detail: 'Code sample requested' }], sources: { resume: true, github: true, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Tarun Gill', role: 'Product Manager', email: 'tarun@example.com', status: 'Screening', evidenceScore: 68, hiringReadiness: 62, authenticityScore: 85, skills: [{ name: 'Agile', confidence: 75, sources: ['Resume', 'LinkedIn'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 70 }], riskIndicators: [], timeline: [{ date: '5d ago', action: 'Screening scheduled', detail: 'Product task review' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: true }, recruiter: DEFAULT_RECRUITER },

                // 5. New (need 10 more, total 12)
                { name: 'Vijay Mallya', role: 'Financial Analyst', email: 'vijay@example.com', status: 'New', evidenceScore: 40, hiringReadiness: 30, authenticityScore: 50, skills: [{ name: 'Excel', confidence: 50, sources: ['Resume'], level: 'review' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 35 }], riskIndicators: [{ risk: 'Flight risk', severity: 'high', detail: 'Address details unverified.' }], timeline: [{ date: '1d ago', action: 'Candidate Added', detail: 'Imported via portal' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Karan Johar', role: 'Creative Director', email: 'karan@example.com', status: 'New', evidenceScore: 45, hiringReadiness: 35, authenticityScore: 68, skills: [{ name: 'Scripting', confidence: 55, sources: ['Resume'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 40 }], riskIndicators: [], timeline: [{ date: '1d ago', action: 'Added to pipeline', detail: 'Email referral' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Shahrukh Khan', role: 'Brand Specialist', email: 'srk@example.com', status: 'New', evidenceScore: 55, hiringReadiness: 50, authenticityScore: 80, skills: [{ name: 'PR', confidence: 60, sources: ['Resume'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 55 }], riskIndicators: [], timeline: [{ date: '2d ago', action: 'Added to pipeline', detail: 'LinkedIn import' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: true }, recruiter: DEFAULT_RECRUITER },
                { name: 'Salman Khan', role: 'Security Coordinator', email: 'salman@example.com', status: 'New', evidenceScore: 50, hiringReadiness: 40, authenticityScore: 70, skills: [{ name: 'Threat Detection', confidence: 55, sources: ['Resume'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 45 }], riskIndicators: [], timeline: [{ date: '2d ago', action: 'Added', detail: 'Direct application' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Alia Bhatt', role: 'UI designer', email: 'alia@example.com', status: 'New', evidenceScore: 52, hiringReadiness: 48, authenticityScore: 78, skills: [{ name: 'Figma', confidence: 58, sources: ['Resume'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 50 }], riskIndicators: [], timeline: [{ date: '2d ago', action: 'Added', detail: 'Direct application' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Ranbir Kapoor', role: 'Node Developer', email: 'ranbir@example.com', status: 'New', evidenceScore: 48, hiringReadiness: 42, authenticityScore: 72, skills: [{ name: 'Node.js', confidence: 50, sources: ['Resume', 'GitHub'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 45 }], riskIndicators: [], timeline: [{ date: '3d ago', action: 'Added', detail: 'Direct application' }], sources: { resume: true, github: true, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Deepika Padukone', role: 'Marketing Manager', email: 'deepika@example.com', status: 'New', evidenceScore: 58, hiringReadiness: 55, authenticityScore: 84, skills: [{ name: 'SEO', confidence: 62, sources: ['Resume', 'LinkedIn'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 58 }], riskIndicators: [], timeline: [{ date: '3d ago', action: 'Added', detail: 'Direct application' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: true }, recruiter: DEFAULT_RECRUITER },
                { name: 'Ranveer Singh', role: 'Event Manager', email: 'ranveer@example.com', status: 'New', evidenceScore: 50, hiringReadiness: 45, authenticityScore: 75, skills: [{ name: 'Operations', confidence: 55, sources: ['Resume'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 50 }], riskIndicators: [], timeline: [{ date: '4d ago', action: 'Added', detail: 'Direct application' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Katrina Kaif', role: 'Business Analyst', email: 'katrina@example.com', status: 'New', evidenceScore: 46, hiringReadiness: 40, authenticityScore: 70, skills: [{ name: 'Python', confidence: 50, sources: ['Resume'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 45 }], riskIndicators: [], timeline: [{ date: '4d ago', action: 'Added', detail: 'Direct application' }], sources: { resume: true, github: false, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER },
                { name: 'Vicky Kaushal', role: 'Python Developer', email: 'vicky@example.com', status: 'New', evidenceScore: 54, hiringReadiness: 50, authenticityScore: 78, skills: [{ name: 'Python', confidence: 60, sources: ['Resume', 'GitHub'], level: 'collected' }], hiringDimensions: [{ dimension: 'Technical Skills', score: 52 }], riskIndicators: [], timeline: [{ date: '5d ago', action: 'Added', detail: 'Direct application' }], sources: { resume: true, github: true, interview: false, assessment: false, linkedin: false }, recruiter: DEFAULT_RECRUITER }
            ];

            await Candidate.insertMany(candidates);
            console.log('✅ Candidates seeded successfully!');
        }

        // 2. Seed Hiring Analytics
        const analyticsCount = await HiringAnalytics.countDocuments();
        if (analyticsCount === 0) {
            console.log('🌱 Seeding Hiring Analytics...');
            const analytics = new HiringAnalytics({
                recruiter: DEFAULT_RECRUITER,
                metrics: [
                    { label: 'Avg. Time to Hire', value: '18 days', change: '-3d', positive: true },
                    { label: 'Pipeline Velocity', value: '4.2 candidates/week', change: '+15%', positive: true },
                    { label: 'Evidence Coverage', value: '68%', change: '+8%', positive: true },
                    { label: 'Offer Acceptance', value: '60%', change: '-5%', positive: false }
                ],
                funnelData: [
                    { stage: 'Applied', count: 48, percentage: 100 },
                    { stage: 'Screened', count: 32, percentage: 67 },
                    { stage: 'Interviewed', count: 14, percentage: 29 },
                    { stage: 'Offered', count: 5, percentage: 10 },
                    { stage: 'Hired', count: 3, percentage: 6 }
                ],
                skillTrends: [
                    { skill: 'Python', demand: 85, supply: 72 },
                    { skill: 'React', demand: 78, supply: 65 },
                    { skill: 'AWS', demand: 72, supply: 45 },
                    { skill: 'Docker', demand: 68, supply: 58 },
                    { skill: 'TypeScript', demand: 65, supply: 52 },
                    { skill: 'PostgreSQL', demand: 60, supply: 48 }
                ]
            });
            await analytics.save();
            console.log('✅ Hiring Analytics seeded successfully!');
        }

        // 3. Seed Placement Intelligence
        const placementCount = await PlacementIntelligence.countDocuments();
        if (placementCount === 0) {
            console.log('🌱 Seeding Placement Intelligence...');
            const placement = new PlacementIntelligence({
                recruiter: DEFAULT_RECRUITER,
                batchStats: [
                    { batch: 'Class of 2026', total: 450, placed: 315, rate: 70 },
                    { batch: 'Class of 2025', total: 420, placed: 386, rate: 92 },
                    { batch: 'Class of 2024', total: 400, placed: 375, rate: 94 }
                ],
                topEmployers: [
                    { name: 'TechCorp', hires: 45, roles: 'Software Engineer, Data Analyst' },
                    { name: 'InnovateAI', hires: 32, roles: 'ML Engineer, Backend Developer' },
                    { name: 'GlobalFin', hires: 28, roles: 'Quantitative Analyst, SDE' },
                    { name: 'CloudSystems', hires: 25, roles: 'Cloud Architect, DevOps' }
                ]
            });
            await placement.save();
            console.log('✅ Placement Intelligence seeded successfully!');
        }

        // 4. Seed Evidence Summary
        const evidenceCount = await EvidenceSummary.countDocuments();
        if (evidenceCount === 0) {
            console.log('🌱 Seeding Evidence Summary...');
            const evidence = new EvidenceSummary({
                recruiter: DEFAULT_RECRUITER,
                sources: [
                    { source: 'Resume', collected: 12, verified: 8, pending: 4 },
                    { source: 'GitHub', collected: 6, verified: 5, pending: 1 },
                    { source: 'Interview', collected: 5, verified: 4, pending: 1 },
                    { source: 'Assessment', collected: 3, verified: 2, pending: 1 },
                    { source: 'LinkedIn', collected: 2, verified: 1, pending: 1 },
                    { source: 'Certificates', collected: 4, verified: 3, pending: 1 }
                ]
            });
            await evidence.save();
            console.log('✅ Evidence Summary seeded successfully!');
        }

        // 5. Seed Job Roles
        const jobRoleCount = await JobRole.countDocuments();
        if (jobRoleCount === 0) {
            console.log('🌱 Seeding Job Roles...');
            const roles = [
                {
                    title: 'Software Engineer',
                    requiredSkills: ['Javascript', 'Python', 'Java', 'Data Structures', 'Algorithms', 'SQL'],
                    preferredSkills: ['C++', 'Go', 'Docker', 'Git'],
                    softSkills: ['Problem Solving', 'Communication', 'Teamwork'],
                    expectedProjects: { count: 2, description: 'Demonstrated proficiency in building applications and optimizing algorithms.' },
                    expectedExperience: '0-2 years',
                    expectedTools: ['Git', 'VS Code', 'GitHub'],
                    expectedTechnologies: ['Node.js', 'React', 'PostgreSQL']
                },
                {
                    title: 'Frontend Developer',
                    requiredSkills: ['HTML', 'CSS', 'Javascript', 'React', 'TypeScript'],
                    preferredSkills: ['Redux', 'Next.js', 'TailwindCSS', 'Figma'],
                    softSkills: ['Attention to Detail', 'Design Thinking', 'Communication'],
                    expectedProjects: { count: 2, description: 'Responsive web apps displaying modern UI/UX practices and state management.' },
                    expectedExperience: '0-2 years',
                    expectedTools: ['npm', 'Webpack', 'Vite'],
                    expectedTechnologies: ['React', 'Vue', 'TailwindCSS']
                },
                {
                    title: 'Backend Developer',
                    requiredSkills: ['Node.js', 'Python', 'Express', 'SQL', 'MongoDB'],
                    preferredSkills: ['Django', 'PostgreSQL', 'Docker', 'Redis'],
                    softSkills: ['System Design', 'Logical Thinking', 'API Design'],
                    expectedProjects: { count: 2, description: 'Restful APIs, database design, and microservices architecture.' },
                    expectedExperience: '0-2 years',
                    expectedTools: ['Postman', 'Docker', 'AWS'],
                    expectedTechnologies: ['Express', 'FastAPI', 'PostgreSQL']
                },
                {
                    title: 'Full Stack Developer',
                    requiredSkills: ['React', 'Node.js', 'Javascript', 'SQL', 'Express'],
                    preferredSkills: ['TypeScript', 'Docker', 'Next.js', 'PostgreSQL'],
                    softSkills: ['End-to-end Ownership', 'Adaptability', 'Problem Solving'],
                    expectedProjects: { count: 3, description: 'Full stack deployment with user authentication, databases, and CRUD.' },
                    expectedExperience: '0-3 years',
                    expectedTools: ['Git', 'Docker', 'AWS', 'Postman'],
                    expectedTechnologies: ['React', 'Node.js', 'MongoDB', 'PostgreSQL']
                },
                {
                    title: 'AI Engineer',
                    requiredSkills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'Prompt Engineering'],
                    preferredSkills: ['Hugging Face', 'LangChain', 'FastAPI', 'Vector Databases'],
                    softSkills: ['Research Mindset', 'Data Logic', 'Analysis'],
                    expectedProjects: { count: 2, description: 'RAG pipelines, model fine-tuning, and AI agent integration.' },
                    expectedExperience: '0-2 years',
                    expectedTools: ['Jupyter Notebook', 'Git', 'Google Colab'],
                    expectedTechnologies: ['OpenAI API', 'ChromaDB', 'LangChain']
                },
                {
                    title: 'ML Engineer',
                    requiredSkills: ['Python', 'Machine Learning', 'Scikit-learn', 'Pandas', 'NumPy'],
                    preferredSkills: ['Deep Learning', 'PyTorch', 'MLflow', 'Docker'],
                    softSkills: ['Mathematical Analysis', 'Critical Thinking'],
                    expectedProjects: { count: 2, description: 'End-to-end machine learning model training, validation, and deployment.' },
                    expectedExperience: '1-3 years',
                    expectedTools: ['Docker', 'Kubeflow', 'AWS SageMaker'],
                    expectedTechnologies: ['Python', 'Scikit-learn', 'TensorFlow']
                },
                {
                    title: 'Data Scientist',
                    requiredSkills: ['Python', 'R', 'SQL', 'Data Visualization', 'Pandas'],
                    preferredSkills: ['Tableau', 'PowerBI', 'Hadoop', 'Spark'],
                    softSkills: ['Storytelling with Data', 'Business Acumen'],
                    expectedProjects: { count: 2, description: 'Data modeling, statistical hypothesis testing, and business reporting.' },
                    expectedExperience: '0-2 years',
                    expectedTools: ['SQL Server', 'Jupyter', 'Excel'],
                    expectedTechnologies: ['Python', 'SQL', 'Seaborn']
                },
                {
                    title: 'DevOps Engineer',
                    requiredSkills: ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS'],
                    preferredSkills: ['Terraform', 'Ansible', 'Bash scripting', 'Prometheus'],
                    softSkills: ['Collaboration', 'Automation Mindset', 'Troubleshooting'],
                    expectedProjects: { count: 2, description: 'Automated CI/CD pipelines, container orchestration, and infrastructure as code.' },
                    expectedExperience: '1-3 years',
                    expectedTools: ['Jenkins', 'GitHub Actions', 'Terraform', 'Kubernetes'],
                    expectedTechnologies: ['AWS', 'Docker', 'Linux']
                },
                {
                    title: 'Cloud Engineer',
                    requiredSkills: ['AWS', 'Cloud Architecture', 'Linux', 'Network Security'],
                    preferredSkills: ['Azure', 'GCP', 'Terraform', 'Docker'],
                    softSkills: ['System Engineering', 'Scalability Design'],
                    expectedProjects: { count: 2, description: 'High availability cloud infrastructure design and security configurations.' },
                    expectedExperience: '0-2 years',
                    expectedTools: ['AWS CLI', 'Terraform', 'CloudWatch'],
                    expectedTechnologies: ['AWS', 'Linux', 'Docker']
                },
                {
                    title: 'Cyber Security Engineer',
                    requiredSkills: ['Network Security', 'Cryptography', 'Linux', 'Penetration Testing'],
                    preferredSkills: ['Wireshark', 'Metasploit', 'SIEM', 'OWASP'],
                    softSkills: ['Analytical Mindset', 'Attention to Detail', 'Ethical Thinking'],
                    expectedProjects: { count: 2, description: 'Vulnerability assessment reporting, firewalls, and incident response simulations.' },
                    expectedExperience: '1-3 years',
                    expectedTools: ['Nmap', 'Wireshark', 'Kali Linux'],
                    expectedTechnologies: ['Linux', 'SIEM Tools', 'Python']
                }
            ];
            await JobRole.insertMany(roles);
            console.log('✅ Job Roles seeded successfully!');
        }

        console.log('🏁 Database checking/seeding complete.');
    } catch (error) {
        console.error('❌ Database seeding error:', error.message);
    }
};

module.exports = { seedDatabase };
