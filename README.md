# Verdact

> **AI answers you can verify onchain.**
> Verifiable document intelligence built on Shelby Protocol and Aptos.

Verdact is a RAG pipeline where every answer carries cryptographic proof. Documents are registered onchain via the Shelby smart contract. Every AI answer generates a receipt with a hash, wallet address, and source blob references — publicly verifiable by anyone.

**Not just another AI chat. A verifiable knowledge layer.**

🔗 Live Demo: [verdact.vercel.app](https://verdact.vercel.app)

## The Problem

Every RAG system has the same trust gap:

- The app claims it used certain documents
- You have no way to verify that claim
- Answers can be fabricated, sources can be swapped
- No audit trail survives a session

## The Solution

Verdact anchors document registration to the Aptos blockchain via Shelby Protocol's smart contract. Every uploaded document gets a wallet-signed onchain transaction. Every AI answer generates a receipt hash stored with blob references, wallet address, and timestamp — and anyone can re-run the hash check to confirm the answer hasn't changed.

```
Upload doc
    │
    ▼
Shelby blob storage          ← document bytes stored on decentralized hot storage
    │
    ▼
Aptos smart contract         ← wallet signs blob_metadata::register_blob tx
    │
    ▼
AI retrieves chunks          ← only onchain-confirmed blobs are queryable
    │
    ▼
Answer + receipt hash        ← SHA-256 of question + answer + blob IDs
    │
    ▼
Public verify link           ← anyone can recompute and confirm
```

## Key Features

### 🔐 Onchain Document Registration
Every document upload triggers a wallet-signed transaction on Shelbynet via `blob_metadata::register_blob`. The Aptos transaction hash is stored alongside the document — proof of existence at a specific time, owned by a specific wallet.

### 🧠 Verifiable RAG Pipeline
Only documents confirmed onchain are queryable. The AI retrieves chunks from Shelby blob storage and generates answers grounded in registered sources.

### 📄 Answer Receipts
Every query generates a receipt containing:
- Question and answer
- Source blob IDs used
- SHA-256 hash of the full context
- Wallet address
- Timestamp
- Public verification URL

### ✅ Public Verification
Anyone with a receipt ID can visit `/verify/[id]` — no wallet, no login required. The page recomputes the receipt hash and confirms it matches. If it does: the answer hasn't changed since it was generated.

### 🌐 Wallet-Based Identity
No passwords, no email accounts. Your Petra wallet is your identity. All documents, queries, and receipts are scoped to your connected wallet address.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Auth | Petra Wallet (Aptos) via `@aptos-labs/wallet-adapter-react` |
| Storage | Shelby Protocol SDK (decentralized hot storage on Aptos) |
| Onchain | Aptos smart contract — `blob_metadata::register_blob` |
| Database | Supabase (metadata index + receipt storage) |
| AI | OpenRouter API |
| Embeddings | Local models (no API cost) |
| Deployment | Vercel |

## Architecture

```
Petra Wallet (user identity)
        │
        ▼
Verdact UI (Next.js)
        │
        ▼
API Routes
        │
        ├── Shelby Protocol SDK
        │      ├── Upload blob → get blob ID
        │      ├── Retrieve chunks for RAG
        │      └── Read blob paths for verification
        │
        ├── Aptos Smart Contract
        │      └── blob_metadata::register_blob
        │             ← wallet signs tx on every upload
        │             ← tx hash stored as proof of registration
        │
        ├── AI Pipeline
        │      ├── Document chunking
        │      ├── Local embeddings
        │      └── Context retrieval + answer generation
        │
        └── Supabase
               ├── Document metadata + onchain_tx_hash
               └── Answer receipts + receipt_hash
```

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

Create `.env.local`:

```env
# Shelby Protocol
SHELBY_API_KEY=your_key
NEXT_PUBLIC_CONTRACT_ADDRESS=0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a
NEXT_PUBLIC_SHELBY_RPC_URL=https://api.shelbynet.shelby.xyz/shelby
NEXT_PUBLIC_SHELBY_FULLNODE_URL=https://api.shelbynet.shelby.xyz/v1

# Supabase
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# AI
OPENROUTER_API_KEY=your_key
```

### Database Setup

Run in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  title TEXT,
  file_name TEXT,
  file_hash TEXT,
  blob_id TEXT,
  onchain_tx_hash TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answer_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  receipt_hash TEXT NOT NULL,
  onchain_tx_hash TEXT,
  blob_ids_used TEXT[],
  document_id UUID REFERENCES documents(id),
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE answer_receipts DISABLE ROW LEVEL SECURITY;
```

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000` and connect your Petra wallet set to Shelbynet.

## Wallet Setup (Shelbynet)

1. Install [Petra Wallet](https://petra.app)
2. Open Settings → Network → Switch to **Shelbynet**
3. Get free testnet tokens from the Shelby faucet: [docs.shelby.xyz/tools/wallets/petra-setup](https://docs.shelby.xyz/tools/wallets/petra-setup)
   - APT tokens (for gas fees)
   - ShelbyUSD tokens (for blob storage)

## How Verification Works

Every answer at Verdact is independently verifiable:

1. Ask a question → AI answers using registered document chunks
2. A receipt is saved: `{ question, answer, blob_ids_used, wallet_address, timestamp }`
3. A SHA-256 hash of the receipt is computed and stored
4. Anyone visits `/verify/[receipt_id]`
5. The page re-fetches the receipt and recomputes the hash
6. If `recomputed_hash === stored_hash` → **answer unchanged**
7. Source blobs link to Shelby Explorer for onchain confirmation

## Project Structure

```
Verdact-App/
│
├── app/
│   ├── api/
│   │   ├── upload/          ← Shelby blob upload + onchain registration
│   │   ├── query/           ← RAG pipeline + receipt generation
│   │   ├── documents/       ← document list by wallet
│   │   └── stats/           ← dashboard stats by wallet
│   │
│   ├── app/                 ← authenticated app routes
│   │   ├── upload/
│   │   ├── query/
│   │   ├── receipts/
│   │   └── verify/
│   │
│   └── verify/[id]/         ← public verification page (no login required)
│
├── components/
│   ├── dashboard/
│   ├── verify/
│   └── WalletProvider.tsx
│
├── lib/
│   ├── shelby/              ← Shelby SDK integration
│   ├── onchain.ts           ← Aptos smart contract calls
│   ├── ai/                  ← RAG pipeline
│   ├── supabase/
│   └── document-processing/
│
├── scripts/
│   └── supabase-onchain-schema.sql
│
└── middleware.ts
```

## Roadmap

- [ ] Vector semantic search (upgrade from keyword chunking)
- [ ] Multi-document cross-querying
- [ ] Encrypted private knowledge vaults
- [ ] Team-level shared document workspaces
- [ ] AI workflow automation with receipt chains
- [ ] Mobile wallet support (beyond Petra)
- [ ] Export receipts as signed PDF certificates

## Vision

> AI systems that answer, remember, and prove.

Verdact is infrastructure for a world where AI answers are not trusted by default — they are verified by design. Every answer carries its evidence. Every source is traceable to the chain.

## License

MIT

Built on [Shelby Protocol](https://shelby.xyz) ⚡ · Powered by [Aptos](https://aptos.dev)
