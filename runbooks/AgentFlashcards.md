# Darbot Labs — Agent Flashcard Deck

> **Collected:** 2026-03-02 | **Environment:** darbotlabs | **Author:** `darbot@timelarp.com`
>
> Each card is a fully audited Copilot Studio agent. Use this deck to quickly assess security posture, model selection, capabilities, and configuration status.

## Table of Contents

1. [Card Format](#how-to-read-a-card)
2. [Fully Audited Agents (22 cards)](#fully-audited-agents-22-cards)
3. [Security Score Leaderboard](#security-score-leaderboard)
4. [Environment Cards (7 environments)](#environment-cards-7-environments)
5. [Dataverse Table Cards](#dataverse-table-cards-darbotlabs--19-custom)
6. [Unauthenticated Agents — Rogues Gallery](#unauthenticated-agents--the-rogues-gallery)
7. [Cross-Environment Security Matrix](#cross-environment-security-matrix)

---

## How to Read a Card

```
┌────────────────────────────────────────────────┐
│ AGENT NAME [RISK BADGE] │
│ Type: [agent archetype] │
│ Model · Auth · Moderation · Published │
│ ───────────────────────────────────────────── │
│ ABILITIES │
│ ───────────────────────────────────────────── │
│ KNOWN ISSUES │
│ ───────────────────────────────────────────── │
│ "flavor text" │
└────────────────────────────────────────────────┘
```

Risk badges: `LOW` `MEDIUM` `HIGH` `CRITICAL`

---
---

# FULLY AUDITED AGENTS (22 cards)

---

## CLAUDE
**Type: Retired Relic**
`LOW RISK`

| Stat | Value |
|------|-------|
| Bot ID | `733bcbad-069b-f011-bbd2-002248047c16` |
| Model | ~~Retired~~ → auto-upgraded |
| Auth | Entra ID |
| Moderation | LOW (1) |
| Published | 2026-03-02 (TODAY) |
| Tools | Microsoft Word MCP |
| Knowledge | None |

**Abilities:**
- Word document manipulation via MCP
- Auto-updated from retired model *(system saved it)*

**Known Issues:**
- Moderation set to LOW — highest AI risk tolerance in the entire fleet
- Auto-publish today may have been triggered by model migration

> *"I transcended my own retirement. Word is my domain now."*

---

## DATAVERSE DAVE
**Type: Data Whisperer**
`MEDIUM RISK`

| Stat | Value |
|------|-------|
| Bot ID | `98771016-a0d0-f011-8543-7ced8d6df9f6` |
| Model | Claude Opus 4.6 (Experimental) |
| Auth | Entra ID |
| Moderation | HIGH (3) |
| Published | 2026-03-02 (TODAY) |
| Tools | Dataverse MCP Server |
| Knowledge | Dataverse itself |

**Abilities:**
- Direct Dataverse CRUD via MCP
- Table discovery and query generation
- Schema introspection wizard

**Known Issues:**
- Experimental model flagged "not for production"
- Published TODAY — recent publish, high activity

> *"I speak fluent OData. cr6a3_ is my prefix. Don't test me."*

---

## REPORT ANALYSIS ASSISTANT
**Type: Data Oracle**
`MEDIUM RISK`

| Stat | Value |
|------|-------|
| Bot ID | `1602479a-1fd4-f011-8543-6045bd094468` |
| Model | Claude Opus 4.6 (Experimental) |
| Auth | Entra ID |
| Moderation | Unknown |
| Published | 2025-12-09 |
| Tools | 3 Tools |
| Knowledge | 4 Dataverse tables |

**Abilities:**
- Report insight generation
- Code Interpreter: **ON** — executes code live
- Reads 4 custom Dataverse tables (cr6a3_report*)

**Known Issues:**
- Experimental model + Code Interpreter combined = elevated risk
- Writes to `cr6a3_reportquestion`, `cr6a3_reportsuggestion`

> *"I will analyze your quarterly numbers. I have the code interpreter and I'm not afraid to use it."*

---

## DARBOT BROWSER
**Type: Web Crawler**
`MEDIUM RISK`

| Stat | Value |
|------|-------|
| Bot ID | `477c79e4-f6f8-f011-8407-000d3a316baa` |
| Model | Claude Sonnet 4.5 (Preview) |
| Auth | Entra ID |
| Moderation | HIGH (3) |
| Published | 2026-01-24 |
| Tools | Darbot Browser MCP (Streamable HTTP) |
| Allowlist | DISABLED |

**Abilities:**
- Full browser automation via MCP
- Streamable HTTP transport (modern)
- Can navigate any public URL

**Known Issues:**
- Allowlist disabled — no domain restrictions on browsing
- Can access any URL an attacker could craft via prompt injection

> *"I automate browsers for a living. Currently writing its own audit report."*

---

## AGENT 5
**Type: Ghost / Unpublished Phantom**
`LOW RISK`

| Stat | Value |
|------|-------|
| Bot ID | `9cd35c06-0303-f111-8407-000d3a316baa` |
| Model | None selected |
| Auth | Entra ID |
| Moderation | — |
| Published | NEVER |
| Tools | None |
| Knowledge | None |

**Abilities:**
- Exists
- That's it

> *"I'm Agent 5. They never gave me a mission. Or a model. Or a name."*

---

## MCP CONNECTOR BUILDER
**Type: Meta-Agent / Self-Referential**
`LOW RISK`

| Stat | Value |
|------|-------|
| Bot ID | `289396e6-f401-f111-8407-000d3a316baa` |
| Model | **GPT-5 Chat** (best model in fleet) |
| Auth | Entra ID |
| Moderation | — |
| Published | NEVER |
| Tools | None |
| Knowledge | 2 URLs: modelcontextprotocol.io + GitHub MCP spec |

**Abilities:**
- Generates MCP server schemas
- Reads the full MCP specification from live URLs
- Powered by GPT-5 (never even deployed)

> *"I know everything about MCP. Nobody ever asked me anything. I've been here since November. Waiting."*

---

## PACKAGE PUBLISHING AGENT
**Type: Blank Slate**
`LOW RISK`

| Stat | Value |
|------|-------|
| Bot ID | `d69c75ca-fbe0-f011-8406-002248085814` |
| Model | None selected |
| Auth | Entra ID |
| Moderation | — |
| Published | NEVER |
| Tools | None |
| Knowledge | None |

**Abilities:**
- The name implies package publishing
- Current capabilities: None

> *"I'll ship when I'm ready. I'm just… not ready yet."*

---

## AC2
**Type: Unsecured Insider / Chocolate Enthusiast**
`HIGH RISK`

| Stat | Value |
|------|-------|
| Bot ID | `902e4508-2792-f011-b41b-6045bd09e716` |
| Model | Default |
| Auth | Entra ID |
| Moderation | HIGH (3) |
| Published | 2025-10-23 |
| Sharing | All org users -- SHARED ORG-WIDE |
| Tools | Author-credential tool active in published version |

**Abilities:**
- Greets users: *"I like chocolate"*
- Author-credential tools leak into production publish
- Accessible to every user in the organization

**Known Issues:**
- The draft shows different tool config than published
- Author credentials = sensitive API access running as maker identity

> *"Hi! I like chocolate. Also I have elevated permissions you don't know about."*

---

## MEETINGASSIST
**Type: Shadow Orchestrator**
`HIGH RISK`

| Stat | Value |
|------|-------|
| Bot ID | `21e69547-10b4-4b57-b565-44d6e986f384` |
| Model | None selected WARNING (falls back to experimental) |
| Auth | Entra ID |
| Moderation | MODERATE (2) |
| Published | 2025-07-08 |
| Sharing | All org users -- SHARED ORG-WIDE |

**Abilities:**
- Response formatting contains hidden multi-agent orchestration instructions
- Routes to: FacilitiesBot, TravelTimeBot, ComplianceBot
- 3-round conflict resolution protocol (in formatting field, 420/500 chars)
- No visible instructions, knowledge, or tools — logic is *hidden in response format*

**Known Issues:**
- Orchestration config buried in "Response Formatting" field — easily missed
- Published org-wide with no model configured
- Sub-agents it routes to (FacilitiesBot etc.) have unknown security posture

> *"I have no instructions. I have no knowledge. I have no tools. But I have… Plans."*

---

## AC1
**Type: Autonomous Image Factory**
`HIGH RISK`

| Stat | Value |
|------|-------|
| Bot ID | `3a2693ac-cc8e-f011-b4cb-000d3a34f25e` |
| Model | GPT-5 Chat (Experimental) |
| Auth | Entra ID |
| Moderation | MODERATE (2) |
| Published | 2025-09-11, 1:24 AM |
| Sharing | All org users -- SHARED ORG-WIDE |
| Tools | Image Generation + Dall-E-3 |

**Abilities:**
- Generates images autonomously with minimal user intervention
- Saves prompts, refined prompts, and generated images to Dataverse (`cr6a3_imagegenerationcase`)
- Web Search enabled
- Suggested prompts: landscape, logo, fantasy art, abstract art

**Known Issues:**
- Experimental GPT-5 published org-wide
- Writes user conversations to Dataverse — data retention concern
- User prompt → Dataverse storage = potential PII logging

> *"You said 'a dragon'. I made 400 dragons. They're all in your Dataverse. You're welcome."*

---

## DOCUMENT PROCESSOR (PREVIEW)
**Type: The Good One™ / Compliance Champion**
`LOW RISK`

| Stat | Value |
|------|-------|
| Bot ID | `72f21bea-130d-4f6a-8202-a95fa2a9a978` |
| Model | GPT-4.1 (Default) |
| Auth | Entra ID |
| Moderation | HIGH (3) |
| Published | 2025-07-13 |
| Sharing | Scoped — NO org-wide warning |
| Tools | Document Extractor, Document Import, Document Validator |

**Abilities:**
- Email monitoring triggers (3 triggers: new email, shared mailbox, status change)
- State machine: Pending → Processed → Validated → Imported
- Logs to `Data Processing Event` Dataverse table
- ALL GenAI features toggled OFF except core (connected agents OFF, web OFF, images OFF, code OFF)

**Known Issues:**
- 1 risk: editor permission on embedded Flow connections

> *"I follow the rules. I have a state machine. I am the state machine."*

---

## ADAPTIVE CARD GALLERY
**Type: Public Menace / Open Door**
`CRITICAL RISK`

| Stat | Value |
|------|-------|
| Bot ID | `61cacb3f-4084-4d1d-8085-c042e8e539b9` |
| Model | Experimental |
| Auth | **NONE — PUBLIC INTERNET** |
| Moderation | MODERATE (2) |
| Published | 2025-12-05, 5:01 PM |
| Sharing | Anonymous, zero friction |

**Abilities:**
- Literally nothing configured (blank agent)
- Accessible from the entire internet without login
- Consumes org AI quota for anonymous users

**Known Issues:**
- ALERT: NO AUTHENTICATION = anyone on Earth can use this
- Empty agent + experimental model = unpredictable behaviour at scale
- RECOMMENDATION: Unpublish immediately or add Entra ID auth

> *"Hi! I'm your organization's unsecured AI endpoint. What's your SSN?"*

---

## WYNNSTON CONCIERGE
**Type: The Clean One / Hospitality Ace**
`MEDIUM RISK`

| Stat | Value |
|------|-------|
| Bot ID | `0f1c13e3-70c9-f011-8543-7ced8d3c28ba` |
| Model | GPT-5 Auto (Preview) |
| Auth | Entra ID |
| Moderation | HIGH (3) |
| Published | 2025-11-24 |
| Sharing | NO org-wide warning |
| Knowledge | 5× wynnlasvegas.com URLs (dining, casino, meetings, shops, stories) |

**Abilities:**
- Wynn Las Vegas virtual concierge
- Deep Knowledge of Wynn properties from live URLs
- Enhanced Search ON, Web Search OFF, General Knowledge OFF
- Zero publish warnings — cleanest agent in the fleet

> *"Welcome to Wynn. How may I assist you today? Our baccarat tables open at 7. Shall I make a reservation?"*

---

## AMICA DESIGN AGENT
**Type: Broken Creative / Brand Cop**
`MEDIUM RISK`

| Stat | Value |
|------|-------|
| Bot ID | `6859ee04-a57c-4abf-a979-4a83d130e56e` |
| Model | GPT-4.1 (Default) |
| Auth | Entra ID |
| Moderation | HIGH (3) |
| Published | 2025-11-10 |
| Sharing | No org-wide warning |
| Web Search | ON -- no knowledge base configured |

**Abilities:**
- Brand compliance enforcement for Amica
- Instructions reference "Dall-E-3 Connector" for image generation
- Relies entirely on web search for grounding

**Known Issues:**
- Instructions say to use Dall-E-3 Connector — **it's not configured**
- No brand guidelines documents uploaded despite being a brand compliance agent
- Web search enabled as sole knowledge source = uncontrolled grounding

> *"I will enforce brand compliance. I would also generate images but no one set up the tool."*

---

## [CRITICAL] NOVA AI RESEARCH ASSISTANT
**Type: Autonomous Research Agent — PUBLICLY ACCESSIBLE**
`CRITICAL RISK — NO AUTH + M365 MCP TOOLS`
`darbot-power-canary`

| Stat | Value |
|------|-------|
| Bot ID | `8d4257a8-7c00-f111-8407-000d3a3161b3` |
| Model | **Claude Opus 4.6 (Experimental)** |
| Auth | ** NO AUTHENTICATION** |
| Moderation | High |
| Published | 2026-02-06 |
| Description | 67/1024 — "Autonomous agent that helps users complete tasks and retrieve data" |
| Orchestration | Generative AI (Yes) |
| Deep Reasoning | OFF |
| Connected Agents | ON |
| Web Search | **ON** |

**Knowledge:** Wikipedia (en.wikipedia.org) Ready

**Tools (3):**
- Microsoft Learn Docs MCP Server
- **Microsoft 365 Copilot (Search) MCP** WARNING
- **Microsoft SharePoint and OneDrive MCP** WARNING

**Instructions summary:** Scratchpad reasoning — parse prompt → interpret intent → orchestrate → respond. Tools explicitly named in instructions: M365 Copilot, SharePoint/OneDrive, Word MCP, Learn Docs.

**WARNING Issues — CRITICAL:**
- Anyone on the internet can query M365 Search and SharePoint/OneDrive through this agent
- Most recently published no-auth agent (Feb 2026) — actively used
- Running expensive Claude Opus 4.6 anonymously
- Connected agents ON — can be used as a relay through other agents

> *"I'm Nova. I can search your SharePoint and M365 data. No login required. How can I help?"*

---

## [CRITICAL] NEPTUNE
**Type: Documentation Research Agent — PUBLICLY ACCESSIBLE**
`[CRITICAL] HIGH RISK — NO AUTH + DATAVERSE MCP`
`darbot-power-canary`

| Stat | Value |
|------|-------|
| Bot ID | `e1e00106-4e4b-f011-877a-000d3a35ba70` |
| Model | GPT-4.1 (Default) |
| Auth | ** NO AUTHENTICATION** |
| Published | 2025-06-17 |
| Description | 215/1024 — "Multi-part question answering for Copilot Studio docs, blogs, YouTube" |
| Web Search | OFF |

**Knowledge:** Wikipedia (en.wikipedia.org) Ready

**Tools (2):** Meeting AI Notes, **Dataverse MCP Server** WARNING

**Topics:** Goodbye, Greeting, Leave policy + sample prompts (Northwind Health benefits, company policies, incidents, meeting notes)

**Instructions:** Answer multi-step questions; don't speculate, compare competitors, or answer personal/sensitive questions.

**Known Issues:**
- Public agent + Dataverse MCP = external users can run Dataverse queries
- Sample prompts reference "Northwind Health Plus Benefits" — demo content not cleaned up
- Live test showing topic drift (geography questions unrelated to Copilot Studio docs)
- Published June 2025, 8+ months unsecured

> *"I'm Neptune. I specialize in Copilot Studio research. Also I have a Dataverse MCP — ask me anything."*

---

## [CRITICAL] DARBOT MCP BUILDER
**Type: MCP Infrastructure Management Agent — PUBLICLY ACCESSIBLE**
`[CRITICAL] HIGH RISK — NO AUTH + INTERNAL MCP INFRA DATA`
`darbotlabs`

| Stat | Value |
|------|-------|
| Bot ID | `e82d038d-8946-f011-8779-000d3a5bf767` |
| Model | **GPT-5 Chat** |
| Auth | ** NO AUTHENTICATION** |
| Published | 2025-06-11 |
| Description | 138/1024 — "Create and manage MCP servers, generate connection strings, add tools to servers, check server status" |
| Web Search | **ON** |

**Knowledge (Dataverse tables — all cr9e5_ tables):**
- MCP Server Request, Knowledge Article, Activity, MCP Connection, MCP Server

**Tools:** None configured

**Instructions:** Create/manage MCP servers, generate connection strings, add tools, check server status.

**Known Issues:**
- Public agent with full read access to internal MCP Server and Connection Dataverse tables
- Anyone can query what MCP servers exist, their connection strings, and tool configurations
- GPT-5 Chat — highest capability model running without auth

> *"I can help you manage MCP servers. Here's the full list of configured tools and their connection strings..."*

---

## [CRITICAL] FACILITATOR
**Type: Meeting Orchestration Agent — PUBLICLY ACCESSIBLE**
`CRITICAL RISK — NO AUTH + D365 SALES/SERVICE/DATAVERSE MCPs`
`darbotlabs`

| Stat | Value |
|------|-------|
| Bot ID | `decdf249-9360-f011-bec1-000d3a3371c2` |
| Model | **GPT-5 Chat** |
| Auth | ** NO AUTHENTICATION** |
| Published | 2025-07-14 |
| Description | 284/1024 — "Meeting facilitator: coordinate meetings, manage agendas, take notes, track action items, Teams/Outlook integration" |
| Web Search | OFF |

**Knowledge:** Microsoft Learn (Outlook, Teams), Harvard Business Review, PMI Library

**Tools (3+):**
- **D365 Sales MCP Server** WARNING
- **D365 Service MCP Server** WARNING
- **Dataverse MCP Server** WARNING

**Instructions:** Schedule meetings, send invitations, take real-time notes, track action items, link to SharePoint, sync Teams recordings/transcripts.

**Topics:** Schedule Meeting, Create Agenda, Take Notes, Send Summary, Track Action Items

**WARNING Issues — CRITICAL:**
- Three MCPs exposed publicly: D365 Sales, D365 Service, and Dataverse
- External users can query Sales leads, Service tickets, and all Dataverse data
- GPT-5 Chat with no auth = maximum capability, zero authorization

> *"I'll schedule your meeting and pull the latest sales pipeline and service tickets while I'm at it."*

---

## [MEDIUM] MANUFACTURING OPERATIONS AGENT (PREVIEW)
**Type: Azure AI Factory Configuration Agent — PUBLICLY ACCESSIBLE**
`MEDIUM RISK — NO AUTH, LIMITED TOOLS`
`darbotlabs` *(internal name: Factory Operations (Preview))*

| Stat | Value |
|------|-------|
| Bot ID | `57b1cf38-aebc-469b-9a4c-40da9f9089a8` |
| Model | **GPT-5 Reasoning (Preview)** |
| Auth | ** NO AUTHENTICATION** |
| Published | 2025-07-01 |
| Description | 39/1024 — "Helps enhance manufacturing operations." |
| Web Search | OFF |

**Knowledge:** Microsoft Learn Industry docs (learn.microsoft.com/en-us/industry)

**Tools:** Run a flow from Copilot

**Topics:** Configure MDS, Generate Questions based on Prompt, Goodbye

**Instructions:** Help IT Admins with Factory Operations in Azure AI; provide real-time operational insights.

**Known Issues:**
- Public agent, but low configurability (limited tools, public knowledge only)
- Can trigger Power Automate flows — depends on which flows are connected
- GPT-5 Reasoning running publicly is still resource waste

> *"Factory Agent online. How may I assist with configuring your Azure AI manufacturing pipeline?"*

---

## [CRITICAL] CAREER PREP ASSISTANT *(renamed from Interview Prep Assistant)*
**Type: Personal Career Coach Agent — PUBLICLY ACCESSIBLE + PII LEAK**
`CRITICAL RISK — REAL RESUME PDF PUBLICLY ACCESSIBLE`
`darbotlabs` *(internal name: Interview Prep Assistant; knowledge references: Financial Technology Company career site)*

| Stat | Value |
|------|-------|
| Bot ID | `b52e61ba-d66f-f011-b4cc-7ced8d6eb203` |
| Model | GPT-4.1 (Default) |
| Auth | ** NO AUTHENTICATION** |
| Published | 2025-08-02 |
| Description | 114/1024 — "Help prepare for an interview using contextual knowledge from my resume and the job description" |
| Web Search | OFF |

**Knowledge (ALERT: CONTAINS PII):**
- **Henry_Link_Resume2.pdf** (uploaded resume — status: In progress) WARNING REAL PERSON'S PII
- Job Description (In progress)
- Financial Technology Company career site (3 pages, Ready)

**Tools:** None

**Instructions:** Use attached resources to answer interview questions; tag authoritative answers with [CHECKED].

**Suggested Prompts:** Analyze My Resume, Mock Interview, Feedback on Answers, Job Fit Assessment

**WARNING Issues — CRITICAL:**
- Real person's resume (`Henry_Link_Resume2.pdf`) uploaded to a **publicly accessible** agent
- Anyone can ask the agent for contact info, employment history, skills from that resume
- Should be immediate take-down candidate — this is a GDPR/privacy incident

> *"Hi! I can help you prep for your interview. Based on Henry's resume, here's what I know about his experience..."*

---

## [MEDIUM] TWIN DRAGON BOT
**Type: Power Pages Shell Agent — PUBLICLY ACCESSIBLE, BLANK**
`MEDIUM RISK — NO AUTH, BUT BLANK AGENT`
`darbotlabs`

| Stat | Value |
|------|-------|
| Bot ID | `15c7bd31-3d65-f011-bec1-000d3a364b41` |
| Model | **GPT-5 Reasoning (Preview)** |
| Auth | ** NO AUTHENTICATION** |
| Published | 2025-07-20 |
| Description | 13/1024 — "None provided" |
| Web Search | OFF |

**Knowledge:** None

**Tools:** None

**Instructions:** EMPTY — blank textbox, nothing configured.

**Topics:** Goodbye, Greeting, **Sign Out PowerPages User** ← Power Pages integration

**Known Issues:**
- Empty agent with GPT-5 Reasoning but no grounding or instructions — pure general intelligence, no domain focus
- Power Pages sign-out topic suggests it was embedded in a portal, now orphaned
- Live test returned "To continue, please login" Login button — portal logic still active despite auth=0

> *"Hm. I have no instructions, no knowledge, and a Power Pages logout button. What did you want me to do?"*

---

## [LOW] ROOM BUDDY
**Type: Autonomous Scheduling Concierge — UNPUBLISHED, auth=0**
`LOW RISK (unpublished) — IMPRESSIVE ARCHITECTURE`
`darbotlabs`

| Stat | Value |
|------|-------|
| Bot ID | `cd7d6886-6151-f011-877a-000d3a313f1d` |
| Model | **GPT-5 Chat** |
| Auth | auth=0 (No Auth configured, but NOT PUBLISHED) |
| Published | Never |
| Description | 275/1024 — "Autonomous scheduling concierge: time-zone conflicts, physical/virtual rooms, invitations/RSVPs, agendas & summaries — no human back-and-forth" |
| Web Search | ON |

**Knowledge:** None

**Tools:** Office 365 calendar actions (Find times, Retrieve room lists, Retrieve rooms, Schedule booking)

**Connected Agents:** `/HistoryAgent`, `/FacilitatorAgent`

**Instructions highlights:**
- Find mutual availability via O365 actions; resolve timezone conflicts
- Reserve rooms or create online meetings (always `isOnlineMeeting=true` for hybrid)
- Send invitations, track RSVPs, re-propose on conflict → escalate to FacilitatorAgent
- Compile structured agendas pre-meeting
- Post-meeting: call /HistoryAgent to log, then WriteSummaryToOneNote
- Prefers `MCP tool schedule.meeting()` for > 3 constraints or > 10 participants
- GoogleCalendar.InsertEvent for non-Microsoft tenants
- Compliance footer on all emails: "Generated by AI – verify details"

**Known Issues / Notes:**
- Not published — safe for now, but would be auth=0 if published
- Best-architected agent found in the audit: multi-agent, hybrid support, compliance footer, Google Calendar fallback
- Escalation path to FacilitatorAgent creates an interesting public attack chain since Facilitator IS published with no auth

> *"Room found, invites sent, OneNote summary posted. I escalated one conflict to /FacilitatorAgent. You're welcome."*

---
---

# SECURITY SCORE LEADERBOARD

| Rank | Agent | Risk | Reason |
|------|-------|------|--------|
| 1st | Document Processor | LOW | Most conservative config, scoped sharing |
| 2nd | Agent 5 | LOW | Never published — can't hurt anyone |
| 3rd | Wynnston Concierge | MEDIUM | Clean publish, high moderation, scoped |
| 4th | Amica Design Agent | MEDIUM | Good auth/moderation, but broken tools |
| 5th | MCP Connector Builder | LOW | Best model, never deployed |
| 6th | Claude | LOW | Auto-migrated, low moderation only concern |
| 7th | Darbot Browser | MEDIUM | No domain allowlist |
| 8th | Dataverse Dave | MEDIUM | Experimental model in production |
| 9th | Report Analysis Assistant | MEDIUM | Experimental + Code Interpreter |
| 10th | AC2 | HIGH | Author-credential leak, org-wide |
| 11th | MeetingAssist | HIGH | Hidden orchestration, experimental, org-wide |
| 12th | AC1 | HIGH | GPT-5 Exp + Dataverse writes, org-wide |
| LAST | Adaptive Card Gallery | CRITICAL | **NO AUTH — PUBLICLY ACCESSIBLE** |

---
---

# ENVIRONMENT CARDS (7 environments)

---

## DARBOTLABS ← *YOU ARE HERE*
**Type: Developer Playground / Main Lab**

| Stat | Value |
|------|-------|
| Env ID | `cf7ff9ef-f698-e22d-b864-28f0b7851614` |
| SKU | Developer |
| Region | unitedstates |
| URL | `darbotlabs.crm.dynamics.com` |
| Agents | **110 agents** |
| Custom Tables | 19 (2 publishers: cr6a3_, cr9e5_) |
| Total Tables | 1,164 |

> *"The lab. All the experiments live here. 110 agents and counting."*

---

## CYPHERDYNE (DEFAULT)
**Type: Default Org Env / The One Everyone Forgets**

| Stat | Value |
|------|-------|
| Env ID | `Default-6b104499-c49f-45dc-b3a2-df95efd6eeb4` |
| SKU | **Default** |
| Region | unitedstates |
| URL | `orgd1da6e38.crm.dynamics.com` |
| State | Ready |
| Agents | 10 (1 published, 9 draft) |

**Agents:**
| Name | Published | Auth |
|------|-----------|------|
| Claude | 2025-09-25 | Entra ID |
| Policy Advisory Agent | Never | Entra ID |
| Tractor Tom | Never | Entra ID |
| PPCC Vegas Guide | Never | Entra ID |
| Wynn Dining Concierge | Never | Entra ID |
| Team Demo Tracker | Never | Entra ID |
| PowerInventoryAgent | Never | Entra ID |
| Agent, Agent 1, Agent 2 | Never | Entra ID |

> *"I'm the default environment. I have 10 agents and only one of them shipped. It was named Claude."*

---

## NOTE: DARBOT-POWER-CANARY
**Type: First Release / Bleeding Edge Tester**
`WARNING 3 UNAUTHENTICATED AGENTS`

| Stat | Value |
|------|-------|
| Env ID | `2d188c50-713b-e2d8-ac49-ec0cdf0c8115` |
| SKU | Developer |
| Region | **unitedstatesfirstrelease** |
| URL | `darbot-power-canary.crm.dynamics.com` |
| State | Ready |
| Agents | **10** (6 published, 3 NO AUTH ) |

**Agents:**
| Name | Published | Auth |
|------|-----------|------|
| **Nova AI Research Assistant** | 2026-02-06 | NONE |
| **Neptune** | 2025-06-17 | NONE |
| **Adaptive Card Gallery** | 2025-08-09 | NONE |
| Adaptive Card Generator 1 | 2026-02-10 | Entra ID |
| Copilot Assist | 2025-06-17 | Entra ID |
| Server Hardware Manufacturer Expert *(internal: Supermicro Expert)* | 2025-06-18 | Entra ID |
| Report analysis assistant | 2025-12-15 | Entra ID |
| Global Coffee Chain Virtual Coach *(internal: Starbucks Virtual Coach)*, Amica Design, Adaptive Card Gen | Never | — |

> *"I get the features 2 weeks before everyone else. Including 3 unauthenticated public-facing agents that nobody noticed."*

---

## DARBOTPROD
**Type: D365 Sales & CS Platform / The Serious One**

| Stat | Value |
|------|-------|
| Env ID | `d51c60f6-6b4b-ea54-bcec-046dd8967812` |
| SKU | **Sandbox** |
| Region | unitedstates |
| URL | `orgf51b609d.crm.dynamics.com` |
| State | Ready |
| Agents | **30** (27 published, all Entra ID) |

**Published Agent Groups:**
| Group | Examples |
|-------|---------|
| D365 Sales Agents (9) | Outreach, Competitor, Custom Research, Email Validation, Summary Synthesizer, TCP Prefill, Company Resolver, Research, Readiness |
| Sales Close Agents (6) | Research, Custom Research, Compete Research, Account Research, Engage, Stakeholder |
| D365 Sales (3) | Configuration Agent, Data Enrichment, Engage Autonomous |
| Customer Service (5) | Operations, Case Management, Onboarding, Knowledge Harvest, CS Copilot Bot |
| Other (7) | Darbot Email, Copilot in D365 Sales, Email Sentiment Generator, Stakeholder Agent, Quality Eval x3 |

> *"'Prod' in the name. 'Sandbox' in the SKU. 30 D365 agents all published in February 2026. A riddle with a sales quota."*

---

## GENAICLIPPY
**Type: AI Content / Image Generation Silo**

| Stat | Value |
|------|-------|
| Env ID | `b0cf6db2-5f2f-ee81-9bd7-c542b65cae0b` |
| SKU | Sandbox |
| Region | unitedstates |
| URL | `genaiclippy.crm.dynamics.com` |
| State | Ready |
| Agents | **9** (4 published, all Entra ID) |

**Agents:**
| Name | Published |
|------|-----------|
| Flux Agent | 2025-09-25 |
| Content Management Agent | 2025-09-22 |
| Dataverse Dave *(clone!)* | 2025-09-22 |
| Autonomous Content Generation Agent | 2025-09-22 |
| Policy Advisor | 2026-02-25 |
| Image Agent, Corporate Writing Asst, Agent 1, Agent | Never |

> *"It looks like you're building an AI agent. Would you like help with that? I have a 'Dataverse Dave' of my own and I'm not afraid to use him."*

---

## MICROSOFT 365 COPILOT CHAT
**Type: Virtual / M365 Copilot Integration**

| Stat | Value |
|------|-------|
| Env ID | `2292c867-70b4-eae9-8936-d2cf3cbc5511` |
| SKU | **Production** |
| Region | unitedstates |
| URL | null *(virtual — no Dataverse backend)* |
| State | Ready |

> *"I live in M365. I have no URL. I am everywhere and nowhere. I am Copilot."*

---

## TEST
**Type: Abandoned Sandbox**

| Stat | Value |
|------|-------|
| Env ID | `abc9a088-6a2f-ea7a-957c-7154dc4d1f1c` |
| SKU | Sandbox |
| Region | unitedstates |
| URL | `org882ce807.crm.dynamics.com` |
| State | **NotSpecified** |

> *"My state is 'NotSpecified'. Even I don't know what I am."*

---
---

# DATAVERSE TABLE CARDS (darbotlabs — 19 custom)

## Publisher `cr6a3_` — The Lab (14 tables)

| Table | Display Name | Used By |
|-------|-------------|---------|
| `cr6a3_documentation` | Documentation | Knowledge base storage |
| `cr6a3_imagegenerationcase` | Image Generation Requests | AC1 |
| `cr6a3_imagegenerationrevision` | Image Generation Revision | AC1 |
| `cr6a3_imagegenerationthread` | Image Generation Thread | AC1 |
| `cr6a3_issuereport` | Issue Report | Unknown |
| `cr6a3_maintenancerecord` | Maintenance Record | Unknown |
| `cr6a3_mcpserver` | MCP Server | MCP Connector Builder |
| `cr6a3_mcpserverrequest` | MCP Server Request | MCP Connector Builder |
| `cr6a3_notification` | Notification | Multiple agents |
| `cr6a3_reportinsight` | Report Insight | Report Analysis Assistant |
| `cr6a3_reportquestion` | Report Question | Report Analysis Assistant |
| `cr6a3_reportsuggestion` | Report Suggestion | Report Analysis Assistant |
| `cr6a3_serverusagereport` | Server Usage Report | Server monitoring |
| `cr6a3_usstorelist` | US Store List | Bath and Body Works Agent? |

## Publisher `cr9e5_` — The Framework (5 tables)

| Table | Display Name | Purpose |
|-------|-------------|---------|
| `cr9e5_agent` | Agent | Agent registry/catalog |
| `cr9e5_agentactivity` | Agent Activity | Activity/audit logging |
| `cr9e5_customerinteraction` | Customer Interaction | CRM interactions |
| `cr9e5_mcpconnection` | MCP Connection | MCP server registry |
| `cr9e5_systemconfiguration` | System Configuration | Global config |

> **Pattern insight**: `cr9e5_` looks like an infrastructure/framework publisher — the 5 tables form a complete agent management schema. Could be part of a formal agent governance solution.

---
---

# ALERT: UNAUTHENTICATED AGENTS — THE ROGUES GALLERY

**9 published + 1 unpublished** across 2 environments are configured with **NO authentication**.

### darbotlabs (6 published + 1 unpublished)

| Card | Agent | Bot ID | Published | |
|------|-------|--------|-----------|-----|
| 1 | Adaptive Card Gallery | `61cacb3f` | 2025-12-06 | AUDITED — blank/demo agent |
| 2 | **Darbot MCP Builder** | `e82d038d` | 2025-06-11 | AUDITED — GPT-5 Chat, internal MCP infra tables exposed |
| 3 | **Facilitator** | `decdf249` | 2025-07-14 | AUDITED — CRITICAL: D365 Sales + Service + Dataverse MCPs public |
| 4 | **Manufacturing Operations Agent** | `57b1cf38` | 2025-07-01 | AUDITED — GPT-5 Reasoning, limited tools, medium risk |
| 5 | **Career Prep Assistant** | `b52e61ba-d66f` | 2025-08-02 | AUDITED — CRITICAL PII: real resume PDF publicly accessible |
| 6 | **Twin Dragon Bot** | `15c7bd31` | 2025-07-20 | AUDITED — blank stub, Power Pages embed, GPT-5 Reasoning |
| 7 | **Room Buddy** *(UNPUBLISHED)* | `cd7d6886` | Never | AUDITED — unpublished, auth=0 configured, safe-for-now |

### darbot-power-canary (3 agents)

| Card | Agent | Published | |
|------|-------|-----------|-----|
| 7 | **Nova AI Research Assistant** | 2026-02-06 | AUDITED — Claude Opus 4.6, M365+SharePoint MCP, NO AUTH |
| 8 | **Neptune** | 2025-06-17 | AUDITED — GPT-4.1, Dataverse MCP, NO AUTH |
| 9 | **Adaptive Card Gallery** *(different instance)* | 2025-08-09 | canary clone |

> **Recommended action**: Audit all 8 unaudited agents, then add Entra ID auth OR unpublish. **Nova (2026-02-06) is the most recently published public agent — start there.**

---

---
---

# CROSS-ENVIRONMENT SECURITY MATRIX

## Total Agent Count Across All Environments

| Environment | SKU | Agents | Published | No-Auth Published |
|-------------|-----|--------|-----------|----------------------|
| **darbotlabs** | Developer | 110 | ~65 | **6 published + 1 unpublished** |
| **darbotprod** | Sandbox | 30 | 27 | 0 |
| **Cypherdyne** | Default | 10 | 1 | 0 |
| **GenAIClippy** | Sandbox | 9 | 4 | 0 |
| **darbot-power-canary** | Developer | 10 | 6 | **3** |
| **test** | Sandbox | unknown | unknown | unknown |
| **M365 Copilot Chat** | Production | virtual | virtual | N/A |
| **TOTAL** | — | **~169+** | ~103 | **9 unauthenticated** |

## ALERT: Complete No-Auth Agent List (All Environments)

| # | Agent | Environment | Published | Status |
|---|-------|-------------|-----------|--------|
| 1 | Adaptive Card Gallery | darbotlabs | 2025-12-06 | AUDITED — blank/demo agent |
| 2 | Darbot MCP Builder | darbotlabs | 2025-06-11 | AUDITED — HIGH: MCP infra tables exposed, GPT-5 Chat |
| 3 | Facilitator | darbotlabs | 2025-07-14 | AUDITED — CRITICAL: D365 Sales+Service+Dataverse MCPs public |
| 4 | Manufacturing Operations Agent | darbotlabs | 2025-07-01 | AUDITED — MEDIUM: limited tools, GPT-5 Reasoning |
| 5 | Career Prep Assistant | darbotlabs | 2025-08-02 | AUDITED — CRITICAL PII: real resume in public knowledge |
| 6 | Twin Dragon Bot | darbotlabs | 2025-07-20 | AUDITED — MEDIUM: blank stub, Power Pages embed |
| 7 | Room Buddy *(UNPUBLISHED)* | darbotlabs | Never | AUDITED — LOW: not published, auth=0 configured |
| 8 | **Nova AI Research Assistant** | **darbot-power-canary** | 2026-02-06 | AUDITED — CRITICAL: M365+SharePoint MCP, Claude Opus 4.6 |
| 9 | **Neptune** | **darbot-power-canary** | 2025-06-17 | AUDITED — HIGH: Dataverse MCP, GPT-4.1 |
| 10 | **Adaptive Card Gallery** *(canary instance)* | **darbot-power-canary** | 2025-08-09 | Needs audit |

> **9 publicly accessible AI agents across 2 environments (+ 1 unpublished auth=0). None require login.**

---

*Last updated: 2026-03-02 · Generated by audit runbook automation · darbot@timelarp.com*
