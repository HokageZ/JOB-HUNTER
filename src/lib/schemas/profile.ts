import { z } from "zod";

// === Step 1: Basic Info ===
export const basicInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().default(""),
    country: z.string().min(1, "Country is required"),
  }),
  languages: z.array(z.string()).min(1, "At least one language required"),
});

// === Step 2: Professional Identity ===
export const professionalSchema = z.object({
  specialty: z.enum([
    "software_engineering",
    "data_science",
    "machine_learning",
    "devops",
    "cybersecurity",
    "product_management",
    "ux_design",
    "ui_design",
    "graphic_design",
    "marketing",
    "sales",
    "finance",
    "accounting",
    "healthcare",
    "nursing",
    "education",
    "legal",
    "hr",
    "operations",
    "customer_support",
    "writing",
    "journalism",
    "architecture",
    "mechanical_engineering",
    "electrical_engineering",
    "civil_engineering",
    "project_management",
    "consulting",
    "research",
    "copywriting",
    "content_creation",
    "real_estate",
    "hospitality",
    "manufacturing",
    "social_work",
    "administration",
    "data_entry",
    "logistics",
    "other",
  ]),
  customSpecialty: z.string().optional(),
  currentTitle: z.string().min(1, "Job title is required"),
  experienceLevel: z.enum([
    "student",
    "entry",
    "junior",
    "mid",
    "senior",
    "lead",
    "executive",
  ]),
  yearsOfExperience: z.number().min(0).max(40),
  education: z.object({
    level: z.enum([
      "high_school",
      "associate",
      "bachelor",
      "master",
      "phd",
      "bootcamp",
      "self_taught",
      "other",
    ]),
    field: z.string().optional(),
    school: z.string().optional(),
    year: z.number().optional(),
  }),
});

// === Step 3: Skills & Expertise ===
export const skillsSchema = z.object({
  skills: z.array(z.string()).min(3, "At least 3 skills required"),
  certifications: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
});

// === Step 4: Job Preferences ===
export const preferencesSchema = z.object({
  desiredRoles: z.array(z.string()).min(1, "At least 1 desired role required"),
  desiredIndustries: z.array(z.string()).default([]),
  remotePreference: z.enum(["remote", "hybrid", "onsite", "any"]),
  desiredLocations: z.array(z.string()).default([]),
  willingToRelocate: z.boolean().default(false),
  sponsorshipNeeded: z.boolean().default(false),
  salaryMin: z.number().nullable().default(null),
  salaryMax: z.number().nullable().default(null),
  salaryCurrency: z.string().default("USD"),
  salaryInterval: z.enum(["yearly", "monthly", "weekly", "daily", "hourly"]).default("yearly"),
  jobTypes: z.array(z.enum(["fulltime", "parttime", "contract", "internship", "freelance"])).min(1, "Select at least 1 job type"),
  companySize: z.enum(["startup", "mid", "enterprise", "any"]).default("any"),
});

// === Full Profile Schema ===
export const profileSchema = basicInfoSchema
  .merge(professionalSchema)
  .merge(skillsSchema)
  .merge(preferencesSchema)
  .extend({
    profileCompleteness: z.number().default(0),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  });

export type ProfileFormData = z.infer<typeof profileSchema>;

