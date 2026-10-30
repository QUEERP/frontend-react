export interface ExecutionTypeItem {
  label: string;
  value: string;
  category?: string;
}

export const ALL_PROJECT_TYPES = [
  // ── Development & Technical Solutions ──
  "Software",
  "Basic",
  "Web Application / Portal",
  "Mobile Application (iOS / Android)",
  "Cloud Infrastructure & DevOps",
  "Data & AI / Machine Learning",
  "Cybersecurity & Compliance",
  "ERP Implementation",
  "CRM Implementation",
  "Digital Transformation",
  "E-Commerce Platform",
  "System Integration & APIs",
  "API & Microservices",

  // ── Project Delivery & Lifecycle ──
  "New Implementation",
  "Upgrade / Expansion",
  "Maintenance & Support",
  "Consulting / Advisory",
  "Audit / Research",
  "Turnkey Project",
  "Migration & Modernization",
  "Proof of Concept (PoC)",
  "Research & Development (R&D)",
  "Internal Project",
  "Client Delivery",

  // ── Engineering, Industry & Commercial Domains ──
  "Manufacturing",
  "Trading & Distribution",
  "Consultancy",
  "Marketing & Advertising",
  "Maintenance",
  "Interior & Fitout",
  "Architecture & Design",
  "Healthcare & Life Sciences",
  "Education & EdTech",
  "Construction & Real Estate",
  "Financial Services & Banking",
  "Logistics & Supply Chain",
  "Telecommunications",
  "Energy & Utilities",
  "Hospitality & Tourism",
  "Automotive",
  "Aerospace",
  "Retail",
  "Other"
];

export const ALL_EXECUTION_TYPES: ExecutionTypeItem[] = [
  // ── Core Delivery Models ──
  { label: "Auto Detect", value: "AUTO_DETECT", category: "Core Delivery Models" },
  { label: "Service", value: "SERVICE", category: "Core Delivery Models" },
  { label: "Product", value: "PRODUCT", category: "Core Delivery Models" },
  { label: "Hybrid", value: "HYBRID", category: "Core Delivery Models" },

  // ── Contract & Billing Models (from Requirements & Planning) ──
  { label: "Turnkey (End-to-End)", value: "TURNKEY", category: "Contract & Billing Models" },
  { label: "Time & Materials (T&M)", value: "TIME_AND_MATERIALS", category: "Contract & Billing Models" },
  { label: "Fixed Price / Milestone", value: "FIXED_PRICE", category: "Contract & Billing Models" },
  { label: "Retainer / Ongoing Support", value: "RETAINER", category: "Contract & Billing Models" },
  { label: "Milestone-Based", value: "MILESTONE_BASED", category: "Contract & Billing Models" },

  // ── Methodology & Resource Models ──
  { label: "Dedicated Team / Staff Augmentation", value: "DEDICATED_TEAM", category: "Methodology & Resource Models" },
  { label: "Agile / Sprint-Based", value: "AGILE", category: "Methodology & Resource Models" },
  { label: "Waterfall", value: "WATERFALL", category: "Methodology & Resource Models" },
  { label: "Build-Operate-Transfer (BOT)", value: "BOT", category: "Methodology & Resource Models" }
];

