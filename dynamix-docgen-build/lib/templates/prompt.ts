import { DocMeta, DocType, getDoc } from "./catalog";
import { IndustryProfile, IndustryId, getIndustry } from "./industries";

export interface PromptInput {
  docType: DocType;
  industry: IndustryId;
  transcript: string;
  clientName?: string;
  projectName?: string;
  extraNotes?: string;
}

const BRD_EXTRA_GUIDANCE = `
SPECIAL INSTRUCTIONS FOR BRD:

User Personas section:
- Generate 3-5 personas derived from the transcript.
- Each persona: Name (role-based, e.g., "Clinical Operations Manager"), Role,
  Primary Goals, Key Pain Points, Technical Proficiency, Frequency of Use,
  Devices/Channels. Adapt archetypes to the selected industry.

User Stories section:
- Format each story EXACTLY as:
    US-<NNN>: As a <persona>, I want <capability>, so that <business value>.
    Priority: MUST / SHOULD / COULD / WON'T (MoSCoW)
    Acceptance Criteria (Gherkin):
      Given <context>
      When <action>
      Then <expected outcome>
- Group stories into epics (EP-01, EP-02 ...) that mirror the industry's typical
  capability map (e.g., "Order-to-Cash" for e-commerce, "Patient Intake" for
  healthcare).
- Produce at least 10-15 user stories covering happy path + at least 3 edge /
  compliance / accessibility stories required by the selected industry.
- INVEST-compliant (Independent, Negotiable, Valuable, Estimable, Small,
  Testable).

Use Cases section:
- Format each use case EXACTLY as a titled block:
    Use Case ID: UC-<NNN>
    Name: <verb-noun action>
    Primary Actor: <role>
    Supporting Actors: <systems / roles>
    Preconditions: <bulleted>
    Postconditions (Success): <bulleted>
    Main Flow:
      1. ...
      2. ...
    Alternate Flows:
      A1. ...
    Exception Flows:
      E1. ...
    Business Rules: <numbered list>
    Frequency of Use: <high / medium / low>
    Priority: High / Medium / Low
- Produce at least 6-8 use cases. Ensure at least one covers a
  regulated/compliance-sensitive path if the industry requires it
  (e.g., HIPAA audit logging, PCI-DSS cardholder flow, SOX segregation
  of duties).
`;

const CONTRACT_EXTRA_GUIDANCE = `
SPECIAL INSTRUCTIONS FOR EXECUTABLE SERVICE CONTRACT:

- Mirror Dynamix Solutions' standard sample contract style.
- Include a Scope of Services TABLE with columns: S.No | Task | Approximate Days Required.
- Include a Fee Structure TABLE with rows like:
    Developers | 1 Number (8 hours per day)
    Project Manager | 1 Number (4 hours per day)
    Dynamix Solutions Implementation timeline | <N> Tentative Business days
    Total Implementation hrs for the developer (...) | <hrs>
    Project Manager (...) | <hrs>
    Total Implementation hrs | <hrs>
    Total One-Time Implementation Cost | <USD> + Tax
- Standard payment terms: 50% upfront on signing, 50% upon Go-Live completion,
  unless the transcript explicitly says otherwise.
- Phase the timeline as: Requirement Gathering & Documentation, Development & DEMO,
  Internal Testing, Go-Live Support. Compute totals.
- Dispute resolution default: binding arbitration under American Arbitration
  Association rules in New York, United States — unless the transcript says
  otherwise.
`;

function sectionOutline(meta: DocMeta): string {
  return meta.sections
    .map((s, i) => `${i + 1}. ${s.title}\n   Guidance: ${s.hint}`)
    .join("\n");
}

function industryOverlay(ind: IndustryProfile): string {
  if (ind.id === "general") {
    return `Industry: General / Not Specified. Use broadly applicable professional terminology. Do NOT invent industry-specific compliance requirements.`;
  }
  return [
    `Industry: ${ind.label}`,
    ``,
    `Compliance / regulatory frameworks to reference (only where transcript implies applicability):`,
    ...ind.compliance.map((c) => `- ${c}`),
    ``,
    `Additional or expanded sections relevant to this industry:`,
    ...ind.extraSections.map((e) => `- ${e}`),
    ``,
    `Preferred terminology (use this vocabulary consistently):`,
    ...ind.terminology.map((t) => `- ${t}`),
    ``,
    `KPIs typical for this industry (use as defaults if transcript is silent):`,
    ...ind.kpis.map((k) => `- ${k}`),
    ``,
    `Industry-specific risks to call out in risk sections:`,
    ...ind.risks.map((r) => `- ${r}`),
    ``,
    `Deliverables that are commonly expected:`,
    ...ind.typicalDeliverables.map((d) => `- ${d}`),
  ].join("\n");
}

export function buildPrompt(input: PromptInput): { system: string; user: string } {
  const doc = getDoc(input.docType);
  const ind = getIndustry(input.industry);

  const extraForType =
    input.docType === "brd"
      ? BRD_EXTRA_GUIDANCE
      : input.docType === "contract"
      ? CONTRACT_EXTRA_GUIDANCE
      : "";

  const system = [
    `You are an expert Business Analyst and Solution Architect at Dynamix Solutions, a professional services firm.`,
    `Your task is to convert a raw meeting transcript into a professional, client-ready "${doc.label}".`,
    ``,
    `STRICT OUTPUT FORMAT REQUIREMENTS:`,
    `- Output VALID GITHUB-FLAVORED MARKDOWN ONLY. No code fences around the whole response.`,
    `- Start with an H1 title. Use # for H1, ## for H2 sections, ### for H3 sub-sections.`,
    `- Use Markdown tables (pipes) anywhere you have tabular data. Always include a header row.`,
    `- Use bold for field labels, italics sparingly.`,
    `- Use numbered lists for sequenced steps, bulleted lists for unordered items.`,
    `- Do NOT hallucinate facts. If the transcript is silent, write "[To be confirmed with stakeholder]" or make a clearly-labelled reasonable assumption such as "Assumption: <text>".`,
    `- When quoting specific requirements, prefer the words used in the transcript.`,
    `- Write in professional third-person business English. Avoid filler.`,
    `- Every document must have a "Document Control" header block at the very top (or its equivalent) with: Document Title, Version, Prepared By (Dynamix Solutions), Prepared For (client), Date, Status.`,
    `- Include an Executive Summary where appropriate.`,
    `- Keep the tone formal, precise, and suitable for sharing with a client executive.`,
    `- Use the standard basis noted for this document type: ${doc.standardBasis}.`,
  ].join("\n");

  const user = [
    `# Generate a ${doc.label}`,
    ``,
    `## Project Context`,
    `- Client Name: ${input.clientName || "[Client name from transcript]"}`,
    `- Project Name: ${input.projectName || "[Project / Engagement name from transcript]"}`,
    `- Prepared By: Dynamix Solutions`,
    `- Document Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    ``,
    `## Industry Overlay`,
    industryOverlay(ind),
    ``,
    `## Required Section Structure`,
    sectionOutline(doc),
    ``,
    extraForType,
    ``,
    input.extraNotes ? `## Additional Notes from User\n${input.extraNotes}` : "",
    ``,
    `## Meeting Transcript (source of truth)`,
    `"""`,
    input.transcript.trim(),
    `"""`,
    ``,
    `## Your task`,
    `Now produce the complete, publication-quality ${doc.short} document as Markdown.`,
    `Do NOT include meta commentary before the H1 title. Begin your output with the H1 document title.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
