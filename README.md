# Verdact

> **Creator storefronts with no platform in the middle.**  
> A decentralized creator marketplace powered by Shelby Protocol and Aptos.

Verdact lets creators publish public storefronts, store content on Shelby Protocol, and receive ShelbyUSD directly from supporters through wallet-to-wallet payments.

Built for creators, researchers, musicians, artists, educators, and independent publishers who want **public discovery, creator-owned storage, and direct monetization**.

---

## Why Verdact?

Most creator platforms control the relationship between creators and supporters.

Verdact gives that relationship back to the wallet.

Traditional creator platforms often suffer from:

- Platform fees on every subscription or donation
- Centralized content storage
- Account-based identity and audience lock-in
- Limited portability between platforms
- Deplatforming risk
- Opaque payment and access logic

Verdact solves this by combining:

- Decentralized hot storage through Shelby Protocol
- Petra wallet identity
- ShelbyUSD wallet-to-wallet payments
- Public creator marketplace discovery
- Free and paid creator vaults
- Supabase metadata for storefronts, subscriptions, donations, and analytics

---

## Core Concept

Create a vault → upload content → store on Shelby → publish a storefront → get paid directly.

```txt
Creator
  |
  v
Verdact UI (Next.js)
  |
  v
Creator Vault
  |
  +-- Shelby Protocol
  |     +-- Store content blobs
  |     +-- Read content client-side
  |     +-- Register blob metadata onchain
  |
  +-- Supabase
  |     +-- Creator profiles
  |     +-- Content metadata
  |     +-- Subscriptions
  |     +-- Donations
  |     +-- Favourites
  |
  +-- Petra Wallet
        +-- Sign uploads
        +-- Pay subscriptions
        +-- Send donations
```

---

## Features

### Public Creator Marketplace

Verdact opens as a marketplace first.

Anyone can browse creator storefronts, discover public preview content, view creator profiles, and explore free or paid vaults without connecting a wallet. The homepage surfaces real-time latest public drops and category lanes with live creator and file counts.

---

### Creator Vaults

Creators can set up a vault with:

- Display name
- Bio
- Category
- Avatar
- Cover image
- Free or paid access mode
- Monthly ShelbyUSD price
- Donation visibility settings

The vault dashboard gives creators a publishing workspace with content queue, supporter feed, storefront checklist, and quick-access actions.

---

### Content Visibility System

Every file a creator uploads has one of three visibility states:

- **Public Preview** — visible to anyone browsing the marketplace without a wallet
- **Locked** — gated behind an active ShelbyUSD subscription; displayed as a blurred card with a subscribe CTA
- **Free** — publicly accessible with donations enabled

Creators set visibility during upload and can change it at any time from file settings.

---

### Shelby-Powered Content Storage

Creator content is stored as Shelby blobs instead of platform-owned media files.

Supported content types:

- MP4, MOV
- MP3, WAV
- JPG, PNG, GIF
- PDF
- TXT, Markdown
- DOCX, PPTX
- CSV, JSON

Files are fetched client-side from Shelby and rendered as local object URLs. Each published file displays its Shelby blob ID with a direct link to Shelby Explorer.

---

### Content Viewer

Files open in a native viewer matched to their type:

- **PDF** — rendered in a full-height iframe
- **Video** — HTML5 video player with controls
- **Audio** — HTML5 audio player
- **Images** — inline display
- **Text / Markdown** — readable pre-formatted block
- **Other** — direct download fallback

Shelby fetch errors surface a retry option rather than a silent blank screen.

---

### Free and Paid Storefronts

Verdact supports two creator models:

- **Free creators** publish public content and accept ShelbyUSD donations with preset amounts and a 280-character supporter note.
- **Paid creators** lock content behind a monthly ShelbyUSD subscription. The actual Shelby blob is only fetched after an active, non-expired subscription check passes server-side.

---

### Direct ShelbyUSD Payments

Subscriptions and donations are wallet-to-wallet payments.

Verdact verifies each Shelbynet transaction before writing anything to Supabase:

