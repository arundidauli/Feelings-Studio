# Feelings Studio

Feelings Studio is a mobile-first emotional interaction app.

The core idea is simple:

- one person creates a thoughtful question
- the app generates a shareable link
- the other person opens it in WhatsApp or any browser
- the answer is captured in a warmer, more human flow than a normal form

This is not just a message generator.
This is a relationship-first response experience.

## Product Vision

The app is built for moments like:

- boyfriend asking girlfriend to go out
- husband asking wife for a special plan
- wife asking husband for a gift or quality time
- sibling asking to reconnect
- parent asking for a meaningful moment
- friend asking for one honest chance to talk

The product should make emotional asking easier, cleaner, and more graceful.

Main direction:

- human tone
- soft UI
- mobile-first interaction
- easy sharing
- no harsh dead ends
- emotionally smart response handling

## Current MVP

The current version already supports:

### Sender flow

- sender enters name
- sender enters who the link is for
- sender chooses relationship type
- sender chooses tone
- sender picks or edits a question
- app generates a shareable link
- app supports copy and WhatsApp share

### Receiver flow

- receiver opens the shared link
- page reads URL params
- page shows sender/receiver context
- page presents emotionally aware answer options
- answer result changes UI state

### How sender gets the answer (current app behavior)

This app is static and currently uses WhatsApp handoff for answer return.

Example:

1. You create a request and add your WhatsApp number in sender form.
2. You share the generated link to your friend on WhatsApp.
3. Your friend opens link, sees question, and chooses an answer.
4. On outcome screen, your friend taps **Send answer back on WhatsApp**.
5. WhatsApp opens with pre-filled reply to your number.
6. Friend taps send, and you receive the answer in your chat.

Important:

- If sender WhatsApp number is not added, receiver can still copy reply text.
- Automatic silent notification is not available yet (needs backend/webhook).

### Direct in-app answer capture (new)

You can now send answers directly to your backend (without WhatsApp).

#### Option A (recommended): Supabase

Set these in `index.html`:

- `window.FEELINGS_SUPABASE_URL = "https://xxxx.supabase.co"`
- `window.FEELINGS_SUPABASE_ANON_KEY = "your-anon-key"`

Then create table and security rules using SQL editor:

```sql
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  request_id text,
  answer_type text not null,
  answer_text text not null,
  sender_name text,
  receiver_name text,
  question text,
  lang text,
  target text,
  created_at timestamptz not null default now()
);

alter table public.responses enable row level security;

create policy "allow_anon_insert_responses"
on public.responses
for insert
to anon
with check (true);
```

Important for safety:

- Strict mode: keep anon insert-only (most secure).
- Sender-only inbox mode: app now uses a private local `sender_token` header (`x-sender-token`) and request mapping table so only the original sender device can list matching answers.
- Current inbox implementation still matches by `request_id` from local sent-link history on same device.

#### Option B: Custom webhook

`window.FEELINGS_ANSWER_API_URL = "https://your-api-endpoint"`

How it works:

- App generates a `requestId` in the shared link.
- If Supabase is configured, app now shares a short URL format: `?req=<requestId>` and loads full payload from `requests` table.
- When receiver submits an answer, app sends POST payload.
- Supabase payload fields: `request_id`, `answer_type`, `answer_text`, `sender_name`, `receiver_name`, `question`, `lang`, `target`, `created_at`.
- Custom API payload fields: `requestId`, `answerType`, `answerText`, `senderName`, `receiverName`, `question`, `lang`, `target`, `timestamp`.

If endpoint is not configured, app falls back to WhatsApp handoff flow.

### Outcome handling

- positive answer triggers magical celebration animation
- maybe answer shows a soft outcome
- negative answer does not stop harshly
- negative answer opens a recovery layer with softer alternatives

### Technical shape

- static HTML/CSS/JS
- no backend required
- no auth
- no external AI dependency
- easy to deploy on Netlify

## Why this idea is strong

Normal forms feel cold.
Normal chat messages are easy to ignore.
This product creates a small emotional experience around the answer.

That matters because:

- the sender feels intentional
- the receiver feels guided, not pressured
- the answer feels more meaningful
- uncertain answers can still protect the relationship

The real product value is not only the question.
It is the answer handling.

## Advanced Product Direction

