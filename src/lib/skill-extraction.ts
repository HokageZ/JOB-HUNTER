// Pattern-based skill extraction from job descriptions

const TECH_SKILLS = [
  // Languages
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby",
  "php", "swift", "kotlin", "scala", "perl", "r", "matlab", "lua", "dart",
  "objective-c", "haskell", "elixir", "clojure", "erlang", "fortran", "cobol",
  "assembly", "vba", "groovy", "f#", "julia",

  // Frontend
  "react", "angular", "vue", "svelte", "next.js", "nuxt.js", "gatsby", "remix",
  "html", "css", "sass", "less", "tailwind", "bootstrap", "material ui",
  "styled-components", "webpack", "vite", "rollup", "babel", "eslint", "prettier",
  "storybook", "cypress", "playwright", "jest", "vitest", "mocha", "jasmine",
  "selenium", "puppeteer", "jquery",

  // Backend
  "node.js", "express", "fastify", "nest.js", "django", "flask", "fastapi",
  "spring", "spring boot", "rails", "laravel", "asp.net", ".net", "gin",
  "fiber", "echo", "actix", "rocket", "phoenix", "sinatra", "koa",

  // Mobile
  "react native", "flutter", "ionic", "xamarin", "swiftui", "jetpack compose",
  "android", "ios",

  // Cloud & DevOps
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible",
  "pulumi", "cloudformation", "helm", "istio", "prometheus", "grafana",
  "datadog", "new relic", "splunk", "elk", "jenkins", "github actions",
  "gitlab ci", "circleci", "travis ci", "argo cd", "spinnaker",
  "vagrant", "packer", "consul", "vault", "nginx", "apache", "caddy",
  "serverless", "lambda", "cloudflare", "vercel", "netlify", "heroku",

  // Databases
  "postgresql", "mysql", "mariadb", "mongodb", "redis", "elasticsearch",
  "cassandra", "dynamodb", "couchdb", "neo4j", "firebase", "supabase",
  "sqlite", "oracle", "sql server", "memcached", "influxdb", "clickhouse",

  // Data & ML
  "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn", "keras",
  "opencv", "spark", "hadoop", "airflow", "dbt", "snowflake", "bigquery",
  "redshift", "databricks", "mlflow", "kubeflow", "hugging face",
  "langchain", "llamaindex", "openai", "stable diffusion",
  "tableau", "power bi", "looker", "d3.js", "matplotlib", "plotly",

  // APIs & Protocols
  "sql", "nosql", "graphql", "rest", "grpc", "websocket", "mqtt",
  "rabbitmq", "kafka", "celery", "redis queue", "sqs", "sns",
  "oauth", "jwt", "saml", "openid",

  // Systems
  "linux", "unix", "bash", "powershell", "windows server",
  "networking", "tcp/ip", "dns", "load balancing", "cdn",

  // Security
  "owasp", "penetration testing", "siem", "firewalls", "ssl/tls",
  "encryption", "vulnerability assessment", "soc", "nist",

  // Project & Methodology
  "git", "ci/cd", "agile", "scrum", "kanban", "jira", "confluence",
  "trello", "asana", "notion", "linear", "figma", "sketch", "adobe xd",
  "photoshop", "illustrator", "blender",

  // Industry
  "blockchain", "solidity", "web3", "ethereum", "nft",
  "iot", "embedded systems", "fpga", "vhdl", "verilog",
  "game development", "unity", "unreal engine", "godot",
  "ar/vr", "3d modeling", "cad", "solidworks", "autocad",

  // Soft/Business
  "product management", "project management", "stakeholder management",
  "technical writing", "documentation", "api design", "system design",
  "microservices", "monolith", "event-driven", "domain-driven design",
  "test-driven development", "pair programming", "code review",
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractSkillsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  return TECH_SKILLS.filter((skill) => {
    const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
    return regex.test(lowerText);
  });
}
