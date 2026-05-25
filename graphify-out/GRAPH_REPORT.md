# Graph Report - .  (2026-05-23)

## Corpus Check
- Corpus is ~18,171 words - fits in a single context window. You may not need a graph.

## Summary
- 366 nodes · 517 edges · 40 communities (21 shown, 19 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Route Handlers|API Route Handlers]]
- [[_COMMUNITY_Property & Lead Display|Property & Lead Display]]
- [[_COMMUNITY_Auth & Database Core|Auth & Database Core]]
- [[_COMMUNITY_Admin Pages|Admin Pages]]
- [[_COMMUNITY_App Shell & Realtime|App Shell & Realtime]]
- [[_COMMUNITY_API Routes & Agent Views|API Routes & Agent Views]]
- [[_COMMUNITY_Lead Management UI|Lead Management UI]]
- [[_COMMUNITY_Activity Data Layer|Activity Data Layer]]
- [[_COMMUNITY_Auth Flows & Layouts|Auth Flows & Layouts]]
- [[_COMMUNITY_Lead Detail Views|Lead Detail Views]]
- [[_COMMUNITY_Lead Scoring & Schema|Lead Scoring & Schema]]
- [[_COMMUNITY_Dashboard Analytics|Dashboard Analytics]]
- [[_COMMUNITY_Reminders & Lead Cards|Reminders & Lead Cards]]
- [[_COMMUNITY_App Root Config|App Root Config]]
- [[_COMMUNITY_Analytics Charts|Analytics Charts]]
- [[_COMMUNITY_Agent Dashboard|Agent Dashboard]]
- [[_COMMUNITY_Public Assets|Public Assets]]
- [[_COMMUNITY_Activity Log Page|Activity Log Page]]
- [[_COMMUNITY_Modal Component|Modal Component]]
- [[_COMMUNITY_NextAuth Type Extensions|NextAuth Type Extensions]]
- [[_COMMUNITY_Agents Management|Agents Management]]
- [[_COMMUNITY_Build Configuration|Build Configuration]]
- [[_COMMUNITY_Window Icon Asset|Window Icon Asset]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Activity API|Activity API]]
- [[_COMMUNITY_Auth Provider|Auth Provider]]
- [[_COMMUNITY_Rate Limiting|Rate Limiting]]
- [[_COMMUNITY_Project Docs|Project Docs]]
- [[_COMMUNITY_File Icon Asset|File Icon Asset]]
- [[_COMMUNITY_Next.js Branding|Next.js Branding]]
- [[_COMMUNITY_Vercel Branding|Vercel Branding]]
- [[_COMMUNITY_Next TS Declarations|Next TS Declarations]]
- [[_COMMUNITY_Empty State UI|Empty State UI]]
- [[_COMMUNITY_Page Header|Page Header]]
- [[_COMMUNITY_Page Header Props|Page Header Props]]