This is where the idea should grow.

### 1. Relationship-aware flows

Different relationship types should produce different answer patterns.

Examples:

- partner flow: flirty, soft, reassuring
- spouse flow: mature, warm, practical
- sibling flow: playful, forgiving, direct
- parent flow: respectful, emotional, grateful
- friend flow: low pressure, honest, supportive

This means:

- different preset questions
- different answer options
- different recovery messaging
- different celebration states

### 2. Smarter negative-answer recovery

This is one of the strongest parts of the product.

Instead of:

- Yes
- No

We should guide toward:

- yes
- soft yes
- maybe
- not now
- reassure me first
- try again sweeter
- I still care but not today

Advanced version:

- detect hard negative
- immediately offer gentler rewrites
- suggest a reply that reduces damage
- keep the interaction emotionally intelligent

### 3. Sender notification system

Current MVP only supports copying a response back.

Advanced version should support:

- sender gets notified when link is opened
- sender gets notified when answer is submitted
- sender sees answer type: yes / maybe / no
- sender optionally sees soft recovery response

Possible implementations:

- lightweight backend endpoint
- email notification
- WhatsApp handoff
- webhook to a dashboard

### 4. Memory-based personalization

The app becomes much stronger if the sender can attach context.

Examples:

- one memory
- one reason this matters
- one emotional note
- one preferred outcome

Then the receiver page can feel more human:

- “This matters because he misses talking to you.”
- “She wants this moment to feel special, not random.”

### 5. Better magical outcomes

Positive answers should feel rewarding.

Advanced positive state ideas:

- animated stars, petals, soft glow
- reveal card with “you made someone’s day”
- one-tap reply back
- confetti-like but elegant, not childish

### 6. Safer emotional UX

The product should avoid manipulation.

Important safeguards:

- never guilt-trip the receiver
- never pressure a yes
- negative answers should stay respected
- recovery suggestions should remain optional
- tone should stay kind and adult

This is critical if the product is used in real relationships.

### 7. Shareable micro-pages

Each request link should feel like its own page, not a generic app screen.

Advanced direction:

- personalized title
- dynamic meta tags
- relationship-based accent theme
- share preview card

### 8. Analytics and product insight

Later we should measure:

- link generated
- link opened
- answer submitted
- answer type
- recovery option chosen
- share channel

That will show which flows actually work.

## Full Implementation Plan

### Phase 1: MVP foundation

Status: done / in progress

- create sender builder flow
- generate share link using query params
- support receiver answer mode
- show positive / maybe / no outcomes
- add magical animation for positive response
- add recovery options for hard no
- keep app static and mobile responsive

### Phase 2: better emotional intelligence

Next:

- relationship-based templates
- different answer packs by relationship
- stronger recovery copy
- better sender/receiver naming
- better response-back message generation

### Phase 3: richer product behavior

Next:

- save recent drafts in local storage
- add custom themes per relationship
- add memory / context input
- add more nuanced answer options
- improve open graph / social preview

### Phase 4: backend and notifications

Next:

- create backend API
- store request and answer state
- generate short IDs instead of long query strings
- notify sender on open and answer
- optionally create dashboard for sent links

### Phase 5: premium product layer

Future:

- downloadable answer cards
- animated reply cards
- multi-step emotional flows
- premium templates
- multilingual support

## UX Principles

This project should always follow these rules:

- clean before clever
- emotional before decorative
- mobile first
- simple copy
- soft motion
- vector accents over emoji noise
- every answer path should feel respectful

## Current File Structure

```text
feelings-app/
├── index.html
├── README.md
├── RESPONSE_FLOW_PLAN.md
└── netlify.toml
```

## Deployment

This app is fully static.

### Run locally

Open `index.html` directly in a browser.

### Netlify Drop

1. Open [Netlify Drop](https://app.netlify.com/drop)
2. Drag the project folder
3. Deploy

### Netlify CLI

```bash
npm install -g netlify-cli
cd feelings-app
netlify deploy --prod --dir .
```

## What we are building next

Immediate next improvements:

1. Relationship-specific answer flows
2. Better soft-negative recovery logic
3. Local draft saving
4. Better share preview state
5. Optional memory/context field

After that:

1. backend notifications
2. short links
3. analytics
4. richer celebration states
5. real sender dashboard
