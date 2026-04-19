// Shared constants used by both client and server. Keep this free of Node APIs
// so it can be imported from Client Components.

import { DOC_CATALOG, DocType } from "./templates/catalog";
import { INDUSTRIES, IndustryId } from "./templates/industries";
import { PROVIDERS, ProviderId, modelSupportsVision } from "./llm/providers";

export { DOC_CATALOG, INDUSTRIES, PROVIDERS, modelSupportsVision };
export type { DocType, IndustryId, ProviderId };

export const SAMPLE_TRANSCRIPT = `Kickoff call — Dynamix Solutions + Acme Medical Supplies — HubSpot CRM implementation

Attendees: Bijitha (Dynamix Solutions, Co-Founder), Priya (Dynamix Solutions, Project Manager), James Patel (Acme Medical Supplies, VP of Sales), Dr. Lin (Acme, Director of Clinical Operations).

Bijitha: Thanks everyone for joining. As discussed over email, the goal of this engagement is to implement HubSpot CRM for Acme Medical Supplies, with a focus on sales pipeline visibility and compliant handling of customer records that may include PHI.

James: Right — our reps today track opportunities in spreadsheets. We need a real pipeline with stages: Prospect, Qualified, Demo Scheduled, Proposal Sent, Negotiation, Closed-Won, Closed-Lost. Reports to leadership weekly. Forecast accuracy is a big issue.

Dr. Lin: And we have to be careful — some of our customer records reference clinical use cases. Any patient-identifying info has to be handled under HIPAA. We have a BAA template we can share.

Priya: Understood. We'll scope HubSpot's sales hub professional edition, configure the pipeline, and add role-based access to keep Clinical records isolated from Sales reps who don't need to see them. We'll also set up deal properties, activity tracking, and an email template library.

James: We'd like Gmail integration for our reps and calendar sync for the demo scheduling. Also Outlook support for a few execs.

Priya: We can do both. Typical timeline: requirement gathering 3 days, configuration and development with demos over 16 business days, internal testing 1 day, go-live support 2 days. Total 22 business days tentative.

Bijitha: On pricing — standard rate: 1 developer full-time and 1 project manager part-time. That's 176 hours dev plus 44 hours PM. Total 220 hours at our blended rate of USD 16 per hour = USD 3520 plus tax. Payment 50% upfront on signing, 50% on go-live.

James: Let's go with that. We want a demo after each module: Pipeline, Contacts, Deals, Email templates, Reporting. We'll use Jira to track issues during UAT.

Dr. Lin: From a compliance perspective, we need an audit trail of who accessed which contact records. And 2FA for all users.

Priya: HubSpot supports both natively; we'll enable and document.

Bijitha: Success looks like: reps using HubSpot for 100% of opportunities within 30 days of go-live, weekly pipeline report automated to James, zero HIPAA audit findings in first quarter, and forecast within 10% of actuals.

James: Perfect. Let's target kickoff April 22 with go-live by the end of May.

Action items:
- Dynamix to send Executable Service Contract and kickoff deck by April 19
- Acme to share BAA template and list of users for provisioning
- Weekly status call Fridays 10am EST
- Escalation: James for business, Bijitha for delivery
`;