## God Nodes (most connected - your core abstractions)
1. `connectDB()` - 27 edges
2. `requireSession()` - 14 edges
3. `requireAdmin()` - 13 edges
4. `Database Connection Lib` - 10 edges
5. `Middleware Lib` - 10 edges
6. `Admin Inventory Page` - 9 edges
7. `NextAuth Options Config` - 9 edges
8. `API Leads Route` - 8 edges
9. `API Leads [id] Route` - 8 edges
10. `PUT()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `ESLint Config` --conceptually_related_to--> `Next.js Config`  [INFERRED]
  eslint.config.mjs → next.config.ts
- `PostCSS Config (TailwindCSS)` --conceptually_related_to--> `Next.js Config`  [INFERRED]
  postcss.config.mjs → next.config.ts
- `Admin Leads Page` --semantically_similar_to--> `Agent Leads Page`  [INFERRED] [semantically similar]
  src/app/admin/leads/page.tsx → src/app/agent/leads/page.tsx
- `AGENTS.md - Next.js Breaking Changes Notice` --conceptually_related_to--> `README - Project Bootstrap Guide`  [INFERRED]
  AGENTS.md → README.md
- `Admin Analytics Page` --semantically_similar_to--> `Admin Dashboard Page`  [INFERRED] [semantically similar]
  src/app/admin/analytics/page.tsx → src/app/admin/dashboard/page.tsx

## Hyperedges (group relationships)
- **Admin Role Guard: Middleware + Layout + Root Page** — middleware, admin_layout, root_page [EXTRACTED 1.00]
- **Analytics Dashboard with Recharts Charts** — admin_dashboard_page, admin_analytics_page, recharts_lib [EXTRACTED 1.00]
- **Agent Lead Management Workflow** — agent_layout, agent_dashboard_page, agent_leads_page [INFERRED 0.95]
- **Admin-Protected API Routes** — api_activity_route, api_agents_route, api_analytics_route [EXTRACTED 1.00]
- **Lead Mutation with Activity Logging and Email Notification** — api_leads_route, api_leads_id_route, models_activity [EXTRACTED 1.00]
- **Authentication Flow Pattern** — auth_login_page, auth_signup_page, components_auth_authprovider [INFERRED 0.85]
- **Authentication and Session Guard Pattern** — auth_authOptions, middleware_requireSession, middleware_requireAdmin, nextauthd_SessionExtension [INFERRED 0.95]
- **Automatic Lead Scoring on Save Pattern** — lead_preSaveHook, scoring_calculateLeadScore, lead_ILead [EXTRACTED 1.00]
- **Realtime Activity Polling and Notification Pattern** — userealtime_useRealtime, realtimenotifications_RealtimeNotifications, userealtime_pollingMechanism [EXTRACTED 1.00]

## Communities (40 total, 19 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.09
Nodes (38): GET(), GET(), GET(), Ctx, DELETE(), GET(), PUT(), GET() (+30 more)

### Community 1 - "Property & Lead Display"
Cohesion: 0.05
Nodes (34): formatPrice(), InterestedLead, LEAD_STATUS_COLOR, Property, PropertyDetailPage(), STATUS_BADGE, STATUS_LABELS, STATUS_SEQUENCE (+26 more)

### Community 2 - "Auth & Database Core"
Cohesion: 0.07
Nodes (34): Credentials Provider, NextAuth Options Config, JWT Session Strategy, connectDB Function, Mongoose Connection Cache, LeadData Interface (email), Nodemailer Transporter, sendLeadAssignmentEmail Function (+26 more)

### Community 3 - "Admin Pages"
Cohesion: 0.12
Nodes (24): Admin Agents Page, Admin Analytics Page, Admin Dashboard Page, Admin Inventory Detail Page, Admin Inventory Page, Admin Lead Detail Page, Admin Leads Page, Admin Reminders Page (+16 more)

### Community 4 - "App Shell & Realtime"
Cohesion: 0.12
Nodes (11): RealtimeActivity, useRealtime(), UseRealtimeOptions, authOptions, handler, ACTIVITY_EMOJI, RealtimeNotifications(), Toast (+3 more)

### Community 5 - "API Routes & Agent Views"
Cohesion: 0.21
Nodes (23): Agent Lead Detail Page, Agent Reminders Page, API Activity Route, API Agents Route, API Analytics Route, API Auth Signup Route, API Inventory [id] Route, API Inventory Route (+15 more)

### Community 6 - "Lead Management UI"
Cohesion: 0.1
Nodes (13): Agent, LeadFormData, LeadModalProps, Property, PROPERTY_TYPE_OPTIONS, SOURCE_OPTIONS, STATUS_OPTIONS, Agent (+5 more)

### Community 7 - "Activity Data Layer"
Cohesion: 0.13
Nodes (16): Activity Model, ActivityType Union, IActivity Interface, Activity Mongoose Schema, Activity Emoji Map, RealtimeNotifications Component, Toast Interface (RealtimeNotifications), ToastContext (+8 more)

### Community 8 - "Auth Flows & Layouts"
Cohesion: 0.22
Nodes (13): Admin Layout, Agent Layout, API NextAuth Handler Route, Auth Login Page, Auth Signup Page, AuthProvider Component, Auth Options (next-auth config), Auth Middleware (Route Guard) (+5 more)

### Community 9 - "Lead Detail Views"
Cohesion: 0.31
Nodes (8): Activity, ACTIVITY_EMOJI, AdminLeadDetail(), Agent, AgentLeadDetail(), formatBudget(), Lead, STATUS_OPTIONS

### Community 10 - "Lead Scoring & Schema"
Cohesion: 0.22
Nodes (8): calculateLeadScore(), ILead, LeadPriority, leadSchema, LeadSource, LeadStatus, PropertyTypePreference, { score, priority }

### Community 11 - "Dashboard Analytics"
Cohesion: 0.22
Nodes (5): AnalyticsData, PRIORITY_COLORS, PROP_STATUS_BADGE, STATUS_COLORS, TYPE_COLORS

### Community 12 - "Reminders & Lead Cards"
Cohesion: 0.32
Nodes (3): Lead, LeadCard(), RemindersData

### Community 14 - "Analytics Charts"
Cohesion: 0.4
Nodes (3): AnalyticsData, PRIORITY_COLORS, STATUS_COLORS

### Community 16 - "Public Assets"
Cohesion: 0.5
Nodes (5): Globe SVG Icon, Globe / World Icon, Internationalization / Language Selector UI, Next.js Public Directory, Public Static Assets

### Community 19 - "NextAuth Type Extensions"
Cohesion: 0.5
Nodes (3): JWT, Session, User

### Community 22 - "Build Configuration"
Cohesion: 0.67
Nodes (3): ESLint Config, Next.js Config, PostCSS Config (TailwindCSS)

### Community 23 - "Window Icon Asset"
Cohesion: 1.0
Nodes (3): Next.js Application, Public Static Assets, Window SVG Icon

## Knowledge Gaps
- **135 isolated node(s):** `eslintConfig`, `nextConfig`, `config`, `config`, `geist` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatBudget()` connect `Lead Detail Views` to `Property & Lead Display`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `connectDB()` connect `API Route Handlers` to `App Shell & Realtime`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `authOptions` connect `App Shell & Realtime` to `API Route Handlers`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `config` to the rest of the system?**
  _135 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Property & Lead Display` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Auth & Database Core` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._