- Transaction succeeded
- Sender matches the supporter wallet
- Recipient matches the creator wallet
- Amount matches the expected ShelbyUSD value
- Asset matches ShelbyUSD
- Block height recorded for audit

No platform cut. No custodial payment layer.

---

### Payment Trust & Verification

Every payment is on-chain verifiable:

- Shelby Explorer link attached to every subscription and donation
- Downloadable JSON receipt per transaction (includes tx_hash, block_height, from, to, amount, asset, verified_at)
- "Payments verified on Shelbynet" badge shown on storefronts once a creator has received a transaction
- Wallet addresses are copyable with one click throughout the UI
- Network indicator in the navbar confirms Shelbynet connection

---

### Subscription Renewal & Expiry

- Subscription expiry is enforced server-side — expired subscriptions cannot access locked blobs
- Subscriptions expiring within 7 days show a renewal warning on the supporter profile
- A Renew button links directly to the subscription checkout
- Storefronts show a targeted message to visitors with lapsed subscriptions

---

### Creator Analytics

Creators can track:

- Total earnings (ShelbyUSD paid directly to wallet)
- Active vs expired subscriber count
- Content views over a 30-day padded window
- Views by content file
- File type breakdown
- Subscriber starts over time
- Recent supporter activity (subscriptions and donation notes)
- Top content by views

Analytics are designed as a creator intelligence layer, not a generic admin dashboard.

---

### Creator Onboarding

The vault dashboard includes a live storefront checklist that reflects real database state:

- Profile named
- Bio written
- Public preview uploaded
- Pricing decided
- First file uploaded

Each incomplete item shows an inline hint with a direct link to fix it. Once all items are complete, a "Your storefront is live" banner appears with a link to the public storefront.

---

### Explore & Discovery

- Search creators by name, category, or bio
- Sort by newest, most subscribers, price (low/high), or most content
- Filter by category lane with live creator and file counts
- Empty lanes show a helpful prompt instead of a broken grid

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS |
| Wallet | Petra Wallet via `@aptos-labs/wallet-adapter-react` |
| Storage | Shelby Protocol SDK |
| Chain | Aptos / Shelbynet |
| Payments | ShelbyUSD wallet-to-wallet transfers |
| Database | Supabase |
| Charts | Recharts |
| Deployment | Vercel |

---

## Architecture

```txt
Frontend (Next.js)
        |
        v
Public Marketplace
        |
        +-- Explore creators
        +-- View storefronts
        +-- Preview content listings
        |
        v
Creator / Supporter Actions
        |
        +-- Petra Wallet
        |      +-- Sign upload registration
        |      +-- Pay subscriptions
        |      +-- Send donations
        |
        +-- Shelby SDK
        |      +-- Upload blobs
        |      +-- Read blobs client-side
        |      +-- Register blob metadata
        |
        +-- API Routes
        |      +-- Verify payment transactions
        |      +-- Save metadata
        |      +-- Track subscriptions and donations
        |      +-- Enforce subscription expiry
        |
        +-- Supabase
               +-- Vaults
               +-- Content (with visibility state)
               +-- Subscriptions (with tx_hash, block_height, expiry)
               +-- Donations (with tx_hash, block_height, note)
               +-- Favourites
               +-- Content views
```

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Public marketplace homepage |
| `/explore` | Creator discovery with search, sort, and category filters |
| `/creator/[wallet]` | Public creator storefront |
| `/subscribe/[wallet]` | Paid subscription checkout |
| `/profile` | Connected supporter profile with receipts and renewal |
| `/vault` | Private creator workspace |
| `/vault/upload` | Upload and publish Shelby content with visibility control |
| `/vault/settings` | Edit creator profile, assets, pricing, and access |
| `/vault/analytics` | Creator analytics |

---

## Getting Started

### Clone

```bash
git clone https://github.com/NizarAZ/Verdact-App.git
cd Verdact-App
```

### Install

```bash
npm install
```

### Environment Variables

Create `.env.local` and add:

