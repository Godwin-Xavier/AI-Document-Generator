// Industry-specific overlays. These are injected into the AI prompt to
// adapt sections, terminology, compliance, KPIs and risks based on industry.

export type IndustryId =
  | "general"
  | "saas"
  | "healthcare"
  | "finance"
  | "manufacturing"
  | "ecommerce"
  | "government"
  | "consulting"
  | "education"
  | "construction"
  | "telecom";

export interface IndustryProfile {
  id: IndustryId;
  label: string;
  compliance: string[];
  extraSections: string[];
  terminology: string[];
  kpis: string[];
  risks: string[];
  typicalDeliverables: string[];
}

export const INDUSTRIES: IndustryProfile[] = [
  {
    id: "general",
    label: "General / Not Specified",
    compliance: ["General data protection best practices", "Applicable local laws"],
    extraSections: [],
    terminology: ["Standard business terminology"],
    kpis: ["On-time delivery", "Within-budget delivery", "Stakeholder satisfaction"],
    risks: ["Scope creep", "Resource availability", "Integration risk"],
    typicalDeliverables: ["Project plan", "Design docs", "UAT reports", "Go-live runbook"],
  },
  {
    id: "saas",
    label: "SaaS / Technology / Software",
    compliance: ["SOC 2 Type II", "GDPR / CCPA data residency", "ISO 27001", "OWASP Top 10", "Open-source license compliance"],
    extraSections: [
      "Multi-tenancy & data isolation",
      "API specifications and rate limiting",
      "Feature flag & rollout strategy",
      "Observability (logs, metrics, traces)",
      "Disaster recovery / RTO / RPO",
    ],
    terminology: [
      "MRR/ARR, CAC, LTV, churn, DAU/MAU",
      "Feature flags, canary deployment, blue/green",
      "OAuth, OIDC, SSO, WAF, CDN",
      "p50/p95/p99 latency",
    ],
    kpis: [
      "Uptime SLA (e.g., 99.9% / 99.99%)",
      "RTO < 4h, RPO < 1h",
      "API p95 latency < 200ms",
      "MTTR, MTBF",
      "Customer satisfaction (CSAT / NPS)",
    ],
    risks: [
      "Vendor lock-in & data portability",
      "Third-party API deprecation",
      "Scaling bottlenecks under load",
      "Security incident / breach",
      "Subprocessor compliance drift",
    ],
    typicalDeliverables: [
      "OpenAPI / Swagger documentation",
      "Architecture diagrams (C4)",
      "CI/CD pipelines",
      "Runbooks and on-call rotation",
      "Customer onboarding and migration guides",
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare / Medical / Pharma",
    compliance: [
      "HIPAA (Privacy, Security, Breach Notification Rules)",
      "HITECH Act",
      "21 CFR Part 11 (FDA electronic records/signatures)",
      "FDA GxP (GMP/GLP/GCP) if applicable",
      "HL7 / FHIR interoperability",
      "Business Associate Agreement (BAA) mandatory",
    ],
    extraSections: [
      "Data Privacy Impact Assessment (DPIA)",
      "PHI handling, encryption at rest & in transit (AES-256)",
      "Access control & audit trail of PHI access",
      "Validation (IQ / OQ / PQ) for regulated systems",
      "Breach notification procedure (60 days HITECH)",
      "De-identification methodology (Safe Harbor / Expert Determination)",
    ],
    terminology: [
      "PHI / ePHI (not 'personal data')",
      "Covered Entity, Business Associate, Subcontractor",
      "Part 11 compliant",
      "Adverse Event, SAE, Pharmacovigilance",
    ],
    kpis: [
      "100% PHI encrypted at rest & in transit",
      "Critical vuln patched within 30 days",
      "100% HIPAA training completion annually",
      "Breach detection & notification < 24h internal / 60d regulatory",
      "Data validation error rate < 0.1%",
    ],
    risks: [
      "HIPAA violation ($100-$50k per violation; cap $1.9M/year)",
      "FDA warning letter or recall",
      "Unauthorized PHI disclosure",
      "Non-compliant subprocessor",
      "Interoperability (HL7/FHIR) gaps",
    ],
    typicalDeliverables: [
      "System Security Plan (SSP)",
      "Risk Management Plan (ISO 14971 when applicable)",
      "Validation protocols (IQ/OQ/PQ)",
      "SOPs for PHI handling",
      "BAA and vendor attestations",
      "Breach response playbook",
    ],
  },
  {
    id: "finance",
    label: "Financial Services / Banking / Fintech",
    compliance: [
      "SOX 404 (ICFR)",
      "PCI-DSS 4.0.1 (enforced March 2025)",
      "GLBA Safeguards Rule",
      "Basel III (banks)",
      "AML / KYC procedures",
      "FFIEC guidance, OCC / Fed / FDIC oversight",
      "SEC breach disclosure (Form 8-K within 4 business days for material incidents)",
    ],
    extraSections: [
      "Segregation of duties and access controls",
      "Financial transaction reconciliation and audit trails",
      "Fraud detection and transaction monitoring thresholds",
      "Business continuity with RTO < 2h for core banking",
      "Cardholder Data Environment (CDE) scoping",
      "Change-management approval workflow",
    ],
    terminology: [
      "Cardholder Data Environment (CDE)",
      "PII (not PHI)",
      "SAR (Suspicious Activity Report)",
      "KYC, AML, CTR",
      "Capital Adequacy Ratio, LCR",
    ],
    kpis: [
      "100% SOX key-control test effectiveness",
      "PCI-DSS 12 requirements zero non-compliance",
      "Payment/settlement SLA >= 99.99% uptime",
      "Incident detection < 1 hour median",
      "Fraud detection precision/recall targets",
    ],
    risks: [
      "PCI-DSS fines and processor termination",
      "SOX restatement / material weakness",
      "Regulator sanctions (Fed, OCC, FDIC, SEC)",
      "AML / sanctions exposure",
      "Customer data breach liability",
    ],
    typicalDeliverables: [
      "SOX compliance framework & control matrix",
      "PCI-DSS ROC / SAQ",
      "Risk assessment & risk register",
      "Infosec policy & standards",
      "BCP/DR test reports",
    ],
  },
  {
    id: "manufacturing",
    label: "Manufacturing / Industrial",
    compliance: [
      "ISO 9001:2015 Quality Management",
      "ISO 14001 Environmental Management",
      "IATF 16949 (automotive)",
      "OSHA workplace safety",
      "Product-specific standards (UL, CE, FDA, etc.)",
    ],
    extraSections: [
      "Control Plan with FMEA (Failure Mode & Effects Analysis)",
      "Process capability (Cpk target >= 1.33)",
      "Inspection & testing plan (incoming, in-process, final)",
      "CAPA (Corrective & Preventive Action) tracking",
      "Statistical Process Control (SPC)",
      "Supplier quality & dual-sourcing",
    ],
    terminology: [
      "DMAIC, Kaizen, Poka-yoke",
      "Cp / Cpk / Ppk",
      "FMEA, RPN",
      "OEE (Overall Equipment Effectiveness)",
    ],
    kpis: [
      "Defect rate < 100 PPM",
      "Cpk >= 1.33 (ideal 1.67)",
      "First-Pass Yield > 95%",
      "OEE > 85%",
      "On-Time Delivery > 98%",
    ],
    risks: [
      "Quality failure / recall",
      "Single-source supplier disruption",
      "OSHA / environmental violation",
      "Process drift / out-of-spec",
      "Capacity shortfall",
    ],
    typicalDeliverables: [
      "Quality Management System (QMS) documentation",
      "Control Plan + FMEA",
      "Cpk baseline study",
      "Supplier scorecards & audit reports",
      "CAPA log",
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce / Retail",
    compliance: [
      "PCI-DSS 4.0.1",
      "GDPR / CCPA / CPRA",
      "FTC Act Section 5",
      "WCAG 2.1 AA accessibility",
      "State consumer-protection and return laws",
    ],
    extraSections: [
      "Payment processing & fraud prevention",
      "Order-to-fulfillment workflow with SLAs",
      "Refund, chargeback, and dispute handling",
      "Inventory & stock management",
      "3PL / shipping partner governance",
      "Peak-event readiness (Black Friday / Cyber Monday)",
    ],
    terminology: [
      "Cardholder Data, CDE",
      "SKU, 3PL, fulfillment center",
      "Chargeback, dispute, refund reversal",
      "WCAG, ADA compliance",
    ],
    kpis: [
      "Payment success rate > 99.5%",
      "Chargeback rate < 0.05%",
      "Order-to-delivery 2-5 days",
      "Site uptime >= 99.9% (99.99% peak)",
      "NPS / CSAT targets",
    ],
    risks: [
      "PCI non-compliance & payment termination",
      "Chargeback / fraud losses",
      "Customer data breach",
      "Stockout / oversell during peak",
      "WCAG / ADA lawsuits",
    ],
    typicalDeliverables: [
      "PCI attestation / SAQ",
      "Website security assessment",
      "Inventory & OMS documentation",
      "3PL SLA agreements",
      "Privacy & return policy",
    ],
  },
  {
    id: "government",
    label: "Government / Public Sector",
    compliance: [
      "FISMA",
      "FedRAMP (Low / Moderate / High)",
      "NIST SP 800-53 controls",
      "CMMC Level 1/2/3 (DoD suppliers)",
      "Section 508 accessibility",
      "FOIA / records retention",
    ],
    extraSections: [
      "System Security Plan (SSP)",
      "Security Assessment Report (SAR)",
      "Plan of Action & Milestones (POA&M)",
      "Continuous monitoring plan",
      "Contingency Plan with annual DR testing",
      "Supply-chain risk management",
    ],
    terminology: [
      "ATO (Authority to Operate)",
      "FIPS 199 impact baseline (Low/Moderate/High)",
      "Control families (AC, AU, SI, SC...)",
      "FedRAMP JAB / Agency authorization",
    ],
    kpis: [
      "100% of required NIST controls implemented",
      "Zero critical vulnerabilities on monthly scan",
      "Incident response < 1h detection, < 4h containment",
      "100% annual security training",
      "Availability >= 99.9% for mission-critical",
    ],
    risks: [
      "FedRAMP denial / ATO loss",
      "FISMA penalty & contract ineligibility",
      "Supply-chain compromise (foreign vendor)",
      "Data spillage",
      "Loss of CMMC eligibility",
    ],
    typicalDeliverables: [
      "SSP, SAR, POA&M",
      "Risk Management Plan",
      "Continuous Monitoring Plan",
      "IR plan & test results",
      "Personnel security documentation",
    ],
  },
  {
    id: "consulting",
    label: "Consulting / Professional Services",
    compliance: [
      "MSA / engagement letter with liability cap",
      "Professional liability (E&O) insurance",
      "Confidentiality / NDA obligations",
      "IP ownership & background IP carve-outs",
      "Local licensing where applicable",
    ],
    extraSections: [
      "Scope definition with explicit out-of-scope",
      "Change-order process and pricing",
      "Named resources and time commitment",
      "Steering committee / governance cadence",
      "Knowledge transfer & post-engagement support",
    ],
    terminology: [
      "Engagement, retainer, T&M vs fixed-fee",
      "Acceptance criteria, sign-off authority",
      "RACI matrix",
      "Background IP, work product",
    ],
    kpis: [
      "Billable utilization 70-85%",
      "Project margin 30-40%",
      "On-time/on-budget delivery",
      "Client CSAT / NPS",
      "Staff retention",
    ],
    risks: [
      "Scope creep without change orders",
      "Key consultant departure mid-engagement",
      "Client dissatisfaction from unmet expectations",
      "IP dispute over methodologies",
      "Poor knowledge transfer",
    ],
    typicalDeliverables: [
      "SOW with detailed scope",
      "Project plan with schedule & resources",
      "Status reports (weekly/monthly)",
      "Findings & recommendations",
      "Training materials & knowledge transfer",
      "Final report with lessons learned",
    ],
  },
  {
    id: "education",
    label: "Education / EdTech",
    compliance: [
      "FERPA",
      "COPPA (children < 13 with verifiable parental consent)",
      "WCAG 2.1 AA accessibility",
      "State student-privacy laws (SOPIPA, etc.)",
      "SOC 2 Type II (district expectation)",
      "Data Processing Agreement (DPA)",
    ],
    extraSections: [
      "Student data minimization",
      "Parental access / amendment / opt-out",
      "Accessibility audit & remediation roadmap",
      "Third-party vendor risk assessment",
      "Breach notification to parents/guardians",
      "Directory information handling",
    ],
    terminology: [
      "PII from education records",
      "Directory information",
      "Verifiable parental consent",
      "VPAT (Voluntary Product Accessibility Template)",
    ],
    kpis: [
      "WCAG 2.1 AA compliance coverage",
      "100% of student data access logged",
      "100% annual FERPA training",
      "Patch deployment within 30-60 days",
      "Parent data-request fulfillment < 10 days",
    ],
    risks: [
      "FERPA violation & US Dept. of Education investigation",
      "COPPA enforcement action",
      "Student data breach",
      "WCAG / ADA lawsuit",
      "Unauthorized data resale by subprocessor",
    ],
    typicalDeliverables: [
      "FERPA policy & training",
      "WCAG 2.1 AA audit report",
      "DPA template",
      "Vendor assessment scorecard",
      "Breach & parent-notification template",
    ],
  },
  {
    id: "construction",
    label: "Real Estate / Construction",
    compliance: [
      "IBC / NEC / IPC (as adopted locally)",
      "OSHA construction safety",
      "ADA Title II/III accessibility",
      "Environmental permits",
      "Contractor licensing & bonding",
      "Lien-law notice requirements",
    ],
    extraSections: [
      "CPM schedule & critical path",
      "Site safety plan (OSHA 30-hour)",
      "Inspection & permit sign-off log",
      "Change-order process with cost impact",
      "Subcontractor management & insurance verification",
      "Punch list & substantial completion process",
    ],
    terminology: [
      "RFI (Request for Information)",
      "Change order / change directive",
      "Lien, surety bond, payment bond",
      "Punch list, substantial completion",
      "BIM, CPM",
    ],
    kpis: [
      "Schedule variance < 10%",
      "Cost variance < 5%",
      "Safety incidents (OSHA recordables) — target 0",
      "First-pass inspection approval",
      "Rework rate < 2%",
    ],
    risks: [
      "Code violation / failed inspection",
      "Safety incident / OSHA fine",
      "Permit / zoning delay",
      "Subcontractor insolvency",
      "Latent-defect warranty claims",
    ],
    typicalDeliverables: [
      "Detailed SOW with specifications",
      "CPM schedule (Gantt)",
      "Safety plan & OSHA compliance",
      "QA plan & inspection checklist",
      "As-built documentation",
    ],
  },
  {
    id: "telecom",
    label: "Telecom / Media",
    compliance: [
      "FCC Title 47",
      "Closed-captioning (Telecom Act of 1996)",
      "EAS (Emergency Alert System)",
      "Public Inspection File",
      "Children's Programming rules",
      "Political-advertising disclosure",
    ],
    extraSections: [
      "Content compliance & captioning QA",
      "EAS testing schedule",
      "Public File maintenance",
      "Broadcast technical specifications",
      "Subscriber data security",
      "Content licensing (music, sports, syndicated)",
    ],
    terminology: [
      "Closed caption (CC)",
      "Public Inspection File",
      "EAS, NPRM",
      "Must-carry, retransmission",
    ],
    kpis: [
      "Caption accuracy > 98%",
      "EAS monthly/weekly test 100%",
      "Public File completeness 100%",
      "Broadcast uptime >= 99.9%",
      "Zero content-compliance violations",
    ],
    risks: [
      "FCC fine / forfeiture",
      "License renewal denial",
      "Captioning / accessibility failure",
      "EAS equipment failure",
      "Copyright / music-licensing violation",
    ],
    typicalDeliverables: [
      "FCC compliance plan",
      "Content guidelines & editorial standards",
      "Captioning QA procedures",
      "EAS test schedule & logs",
      "Public File checklist",
    ],
  },
];

export function getIndustry(id: IndustryId): IndustryProfile {
  return INDUSTRIES.find((x) => x.id === id) ?? INDUSTRIES[0];
}
