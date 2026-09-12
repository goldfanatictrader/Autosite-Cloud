# AutoSite Cloud — User Stories

**Product:** AutoSite Cloud — Mobile-First Website Builder
**Last Updated:** 2026-09-12

---

## Table of Contents

1. [Phase 1 — Site Dashboard](#phase-1--site-dashboard)
2. [Phase 1 — AI Content Writer](#phase-1--ai-content-writer)
3. [Phase 2 — One-Tap Publish](#phase-2--one-tap-publish)
4. [Phase 2 — Multi-Site Manager](#phase-2--multi-site-manager)
5. [Phase 2 — Custom Domain Setup](#phase-2--custom-domain-setup)
6. [Phase 3 — Traffic Insights](#phase-3--traffic-insights)
7. [Phase 3 — Account & Sign In](#phase-3--account--sign-in)
8. [Phase 4 — Notifications & Alerts](#phase-4--notifications--alerts)

---

## Phase 1 — Site Dashboard

### Site Overview Cards
**Story:** As a user managing multiple websites, I want to see each site's name, visual preview, and status in one scrollable list so that I can quickly assess my portfolio without navigating into individual sites.

**Acceptance Criteria:**
- [ ] Each card displays site name, a thumbnail preview, and a status badge
- [ ] Cards are arranged in a vertically scrollable list
- [ ] Card tap navigates to the site's detail/editor view
- [ ] Cards show last modified date
- [ ] Empty state displays a message with a prompt to create a first site

**Priority:** Must Have
**Phase:** 1

---

### Quick Create Button
**Story:** As a user who wants to start building quickly, I want a prominent "Create Site" button so that I can launch a new website project with a single tap from anywhere in the dashboard.

**Acceptance Criteria:**
- [ ] A floating or fixed "Create New Site" button is visible on the dashboard
- [ ] Tapping the button opens the site creation flow within one screen transition
- [ ] Default template or blank canvas option is pre-selected for speed
- [ ] Button is accessible via thumb zone on mobile (bottom-right or bottom-center)

**Priority:** Must Have
**Phase:** 1

---

### Status at a Glance
**Story:** As a user managing several sites, I want to instantly tell which sites are live, in draft, or currently building so that I can prioritize my work and avoid checking each site individually.

**Acceptance Criteria:**
- [ ] Status badges are color-coded: green for live, gray for draft, amber for building
- [ ] Status is derived from the site's deployment state in the backend
- [ ] Status updates in real-time or near real-time via polling or WebSocket
- [ ] A legend or tooltip explains badge meanings on first use

**Priority:** Must Have
**Phase:** 1

---

### Find Any Site
**Story:** As a user with many sites, I want to search or filter sites by name or status so that I can locate a specific project without scrolling through a long list.

**Acceptance Criteria:**
- [ ] A search bar is available at the top of the dashboard
- [ ] Search filters results in real-time as the user types
- [ ] Filter options include status (live, draft, building) and name
- [ ] Search results update the card list without a page reload
- [ ] No-results state is shown when no matches are found

**Priority:** Should Have
**Phase:** 1

---

## Phase 1 — AI Content Writer

### One-Line Brief
**Story:** As a user who doesn't want to write website copy from scratch, I want to describe my business in one sentence so that the AI generates a complete set of website content tailored to my industry.

**Acceptance Criteria:**
- [ ] Input field accepts a single sentence (up to 300 characters)
- [ ] AI generates copy within 10 seconds of submission
- [ ] Generated content is displayed in a preview before insertion
- [ ] User can regenerate content with a different prompt
- [ ] Brief history of past prompts is saved for reuse

**Priority:** Must Have
**Phase:** 1

---

### Auto Page Copy
**Story:** As a user building a new site, I want the AI to automatically write headlines, service descriptions, about sections, and calls to action so that I have a full draft ready to customize.

**Acceptance Criteria:**
- [ ] AI generates section-specific content: hero headline, subheadline, services list, about text, CTA
- [ ] Each section is mapped to its corresponding page element
- [ ] User can accept, skip, or edit each generated section individually
- [ ] Generated text respects the site's template layout and tone settings
- [ ] At least 3 headline variants are offered for the hero section

**Priority:** Must Have
**Phase:** 1

---

### Tone & Language
**Story:** As a user creating content for a specific audience, I want to choose the voice (friendly, professional, formal) and language of my website copy so that the AI output matches my brand identity.

**Acceptance Criteria:**
- [ ] Tone selector offers at least 5 presets: friendly, professional, formal, playful, minimal
- [ ] Language selector supports at least 10 languages at launch
- [ ] Tone and language selections persist across all AI generation within a project
- [ ] Changing tone/language triggers a regeneration prompt for existing content
- [ ] Tone descriptions are shown to help users understand each option

**Priority:** Should Have
**Phase:** 1

---

### Rewrite & Refine
**Story:** As a user who wants to fine-tune AI-generated text, I want to select any text block and ask the AI to shorten, expand, or reword it so that I can polish content without leaving the editor.

**Acceptance Criteria:**
- [ ] Text selection triggers an inline "Rewrite" action menu
- [ ] Rewrite options include: shorten, expand, reword, make more formal, make more casual
- [ ] Original text is preserved until the user confirms the replacement
- [ ] Rewrite respects the current tone and language settings
- [ ] User can undo a rewrite and revert to the previous version

**Priority:** Should Have
**Phase:** 1

---

## Phase 2 — One-Tap Publish

### Publish Button
**Story:** As a user who has finished building my site, I want to tap a single "Publish" button so that my site goes live to the internet without needing technical knowledge.

**Acceptance Criteria:**
- [ ] "Publish" button is prominently displayed in the editor and dashboard
- [ ] Tapping publishes the site to a default subdomain or connected domain
- [ ] Post-publish confirmation shows the live URL with a share option
- [ ] Button state changes to "Publishing..." during the deploy process
- [ ] A confirmation dialog warns if domain is not connected

**Priority:** Must Have
**Phase:** 2

---

### Build Progress
**Story:** As a user publishing a site, I want to see each step of the build and upload process so that I know the system is working and can anticipate when it will finish.

**Acceptance Criteria:**
- [ ] A progress indicator shows current step (e.g., "Compiling assets", "Deploying", "Verifying")
- [ ] Progress bar or step list updates in real-time
- [ ] Total estimated time is displayed at the start
- [ ] Error states are shown inline with a retry option
- [ ] Build completes with a success notification and live URL

**Priority:** Should Have
**Phase:** 2

---

### Preview Link
**Story:** As a user who wants feedback before going live, I want to share a private preview link so that others can review my site without it being publicly indexed.

**Acceptance Criteria:**
- [ ] A "Generate Preview Link" action is available from the site editor
- [ ] Preview link is accessible via URL without login (but not indexable by search engines)
- [ ] Link expiration is set to 7 days by default
- [ ] User can revoke a preview link at any time
- [ ] Preview link shows a banner indicating it is a preview

**Priority:** Must Have
**Phase:** 2

---

### Restore Previous Version
**Story:** As a user who accidentally broke my site or want to revert changes, I want to restore a previous working version so that I can recover without manual rebuilding.

**Acceptance Criteria:**
- [ ] A version history list is accessible from the site settings
- [ ] Each version shows timestamp and description (e.g., "Published", "Saved draft")
- [ ] Tapping a version shows a diff or preview before restoring
- [ ] Restore action creates a new version (non-destructive)
- [ ] Version history retains at least 20 previous states per site

**Priority:** Should Have
**Phase:** 2

---

## Phase 2 — Multi-Site Manager

### Bulk Create Sites
**Story:** As an agency user managing multiple clients, I want to spin up several sites from templates at once so that I can onboard multiple projects in minutes instead of hours.

**Acceptance Criteria:**
- [ ] A "Bulk Create" option is available from the dashboard
- [ ] User can select multiple templates and assign site names in a single flow
- [ ] Sites are created in parallel with progress indicators for each
- [ ] Created sites appear in the dashboard upon completion
- [ ] At least 10 sites can be created in a single bulk operation

**Priority:** Could Have
**Phase:** 2

---

### Template Library
**Story:** As a user building new sites, I want access to a library of proven layout templates so that I can reuse high-performing designs and speed up the creation process.

**Acceptance Criteria:**
- [ ] Template library is browsable with thumbnail previews
- [ ] Templates are categorized by niche (e.g., restaurant, portfolio, SaaS, blog)
- [ ] Each template shows a live preview option
- [ ] User can filter templates by category, popularity, or date added
- [ ] Custom templates can be saved from existing sites

**Priority:** Must Have
**Phase:** 2

---

### Bulk Actions
**Story:** As a user managing many sites, I want to select multiple sites and perform actions like publish, pause, or remove on all of them at once so that I can efficiently manage my portfolio.

**Acceptance Criteria:**
- [ ] Long-press or checkbox activates multi-select mode on the dashboard
- [ ] Available bulk actions: publish, unpublish, pause, remove, move to folder
- [ ] Confirmation dialog is shown before destructive bulk actions
- [ ] Progress indicator shows completion status for each site in the batch
- [ ] Partial failure shows which sites failed with reasons

**Priority:** Could Have
**Phase:** 2

---

### Folders & Tags
**Story:** As a user organizing sites by client, niche, or campaign, I want to create folders and apply tags so that I can group and retrieve sites logically.

**Acceptance Criteria:**
- [ ] Folder creation is accessible from the dashboard sidebar or menu
- [ ] Sites can be dragged or assigned to folders
- [ ] Tags can be added and removed from site detail views
- [ ] Dashboard supports filtering by folder or tag
- [ ] A site can belong to multiple tags but only one folder

**Priority:** Should Have
**Phase:** 2

---

## Phase 2 — Custom Domain Setup

### Domain Search & Buy
**Story:** As a user who wants a professional domain for my site, I want to search for and register a domain directly within the app so that I don't need to use a third-party registrar.

**Acceptance Criteria:**
- [ ] Domain search queries availability across TLDs (.com, .net, .org, etc.)
- [ ] Pricing is displayed per domain including registration and renewal fees
- [ ] Purchase flow includes billing information and payment processing
- [ ] Purchased domain is automatically linked to the selected site
- [ ] Domain availability results appear within 3 seconds

**Priority:** Should Have
**Phase:** 2

---

### Guided Connect
**Story:** As a user who already owns a domain, I want a step-by-step guided flow to connect it to my AutoSite Cloud site so that I can use my existing domain without technical support.

**Acceptance Criteria:**
- [ ] Connection wizard detects the user's DNS provider when possible
- [ ] Step-by-step instructions are shown with visual diagrams
- [ ] DNS record values (A, CNAME, TXT) are provided for manual configuration
- [ ] A "Verify" button checks DNS propagation status
- [ ] Error states explain common issues and provide links to help docs

**Priority:** Must Have
**Phase:** 2

---

### Automatic HTTPS
**Story:** As a site owner concerned about security, I want HTTPS to be automatically provisioned and enabled for my custom domain so that visitors see a secure connection without manual certificate management.

**Acceptance Criteria:**
- [ ] SSL certificate is automatically provisioned after domain verification
- [ ] HTTP traffic is automatically redirected to HTTPS
- [ ] Certificate renewal is handled silently in the background
- [ ] HTTPS status is shown in the domain settings panel
- [ ] Certificate expiration alerts are sent 30 days before renewal

**Priority:** Must Have
**Phase:** 2

---

### Domain Status Check
**Story:** As a user managing custom domains, I want to see the status of each domain (live, verifying, error, expired) so that I can proactively address issues before they affect visitors.

**Acceptance Criteria:**
- [ ] Domain status is shown in the domain settings with color-coded indicators
- [ ] Statuses include: Live, Verifying, DNS Error, Expired, Pending
- [ ] Status updates automatically as DNS changes propagate
- [ ] A manual "Re-check Status" button is available
- [ ] Status history log shows recent transitions with timestamps

**Priority:** Should Have
**Phase:** 2

---

## Phase 3 — Traffic Insights

### Visits Overview
**Story:** As a site owner, I want to see daily and total visit counts for each site so that I can understand how much traffic my site is receiving over time.

**Acceptance Criteria:**
- [ ] Dashboard shows a summary card with total visits and daily average per site
- [ ] A line chart displays visits over a selectable period (7 days, 30 days, 90 days)
- [ ] Date range picker allows custom period selection
- [ ] Data is updated at least once per day
- [ ] Unique visitors vs total visits are distinguished

**Priority:** Must Have
**Phase:** 3

---

### Top Pages
**Story:** As a site owner analyzing content performance, I want to see which pages visitors open most so that I can focus my optimization efforts on high-traffic pages.

**Acceptance Criteria:**
- [ ] A ranked list of pages sorted by view count is displayed
- [ ] Each entry shows page title, URL, view count, and percentage of total traffic
- [ ] Time period filter applies to the ranking
- [ ] Clicking a page entry navigates to the page editor
- [ ] At least the top 20 pages are shown

**Priority:** Should Have
**Phase:** 3

---

### Traffic Sources
**Story:** As a site owner evaluating my marketing efforts, I want to see where my visitors come from (search, social, direct, referral) so that I can allocate resources to the most effective channels.

**Acceptance Criteria:**
- [ ] A pie or bar chart visualizes traffic by source category
- [ ] Sources include: Organic Search, Direct, Social Media, Referral, Paid, Email
- [ ] Top referring domains are listed with visit counts
- [ ] Time period filter applies to source data
- [ ] Data is sourced from privacy-respecting analytics (no individual tracking)

**Priority:** Should Have
**Phase:** 3

---

### Compare Sites
**Story:** As a user with multiple sites, I want to compare performance metrics side by side so that I can identify top performers and underperformers across my portfolio.

**Acceptance Criteria:**
- [ ] A comparison view allows selecting 2–5 sites to compare
- [ ] Metrics displayed: total visits, daily average, top page, top source
- [ ] Comparison data is shown in a table or side-by-side cards
- [ ] Time period selector applies to all compared sites
- [ ] Export comparison as a PDF or CSV report

**Priority:** Could Have
**Phase:** 3

---

## Phase 3 — Account & Sign In

### Quick Sign Up
**Story:** As a new user, I want to create an account quickly using my email or a social login (Google, Apple) so that I can start building without a lengthy registration process.

**Acceptance Criteria:**
- [ ] Sign-up form requires only email and password (or social auth)
- [ ] Social login buttons for Google and Apple are displayed prominently
- [ ] Email verification is sent but does not block initial access
- [ ] Sign-up completes within 2 screen transitions
- [ ] Terms of service and privacy policy links are shown during sign-up

**Priority:** Must Have
**Phase:** 3

---

### Secure Login
**Story:** As a returning user, I want to access my workspace safely from any device so that my account and site data remain protected.

**Acceptance Criteria:**
- [ ] Login supports email/password and social authentication
- [ ] Failed login attempts are rate-limited after 5 consecutive failures
- [ ] Login from a new device triggers an email notification
- [ ] Session tokens are invalidated after 30 days of inactivity
- [ ] Two-factor authentication is available as an optional security setting

**Priority:** Must Have
**Phase:** 3

---

### Password Reset
**Story:** As a user who has forgotten my password, I want to recover access independently through a secure reset flow so that I don't need to contact support.

**Acceptance Criteria:**
- [ ] "Forgot Password" link is visible on the login screen
- [ ] Reset email is sent within 60 seconds of request
- [ ] Reset link expires after 1 hour
- [ ] Password requirements are enforced (min 8 chars, 1 number, 1 special char)
- [ ] Successful reset invalidates all existing sessions

**Priority:** Must Have
**Phase:** 3

---

### Stay Signed In
**Story:** As a frequent user, I want to keep the app open and signed in without re-entering credentials so that I can access my workspace instantly each time I return.

**Acceptance Criteria:**
- [ ] "Remember me" option persists login for 30 days
- [ ] Biometric authentication (Face ID / fingerprint) is offered for app re-entry
- [ ] Session persists across app restarts
- [ ] User can manually sign out from account settings
- [ ] Automatic sign-out occurs after 60 days of inactivity

**Priority:** Should Have
**Phase:** 3

---

## Phase 4 — Notifications & Alerts

### Publish Complete Alerts
**Story:** As a user publishing a site, I want to receive a notification when the publish process is complete so that I know my site is live without watching the progress screen.

**Acceptance Criteria:**
- [ ] Push notification is sent upon successful publish
- [ ] Notification includes site name and live URL
- [ ] Notification is also sent for publish failures with a brief error message
- [ ] Notification preferences can be toggled per event type
- [ ] In-app notification center retains a history of publish events

**Priority:** Must Have
**Phase:** 4

---

### Domain Reminders
**Story:** As a user with a registered domain, I want to be reminded when my domain is approaching its renewal date so that I don't lose my domain due to expiration.

**Acceptance Criteria:**
- [ ] Reminder notifications are sent at 30, 14, and 7 days before expiration
- [ ] Reminder includes domain name, expiration date, and a link to renew
- [ ] Email and push notifications are sent for domain reminders
- [ ] Reminder frequency is configurable in notification settings
- [ ] Auto-renewal toggle is available in domain settings

**Priority:** Should Have
**Phase:** 4

---

### Quiet Hours
**Story:** As a user who values uninterrupted time, I want to set quiet hours during which the app stays silent so that I am not disturbed during evenings, sleep, or focus time.

**Acceptance Criteria:**
- [ ] Quiet hours settings allow specifying start and end times
- [ ] Quiet hours apply to push notifications only (in-app alerts still visible)
- [ ] Quiet hours can be set per day of the week
- [ ] Default quiet hours are 10 PM – 7 AM
- [ ] Emergency alerts (security, billing) can optionally bypass quiet hours

**Priority:** Could Have
**Phase:** 4

---

## Summary

| Phase | Feature Area | Must Have | Should Have | Could Have | Total Stories |
|-------|-------------|-----------|-------------|------------|---------------|
| 1 | Site Dashboard | 3 | 1 | 0 | 4 |
| 1 | AI Content Writer | 2 | 2 | 0 | 4 |
| 2 | One-Tap Publish | 2 | 2 | 0 | 4 |
| 2 | Multi-Site Manager | 1 | 1 | 2 | 4 |
| 2 | Custom Domain Setup | 2 | 2 | 0 | 4 |
| 3 | Traffic Insights | 1 | 2 | 1 | 4 |
| 3 | Account & Sign In | 3 | 1 | 0 | 4 |
| 4 | Notifications & Alerts | 1 | 1 | 1 | 3 |
| **Total** | | **15** | **12** | **4** | **31** |