```env
# Shelby Protocol
NEXT_PUBLIC_CONTRACT_ADDRESS=0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a
NEXT_PUBLIC_SHELBY_RPC_URL=https://api.shelbynet.shelby.xyz/shelby
NEXT_PUBLIC_SHELBY_FULLNODE_URL=https://api.shelbynet.shelby.xyz/v1
SHELBY_API_KEY=your_key

# Supabase
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Database Setup

**Fresh install** — run the base schema in Supabase SQL Editor:

```txt
scripts/supabase-onchain-schema.sql
```

**Existing database** — also run the review-ready patch to add new columns:

```txt
scripts/supabase-review-ready-patch.sql
```

The patch adds `is_locked`, `tags`, and `block_height` columns and auto-migrates existing content visibility based on vault access mode.

The base schema creates:

- `vaults`
- `content`
- `subscriptions`
- `donations`
- `favourites`
- `content_views`

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`

Connect Petra Wallet when you want to publish, subscribe, donate, favourite, or manage a vault.

---

## Wallet Setup

1. Install Petra Wallet
2. Switch to Shelbynet
3. Fund the wallet with testnet gas
4. Use ShelbyUSD for subscriptions and donations

---

## Project Structure

```txt
Verdact-App/
|
+-- app/
|   +-- api/
|   |   +-- content/
|   |   +-- creators/
|   |   +-- donations/
|   |   +-- favourites/
|   |   +-- profile/
|   |   +-- shelby/
|   |   +-- subscriptions/
|   |   +-- vault/
|   |
|   +-- creator/
|   +-- explore/
|   +-- profile/
|   +-- subscribe/
|   +-- vault/
|
+-- components/
|   +-- creator/
|   +-- marketplace/
|   +-- profile/
|   +-- shared/
|   +-- ui/
|   +-- vault/
|   +-- wallet/
|
+-- lib/
|   +-- amount.ts
|   +-- client-chain.ts
|   +-- constants.ts
|   +-- format.ts
|   +-- onchain.ts
|   +-- shelby-browser.ts
|   +-- supabase-server.ts
|   +-- wallet.ts
|
+-- public/
+-- scripts/
|   +-- supabase-onchain-schema.sql
|   +-- supabase-review-ready-patch.sql
```

---

## Current Capabilities

- Public creator marketplace with live preview drops
- Creator storefront pages
- Public preview / locked / free content visibility system
- Content viewer for PDF, video, audio, image, and text files
- Free creator donations with presets and supporter notes
- Paid creator subscriptions with server-side expiry enforcement
- Subscription renewal flow with 7-day warning
- Active subscription checks against Shelbynet transactions
- Shelby blob upload and read flow with retry on fetch error
- Shelby Explorer links on every published blob and transaction
- Downloadable JSON transaction receipts
- Verified-payment badge on storefronts
- Network indicator (Shelbynet) in navbar
- Wallet address copy-to-clipboard throughout UI
- Creator vault setup and content upload
- File settings management (title, description, visibility, tags)
- Profile avatar and cover uploads
- Supporter profile with active subscriptions and donation history
- Favourites
- Creator analytics (30-day padded charts, retention, file-type breakdown, top content)
- Explore page with search, sort, and category filters
- Creator onboarding checklist with live state and inline hints
- Storefront share snippet generation
- Mobile responsive layout (375px+)
- Skeleton loading states on all data-heavy pages
- Vercel deployment

---

## Roadmap

- Creator discovery ranking
- Better media thumbnails and transcoding
- Storefront customization
- Creator collections and bundles
- Encrypted private drops
- Multi-wallet support
- Better creator payout reporting
- pg_cron scheduled job for subscription expiry (currently checked on profile load)

---

## Vision

Verdact is building infrastructure for:

> Public creator marketplaces where content storage, audience access, and payments belong to the creator.

Not another platform with a creator dashboard.  
A marketplace where creators own the vault, the audience, and the wallet relationship.

---

## Live Demo

https://verdact.vercel.app/

---

## License

MIT

---

Built on Shelby Protocol and Aptos.
