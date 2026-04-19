// Document catalog — structure, purpose, and section outlines for each
// document type the tool supports. These outlines are derived from
// industry-standard references (BABOK, PMBOK, IEEE 830, arc42, TOGAF).

export type DocType =
  | "brd"
  | "sow"
  | "scope"
  | "contract"
  | "srs"
  | "solution"
  | "architecture";

export interface DocMeta {
  id: DocType;
  label: string;
  short: string;
  description: string;
  standardBasis: string;
  sections: { title: string; hint: string }[];
}

export const DOC_CATALOG: DocMeta[] = [
  {
    id: "brd",
    label: "Business Requirements Document (BRD)",
    short: "BRD",
    description:
      "Business-level requirements — what the business needs and why. Used to align stakeholders before solution design.",
    standardBasis: "BABOK v3, IIBA, PMI",
    sections: [
      { title: "Document Control", hint: "Version history, author, reviewers, approvers, revision log" },
      { title: "Executive Summary", hint: "High-level overview: business goals, scope, outcomes" },
      { title: "Purpose & Business Context", hint: "Problem statement, drivers, strategic alignment" },
      { title: "Scope Statement", hint: "In-scope, out-of-scope, boundaries" },
      { title: "Stakeholders & Roles", hint: "RACI-style list with responsibilities and approval authority" },
      { title: "Business Requirements", hint: "Functional requirements prioritized (MoSCoW) by business value" },
      { title: "User Personas", hint: "Primary and secondary personas — role, goals, pain points, technical proficiency. Align with industry-typical user archetypes." },
      { title: "User Stories", hint: "Industry-aligned user stories in the INVEST-compliant format: 'As a <persona>, I want <capability> so that <benefit>.' Include acceptance criteria using Given/When/Then (Gherkin). Group by epic. Prioritize with MoSCoW." },
      { title: "Use Cases", hint: "UML-style use cases for major flows. For each: Use Case ID & Name, Actors, Preconditions, Postconditions, Main Flow (numbered), Alternate Flows, Exception Flows, Business Rules, Frequency, Priority. Apply industry-specific edge cases (e.g., HIPAA audit trail for healthcare)." },
      { title: "Non-Functional Requirements", hint: "Performance, scalability, usability, availability, compliance" },
      { title: "Constraints", hint: "Technical, regulatory, budgetary, timeline, resource" },
      { title: "Assumptions", hint: "Explicit assumptions about environment, team, partnerships" },
      { title: "Dependencies", hint: "External dependencies, internal teams, third-party integrations" },
      { title: "Success Criteria & KPIs", hint: "Measurable outcomes, KPIs, business objectives measurement" },
      { title: "Risks & Mitigation", hint: "Business risks identified with initial mitigation strategies" },
      { title: "Glossary", hint: "Business terms, acronyms and definitions" },
      { title: "Approvals & Sign-off", hint: "Signature block for business owner, sponsor, PM" },
    ],
  },
  {
    id: "sow",
    label: "Statement of Work (SOW)",
    short: "SOW",
    description:
      "Contractual project specification — deliverables, timeline, pricing, governance, and acceptance criteria.",
    standardBasis: "PMBOK 6/7, PMI",
    sections: [
      { title: "Parties & Effective Date", hint: "Service provider, client, contract period" },
      { title: "Project Overview & Objectives", hint: "High-level description, business alignment, outcomes" },
      { title: "Detailed Scope of Work", hint: "Narrative of deliverables, work tasks, methodologies, exclusions" },
      { title: "Period of Performance", hint: "Start/end dates, milestones, key checkpoints" },
      { title: "Deliverables & Acceptance Criteria", hint: "Deliverables list, format, quality standards, acceptance process" },
      { title: "Roles & Responsibilities", hint: "Service provider duties, client duties, governance" },
      { title: "Assumptions & Dependencies", hint: "What must be true for the project to succeed on time" },
      { title: "Fees, Pricing & Payment Terms", hint: "Cost breakdown, milestone billing, invoicing, late payment" },
      { title: "Change Management", hint: "How scope, schedule, cost changes are requested and approved" },
      { title: "Performance Metrics & SLAs", hint: "Service levels, uptime, response, measurement methods" },
      { title: "Risks & Mitigation", hint: "Project-level risks and planned mitigations" },
      { title: "Confidentiality & Intellectual Property", hint: "IP ownership, NDA scope, data handling" },
      { title: "Termination & Exit", hint: "Termination for cause/convenience, transition, wind-down" },
      { title: "Dispute Resolution & Governing Law", hint: "Escalation, arbitration/mediation, jurisdiction" },
      { title: "Approvals & Signature Block", hint: "Authorized signatories on both sides" },
    ],
  },
  {
    id: "scope",
    label: "Scope of Work (Lightweight)",
    short: "Scope",
    description:
      "A lightweight, tactical task plan focused on deliverables and timeline. Often a section inside SOW but usable standalone for internal phases.",
    standardBasis: "PMI work-package standard, common internal practice",
    sections: [
      { title: "Project Title & Overview", hint: "Project name, phase, high-level description" },
      { title: "Goals & Objectives", hint: "Specific, measurable outcomes for this scope" },
      { title: "Tasks & Activities", hint: "Work items with owners and dependencies" },
      { title: "Deliverables", hint: "Outputs, formats, delivery dates" },
      { title: "Timeline & Milestones", hint: "Start/end dates, milestones, critical path" },
      { title: "Success Criteria", hint: "Measurable acceptance criteria, quality standards" },
      { title: "Resources & Team", hint: "Team members, skills, capacity" },
      { title: "Constraints & Dependencies", hint: "Time, resource, external blockers" },
      { title: "Out of Scope / Exclusions", hint: "Explicit items NOT being delivered in this scope" },
      { title: "Approvals", hint: "Sign-off authority, approval process" },
    ],
  },
  {
    id: "contract",
    label: "Executable Service Contract",
    short: "Service Contract",
    description:
      "Legal services agreement — pricing, terms, confidentiality, liability, dispute resolution. Based on the Dynamix Solutions sample.",
    standardBasis: "Dynamix Solutions standard template, IT services MSA patterns",
    sections: [
      { title: "Parties", hint: "Service provider (Dynamix Solutions) and Client with registered addresses" },
      { title: "Effective Date", hint: "Date of signature" },
      { title: "Scope of Services", hint: "Services with Implementation Phase Table (S.No / Task / Days)" },
      { title: "Fees and Payment", hint: "Fee structure table; 50% upfront + 50% on Go-Live standard" },
      { title: "Timeline and Deliverables", hint: "Tentative schedule by phase (Requirement, Dev & DEMO, Testing, Go-Live)" },
      { title: "Responsibilities of the Parties", hint: "4.1 Provider responsibilities; 4.2 Client responsibilities" },
      { title: "Intellectual Property", hint: "IP ownership and assignment" },
      { title: "Confidentiality", hint: "Mutual NDA" },
      { title: "Termination", hint: "Termination for cause/convenience, notice, payment for work done" },
      { title: "Limitation of Liability", hint: "Cap at total paid fees; no consequential damages" },
      { title: "Force Majeure", hint: "Standard force majeure clause" },
      { title: "Dispute Resolution", hint: "Amicable first; arbitration under AAA, New York (configurable)" },
      { title: "Acceptance of Terms", hint: "Dual signature block (Provider & Client)" },
    ],
  },
  {
    id: "srs",
    label: "Software Requirements Specification (SRS)",
    short: "SRS",
    description:
      "Complete, unambiguous technical specification for development teams. Based on IEEE 830-1998.",
    standardBasis: "IEEE 830-1998 / ISO/IEC/IEEE 29148",
    sections: [
      { title: "1. Introduction", hint: "1.1 Purpose, 1.2 Scope, 1.3 Definitions & Acronyms, 1.4 References, 1.5 Overview" },
      { title: "2. Overall Description", hint: "2.1 Product Perspective, 2.2 Product Functions, 2.3 User Characteristics, 2.4 Constraints, 2.5 Assumptions & Dependencies" },
      { title: "3. System Features / Specific Requirements", hint: "Each feature: description, inputs, processing, outputs, error conditions. Use FR-001, FR-002 numbering." },
      { title: "4. External Interface Requirements", hint: "User, hardware, software, communication interfaces" },
      { title: "5. Non-Functional Requirements", hint: "Performance, security, reliability, availability, usability, maintainability, portability with quantified targets" },
      { title: "6. Data Requirements", hint: "Data structures, persistence, retention, privacy, data model overview" },
      { title: "7. Verification & Test Criteria", hint: "How each requirement is verified/tested (review, demo, test, analysis)" },
      { title: "8. Appendices", hint: "Use-case diagrams, analysis models, glossary, traceability matrix" },
    ],
  },
  {
    id: "solution",
    label: "Solution Document / Solution Design",
    short: "Solution Doc",
    description:
      "High-level solution architecture and approach that bridges business requirements and detailed technical design.",
    standardBasis: "TOGAF ADM (Phases B-D), solution architecture practice",
    sections: [
      { title: "Executive Summary", hint: "Solution overview, benefits, alignment with business goals, investment summary" },
      { title: "Problem Statement & Business Context", hint: "Current state, gaps, drivers, success criteria" },
      { title: "Solution Overview", hint: "Solution vision, target state, in-scope capabilities" },
      { title: "Architecture Overview (High Level)", hint: "Major components, tiers, key modules, context diagram (text)" },
      { title: "Component Descriptions", hint: "Each major component: responsibilities, interfaces, technology" },
      { title: "Data Architecture", hint: "Data flows, storage strategy, master data, integration points" },
      { title: "Technology Stack & Platform", hint: "Chosen technologies, rationale, alternatives considered" },
      { title: "Integration Architecture", hint: "External integrations, APIs, protocols, data exchange" },
      { title: "Security & Compliance Architecture", hint: "Security model, compliance framework mapping, data protection" },
      { title: "Scalability & Performance Strategy", hint: "Growth assumptions, scaling approach, performance targets" },
      { title: "Implementation Approach & Roadmap", hint: "Phasing, rollout, migration, go-live approach with milestones" },
      { title: "Operational & Support Model", hint: "Support tiers, SLAs, monitoring, incident management" },
      { title: "Risks, Assumptions & Dependencies", hint: "Solution-level risks, assumptions, dependencies" },
      { title: "Cost & Investment Summary", hint: "Estimated cost (build, run), ROI/benefit summary" },
      { title: "Success Criteria & Governance", hint: "Acceptance metrics, steering committee, governance cadence" },
      { title: "Appendices", hint: "Reference architectures, decision log, glossary" },
    ],
  },
  {
    id: "architecture",
    label: "System Architecture Document",
    short: "Architecture",
    description:
      "Detailed technical architecture blueprint for development and operations teams. Based on arc42 and the 4+1 view model.",
    standardBasis: "arc42 / ISO/IEC/IEEE 42010 / 4+1 View Model",
    sections: [
      { title: "1. Introduction & Goals", hint: "Purpose, target audience, quality goals (top 3-5), stakeholder concerns" },
      { title: "2. Architecture Constraints", hint: "Technical, organizational, regulatory, conventions" },
      { title: "3. System Scope & Context", hint: "Business context, technical context, external interfaces" },
      { title: "4. Solution Strategy", hint: "Architectural pattern choices, technology decisions, key quality decisions" },
      { title: "5. Building Block View (Static Structure)", hint: "Level 1 (whitebox overall system), Level 2 (key containers), Level 3 (selected components)" },
      { title: "6. Runtime View (Dynamic Behavior)", hint: "Important scenarios: startup, critical use cases, error handling — use sequence-style prose" },
      { title: "7. Deployment View", hint: "Infrastructure, environments (dev/stage/prod), containers, network topology" },
      { title: "8. Cross-Cutting Concepts", hint: "Security, persistence, transactions, logging, error handling, i18n, caching" },
      { title: "9. Architectural Decisions (ADRs)", hint: "Key decisions with context, options considered, decision, consequences" },
      { title: "10. Quality Requirements", hint: "Quality tree and measurable quality scenarios (performance, security, modifiability, etc.)" },
      { title: "11. Risks & Technical Debt", hint: "Known technical risks and debt items with severity and mitigation" },
      { title: "12. Glossary", hint: "Architecture/domain terms and definitions" },
    ],
  },
];

export function getDoc(id: DocType): DocMeta {
  const d = DOC_CATALOG.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown document type: ${id}`);
  return d;
}
