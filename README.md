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

# Core Concept

Create a vault -> upload content -> store on Shelby -> publish a storefront -> get paid directly.

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

# Features

### Public Creator Marketplace

Verdact opens as a marketplace first.

Anyone can browse creator storefronts, discover public preview content, view creator profiles, and explore free or paid vaults without connecting a wallet.

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

The vault dashboard gives creators a publishing workspace for content, activity, and analytics.

---

### Shelby-Powered Content Storage

Creator content is stored as Shelby blobs instead of platform-owned media files.

Supported content types include:

- MP4
- MOV
- MP3
- WAV
- JPG
- PNG
- GIF
- PDF
- TXT
- Markdown
- DOCX
- PPTX
- CSV
- JSON

Files are fetched client-side from Shelby and rendered as local object URLs.

---

### Free and Paid Storefronts

Verdact supports two creator models:

- **Free creators** publish public content and accept donations.
- **Paid creators** lock content behind a monthly ShelbyUSD subscription.

Paid content appears as marketplace listings, but the actual Shelby blob is only fetched after an active subscription check passes.

---

### Direct ShelbyUSD Payments

Subscriptions and donations are wallet-to-wallet payments.

Verdact verifies each Shelbynet transaction before writing anything to Supabase:

- Transaction succeeded
- Sender matches the supporter wallet
- Recipient matches the creator wallet
- Amount matches the expected ShelbyUSD value
- Asset matches ShelbyUSD

No platform cut. No custodial payment layer.

---

### Creator Analytics

Creators can track:

- Earnings
- Active subscribers
- Content views
- Viewed files
- Subscriber activity
- Donation activity
- Top content

Analytics are designed as a creator intelligence layer, not a generic admin dashboard.

---

# Tech Stack

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

# Architecture

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
        |
        +-- Supabase
               +-- Vaults
               +-- Content
               +-- Subscriptions
               +-- Donations
               +-- Favourites
               +-- Content views
```

---

# Routes

| Route | Purpose |
|---|---|
| `/` | Public marketplace homepage |
| `/explore` | Creator discovery page |
| `/creator/[wallet]` | Public creator storefront |
| `/subscribe/[wallet]` | Paid subscription checkout |
| `/profile` | Connected supporter profile |
| `/vault` | Private creator workspace |
| `/vault/upload` | Upload and publish Shelby content |
| `/vault/settings` | Edit creator profile, assets, pricing, and access |
| `/vault/analytics` | Creator analytics |

---

# Getting Started

## Clone

```bash
git clone https://github.com/NizarAZ/Verdact-App.git

cd Verdact-App
```

---

## Install

```bash
npm install
```

---

## Environment Variables

Create:

```txt
.env.local
```

Add:

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

---

## Database Setup

Run the schema in Supabase SQL Editor:

```txt
scripts/supabase-onchain-schema.sql
```

The schema creates:

- `vaults`
- `content`
- `subscriptions`
- `donations`
- `favourites`
- `content_views`

It also removes the old RAG tables:

- `documents`
- `answer_receipts`

---

## Run Locally

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Connect Petra Wallet when you want to publish, subscribe, donate, favourite, or manage a vault.

---

# Wallet Setup

1. Install Petra Wallet
2. Switch to Shelbynet
3. Fund the wallet with testnet gas
4. Use ShelbyUSD for subscriptions and donations

---

# Project Structure

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
```

---

# Current Capabilities

- Public creator marketplace
- Creator storefront pages
- Free creator donations
- Paid creator subscriptions
- Active subscription checks
- Shelby blob upload and read flow
- Creator vault setup
- Creator content upload
- File settings management
- Profile avatar and cover uploads
- Supporter profile
- Favourites
- Creator analytics
- Vercel deployment

---

# Roadmap

- Creator discovery ranking
- Better media thumbnails and transcoding
- Storefront customization
- Subscription renewal reminders
- Creator collections and bundles
- Encrypted private drops
- Multi-wallet support
- Shelby Explorer links for every published blob
- Better creator payout reporting

---

# Vision

Verdact is building infrastructure for:

> Public creator marketplaces where content storage, audience access, and payments belong to the creator.

Not another platform with a creator dashboard.  
A marketplace where creators own the vault, the audience, and the wallet relationship.

---

# Live Demo

https://verdact.vercel.app/

---

# License

MIT

---

Built on Shelby Protocol and Aptos.