// === Specialty-aware skill suggestions ===
export const SKILL_SUGGESTIONS: Record<string, string[]> = {
  software_engineering: [
    "JavaScript", "TypeScript", "Python", "React", "Node.js", "SQL",
    "Git", "AWS", "Docker", "Java", "C#", "Go", "Rust", "GraphQL",
    "REST APIs", "CI/CD", "MongoDB", "PostgreSQL", "Redis", "Kubernetes",
  ],
  data_science: [
    "Python", "R", "SQL", "Pandas", "NumPy", "TensorFlow", "PyTorch",
    "Statistics", "Tableau", "Power BI", "Spark", "Scikit-learn",
    "Data Visualization", "Machine Learning", "A/B Testing",
  ],
  machine_learning: [
    "Python", "TensorFlow", "PyTorch", "Scikit-learn", "Deep Learning",
    "NLP", "Computer Vision", "MLOps", "Hugging Face", "LangChain",
    "CUDA", "Statistics", "Linear Algebra", "Feature Engineering",
  ],
  devops: [
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform",
    "Ansible", "Jenkins", "CI/CD", "Linux", "Bash", "Python",
    "Monitoring", "Prometheus", "Grafana", "Nginx",
  ],
  cybersecurity: [
    "Network Security", "Penetration Testing", "SIEM", "Firewalls",
    "Incident Response", "Vulnerability Assessment", "Python",
    "Linux", "Wireshark", "Cryptography", "OWASP", "SOC",
  ],
  product_management: [
    "Product Strategy", "Roadmapping", "Agile", "Scrum", "Jira",
    "User Research", "Analytics", "A/B Testing", "SQL",
    "Stakeholder Management", "OKRs", "Figma",
  ],
  ux_design: [
    "Figma", "Sketch", "User Research", "Wireframing", "Prototyping",
    "A/B Testing", "Usability Testing", "Design Systems", "Adobe XD",
    "Information Architecture", "Accessibility", "CSS",
  ],
  ui_design: [
    "Figma", "Sketch", "Adobe XD", "Illustrator", "Photoshop",
    "Design Systems", "Typography", "Color Theory", "CSS",
    "Responsive Design", "Prototyping", "Framer",
  ],
  graphic_design: [
    "Photoshop", "Illustrator", "InDesign", "Figma", "Canva",
    "Typography", "Branding", "Print Design", "Color Theory",
    "Layout Design", "Motion Graphics", "After Effects",
  ],
  marketing: [
    "SEO", "SEM", "Content Strategy", "Google Analytics", "HubSpot",
    "Social Media", "Email Marketing", "Copywriting", "PPC",
    "Marketing Automation", "CRM", "Data Analysis",
    "Influencer Marketing", "Brand Strategy", "PR",
    "Event Marketing", "Market Research",
  ],
  sales: [
    "Salesforce", "CRM", "Lead Generation", "Negotiation",
    "Account Management", "Cold Calling", "Pipeline Management",
    "B2B Sales", "B2C Sales", "Presentation Skills",
    "Inside Sales", "Territory Management", "Sales Enablement",
    "Solution Selling", "Outbound Prospecting",
  ],
  finance: [
    "Excel", "Financial Modeling", "Bloomberg", "Risk Analysis",
    "Accounting", "SQL", "Python", "VBA", "Valuation",
    "Financial Reporting", "Budgeting", "Forecasting",
  ],
  accounting: [
    "GAAP", "Excel", "QuickBooks", "SAP", "Tax Preparation",
    "Auditing", "Financial Reporting", "Bookkeeping", "Payroll",
    "Accounts Payable", "Accounts Receivable",
  ],
  healthcare: [
    "EMR Systems", "Patient Care", "Clinical Research", "HIPAA",
    "Medical Terminology", "Vital Signs", "CPR", "Phlebotomy",
    "Electronic Health Records", "Healthcare Administration",
  ],
  nursing: [
    "Patient Assessment", "Medication Administration", "EMR",
    "Critical Care", "Wound Care", "IV Therapy", "CPR", "BLS",
    "ACLS", "Patient Education", "Care Planning",
  ],
  education: [
    "Curriculum Development", "Lesson Planning", "Classroom Management",
    "Assessment Design", "LMS", "Google Classroom", "Differentiation",
    "Special Education", "EdTech", "Student Engagement",
  ],
  legal: [
    "Legal Research", "Contract Drafting", "Litigation", "Compliance",
    "Westlaw", "LexisNexis", "Corporate Law", "IP Law",
    "Regulatory Compliance", "Due Diligence",
  ],
  hr: [
    "Recruiting", "HRIS", "Onboarding", "Benefits Administration",
    "Employee Relations", "Performance Management", "Workday",
    "ADP", "Labor Law", "Talent Acquisition",
  ],
  operations: [
    "Supply Chain", "Process Improvement", "Lean", "Six Sigma",
    "Project Management", "ERP", "Logistics", "Vendor Management",
    "Quality Assurance", "Inventory Management",
  ],
  customer_support: [
    "Zendesk", "Intercom", "Customer Service", "Troubleshooting",
    "Communication", "Conflict Resolution", "CRM", "Live Chat",
    "Technical Support", "Knowledge Base",
  ],
  writing: [
    "Copywriting", "Content Strategy", "SEO Writing", "Editing",
    "Proofreading", "WordPress", "Technical Writing", "Blogging",
    "Social Media", "Storytelling",
  ],
  journalism: [
    "Investigative Reporting", "AP Style", "Interviewing",
    "Fact-checking", "Deadline Management", "Multimedia",
    "CMS", "Social Media", "Data Journalism", "Editing",
  ],
  architecture: [
    "AutoCAD", "Revit", "SketchUp", "3D Modeling", "BIM",
    "Sustainable Design", "Building Codes", "Construction Documents",
    "Site Planning", "Project Management",
  ],
  mechanical_engineering: [
    "SolidWorks", "AutoCAD", "MATLAB", "FEA", "CFD",
    "3D Printing", "GD&T", "Thermodynamics", "Manufacturing",
    "CAD/CAM", "Material Science",
  ],
  electrical_engineering: [
    "Circuit Design", "PCB Layout", "MATLAB", "PLC Programming",
    "VHDL", "Embedded Systems", "Power Systems", "AutoCAD",
    "Signal Processing", "Control Systems",
  ],
  civil_engineering: [
    "AutoCAD", "STAAD", "Structural Analysis", "Surveying",
    "Concrete Design", "Steel Design", "Hydrology",
    "Environmental Engineering", "Project Management", "BIM",
  ],
  project_management: [
    "PMP", "Agile", "Scrum", "Jira", "MS Project", "Gantt Charts",
    "Risk Management", "Stakeholder Management", "Budgeting",
    "Resource Planning", "PRINCE2",
  ],
  consulting: [
    "Strategy", "Business Analysis", "PowerPoint", "Excel",
    "Data Analysis", "Project Management", "Client Management",
    "Problem Solving", "Industry Research", "Change Management",
  ],
  research: [
    "Research Design", "Statistical Analysis", "SPSS", "R", "Python",
    "Literature Review", "Data Collection", "Academic Writing",
    "Grant Writing", "Peer Review",
  ],
  copywriting: [
    "Copywriting", "SEO Writing", "Email Campaigns", "Landing Pages",
    "Brand Voice", "A/B Testing", "Google Ads", "Facebook Ads",
    "Content Strategy", "Headline Writing", "CTA Optimization",
    "Conversion Rate Optimization",
  ],
  content_creation: [
    "Video Editing", "Premiere Pro", "Final Cut", "YouTube",
    "TikTok", "Instagram", "Canva", "Photography", "Podcasting",
    "Storytelling", "Social Media Strategy", "Content Calendar",
  ],
  real_estate: [
    "Property Valuation", "MLS", "Negotiation", "CRM",
    "Market Analysis", "Client Relations", "Contract Management",
    "Staging", "Lead Generation", "Property Management",
  ],
  hospitality: [
    "Customer Service", "POS Systems", "Event Planning",
    "Food Safety", "Reservations", "Team Leadership",
    "Inventory Management", "Scheduling", "Upselling",
    "Conflict Resolution",
  ],
  manufacturing: [
    "Lean Manufacturing", "Six Sigma", "Quality Control",
    "CNC", "CAD", "Safety Compliance", "Production Planning",
    "Supply Chain", "5S", "Root Cause Analysis",
  ],
  social_work: [
    "Case Management", "Crisis Intervention", "Counseling",
    "Assessment", "Advocacy", "Mental Health", "Group Therapy",
    "Community Outreach", "Documentation", "Cultural Competency",
  ],
  administration: [
    "Microsoft Office", "Scheduling", "Filing", "Data Entry",
    "Calendar Management", "Travel Arrangements", "Communication",
    "Record Keeping", "Office Management", "Customer Service",
  ],
  data_entry: [
    "Typing Speed", "Excel", "Data Validation", "Accuracy",
    "Database Management", "Data Cleaning", "Spreadsheets",
    "Attention to Detail", "CRM", "ERP",
  ],
  logistics: [
    "Supply Chain", "Warehouse Management", "Inventory Control",
    "Freight", "Customs", "SAP", "Route Planning",
    "Procurement", "Vendor Management", "ERP",
  ],
};

// === Experience level descriptions ===
export const EXPERIENCE_DESCRIPTIONS: Record<string, string> = {
  student: "Currently in school, looking for internships",
  entry: "0-1 years, new grad or career changer",
  junior: "1-3 years of experience",
  mid: "3-6 years of experience",
  senior: "6-10 years of experience",
  lead: "10-15 years, team/tech lead level",
  executive: "15+ years, director/VP/C-level",
};
