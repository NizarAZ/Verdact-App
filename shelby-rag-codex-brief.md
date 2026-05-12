# Shelby Verifiable RAG — Codex Build Brief
> Paste this entire document to Codex at the start of the session.

---

## 1. What We Are Building

A **Verifiable RAG (Retrieval-Augmented Generation)** app where:

1. Users upload documents (PDF, TXT, MD) → chunked and stored as blobs on Shelby Protocol
2. Users ask questions → relevant chunks are retrieved from Shelby
3. An LLM answers using those chunks as context
4. Every answer generates an **Answer Receipt** — a JSON blob saved to Shelby containing:
   - The question
   - The answer
   - The blob IDs and chunk IDs used
   - A SHA-256 hash of the retrieved context
   - The model used
   - Timestamp
   - Wallet/account address

The key claim: **you can prove what documents the AI used to answer, when it answered, and verify the source hasn't changed.** This is the honest version — we build the audit trail ourselves on top of Shelby, not claim the chain auto-logs it.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Storage | Shelby Protocol SDK |
| Blockchain | Aptos Testnet |
| LLM | Google Gemini 2.0 Flash (via API) |
| Embeddings | `@xenova/transformers` (local, no API cost) |
| Similarity search | In-memory cosine similarity (no vector DB needed for MVP) |
| Styling | TailwindCSS |
| State | React Query (@tanstack/react-query) |
| Wallet (optional) | `@aptos-labs/wallet-adapter-react` |

---

## 3. Environment Variables

```env
# .env.local
SHELBY_API_KEY=aptoslabs_your_key_here         # from geomi.dev
APTOS_PRIVATE_KEY=ed25519-priv-...             # generated account for server-side ops
GEMINI_API_KEY=your_gemini_key_here            # Google AI Studio
NEXT_PUBLIC_TESTNET_API_KEY=aptoslabs_...      # client-side Aptos API key
```

---

## 4. Shelby Protocol — What You Need to Know

### What Shelby is
Shelby is decentralized hot storage (like S3, but on-chain). Data is stored as **blobs**, identified by `{account_address}/{blob_name}`. Every blob's Merkle root is registered on the **Aptos blockchain**. Reads happen via RPC servers over DoubleZero private fiber.

### Network (testnet = "shelbynet")
```
RPC endpoint:     https://api.shelbynet.shelby.xyz/shelby
Aptos fullnode:   https://api.shelbynet.shelby.xyz/v1
Faucet (APT):     https://faucet.shelbynet.shelby.xyz
Indexer:          https://api.shelbynet.shelby.xyz/v1/graphql
Explorer:         https://explorer.shelby.xyz/shelbynet
```

### Install
```bash
npm install @shelby-protocol/sdk @aptos-labs/ts-sdk
npm install @shelby-protocol/react @tanstack/react-query
npm install @aptos-labs/wallet-adapter-react   # optional wallet UI
```

### Account setup
```ts
import { Account, Ed25519Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

// Generate new (save the private key!)
const account = Account.generate();

// Load existing
const account = new Ed25519Account({
  privateKey: new Ed25519PrivateKey(process.env.APTOS_PRIVATE_KEY),
});
```

You need two things to write blobs:
- **APT tokens** for gas → get from the testnet faucet
- **ShelbyUSD tokens** for storage → get from the Shelby Discord

### Node.js client (server-side / API routes)
```ts
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network } from "@aptos-labs/ts-sdk";

const shelbyClient = new ShelbyNodeClient({
  network: Network.TESTNET,
  apiKey: process.env.SHELBY_API_KEY,
});

// Upload
await shelbyClient.upload({
  account,
  blobData: Buffer.from(JSON.stringify(myData)),
  blobName: "rag/chunks/doc-001/chunk-0.json",
  expirationMicros: (Date.now() + 1000 * 60 * 60 * 24 * 30) * 1000, // 30 days
});

// Download
const blob = await shelbyClient.download({
  account: account.accountAddress,
  blobName: "rag/chunks/doc-001/chunk-0.json",
});
// blob.stream → pipe to buffer or parse

// List blobs for account
const { getBlobMetadata, getAccountBlobs } = shelbyClient.blob;
const allBlobs = await getAccountBlobs({ account: account.accountAddress });
// Returns: BlobMetadata[] with fields: name, size, blobMerkleRoot, creationMicros, expirationMicros, isWritten
```

### Browser client (client-side)
```ts
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
const shelbyClient = new ShelbyClient({ network: Network.TESTNET });
```

### React SDK (hooks)
```tsx
import { ShelbyClientProvider, useUploadBlobs, useAccountBlobs, useBlobMetadata } from "@shelby-protocol/react";

// Providers wrap (in layout.tsx or providers.tsx)
<QueryClientProvider client={queryClient}>
  <ShelbyClientProvider client={shelbyClient}>
    {children}
  </ShelbyClientProvider>
</QueryClientProvider>

// Upload hook
const uploadBlobs = useUploadBlobs({ onSuccess: () => {} });
uploadBlobs.mutate({
  signer,                    // Account or { account: accountAddress, signAndSubmitTransaction }
  blobs: [{ blobName: "receipt.json", blobData: uint8arr }],
  expirationMicros: ...,
});

// Query all blobs for account
const { data: blobs } = useAccountBlobs({ account: "0x...", pagination: { limit: 20, offset: 0 } });

// Query single blob metadata
const { data: meta } = useBlobMetadata({ account: "0x...", name: "rag/receipts/receipt-001.json" });
// meta.blobMerkleRoot is the on-chain cryptographic commitment
```

### Blob naming convention for this project
```
{account}/rag/documents/{docId}/meta.json          ← document metadata
{account}/rag/chunks/{docId}/chunk-{n}.json        ← individual chunks with embedding
{account}/rag/receipts/{timestamp}-{uuid}.json     ← answer receipts
{account}/rag/index.json                           ← master index of all documents
```

### Key SDK types
```ts
type BlobMetadata = {
  owner: object;
  name: string;
  blobMerkleRoot: object;     // on-chain commitment
  size: number;
  expirationMicros: number;
  creationMicros: number;
  isWritten: boolean;
};
```

### Direct HTTP retrieval (for public blob access)
```
GET https://api.testnet.shelby.xyz/shelby/v1/blobs/{account_address}/{blob_name}
```

---

## 5. Answer Receipt Schema

This is what we store on Shelby after every AI answer:

```ts
interface AnswerReceipt {
  receipt_id: string;                // uuid
  account_address: string;           // Aptos account
  timestamp: number;                 // Date.now()
  question: string;
  answer: string;
  model: string;                     // e.g. "gemini-2.0-flash"
  sources: {
    blob_name: string;               // e.g. "rag/chunks/doc-001/chunk-0.json"
    blob_merkle_root: string;        // from BlobMetadata.blobMerkleRoot
    chunk_index: number;
    similarity_score: number;
    doc_title: string;
  }[];
  context_hash: string;              // SHA-256 of concatenated retrieved text
  total_chunks_retrieved: number;
  shelby_receipt_blob: string;       // blob name of this receipt itself (set after upload)
}
```

---

## 6. RAG Pipeline — Step by Step

### Step 1: Document ingestion (API route: `/api/ingest`)
```
1. Receive file upload (PDF/TXT/MD)
2. Extract text
3. Chunk text into ~500 token segments with 50 token overlap
4. Generate embedding for each chunk using @xenova/transformers
   (model: "Xenova/all-MiniLM-L6-v2" — runs locally, no API needed)
5. For each chunk, upload to Shelby:
   blob name: rag/chunks/{docId}/chunk-{n}.json
   content: { text, embedding, chunkIndex, docId, docTitle, charStart, charEnd }
6. Upload document metadata blob:
   blob name: rag/documents/{docId}/meta.json
   content: { docId, title, filename, totalChunks, uploadedAt, accountAddress }
7. Update index blob:
   blob name: rag/index.json
   content: { documents: [{ docId, title, totalChunks, blobNames[] }] }
```

### Step 2: Query (API route: `/api/query`)
```
1. Receive user question
2. Generate embedding for the question (same model)
3. Load index.json from Shelby to get all chunk blob names
4. Download each chunk blob from Shelby
5. Compute cosine similarity between question embedding and each chunk embedding
6. Take top 5 chunks by similarity score
7. Build prompt: system + retrieved chunks as context + question
8. Call Gemini API
9. Build AnswerReceipt:
   - Fetch BlobMetadata for each used chunk (to get merkleRoot)
   - Compute SHA-256 of concatenated chunk texts
   - Set all fields
10. Upload receipt to Shelby:
    blob name: rag/receipts/{timestamp}-{uuid}.json
11. Return answer + receipt to client
```

### Step 3: Verify (API route: `/api/verify/[receiptId]`)
```
1. Load receipt blob from Shelby
2. For each source chunk, re-download the blob
3. Re-compute SHA-256 of texts
4. Compare to stored context_hash
5. Fetch current BlobMetadata from chain, compare merkleRoot
6. Return: { verified: boolean, checks: [...] }
```

---

## 7. App Pages & Components

```
/                     → Home: upload docs + ask questions
/receipts             → Browse all answer receipts
/receipts/[id]        → Single receipt detail + verify button
/documents            → Browse uploaded documents
```

**Key components:**
- `DocumentUploader` — drag & drop, shows chunking progress
- `QueryBox` — question input + answer display with sources
- `SourceCard` — shows chunk text, blob name, merkle root, similarity score
- `ReceiptViewer` — displays full receipt JSON + verify result
- `BlobExplorer` — lists all blobs for the account (using `useAccountBlobs`)

---

## 8. Embedding Setup (Local, No API)

```ts
// lib/embeddings.ts
import { pipeline } from "@xenova/transformers";

let embedder: any = null;

export async function getEmbedding(text: string): Promise<number[]> {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}
```

Install: `npm install @xenova/transformers`

---

## 9. LLM Setup (Gemini)

```ts
// lib/llm.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAnswer(question: string, context: string): Promise<string> {
  const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are a helpful assistant. Answer the question using ONLY the provided context.
If the context doesn't contain enough information, say so clearly.

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

Install: `npm install @google/generative-ai`

---

## 10. Context Hash (for receipt integrity)

```ts
import crypto from "crypto";

export function hashContext(chunks: string[]): string {
  const combined = chunks.join("\n---\n");
  return crypto.createHash("sha256").update(combined).digest("hex");
}
```

---

## 11. MVP Scope (Build This, Nothing Else)

**In scope:**
- [ ] Document upload → chunk → embed → store on Shelby
- [ ] Question → retrieve chunks → Gemini answer → Answer Receipt stored on Shelby
- [ ] Receipt viewer page (show what was used, merkle roots, context hash)
- [ ] Basic verify endpoint (re-fetch chunks, re-hash, compare)
- [ ] Simple clean UI (TailwindCSS)

**Out of scope for MVP:**
- Wallet connection (use server-side generated account)
- Encrypted vaults
- Multi-user / auth
- Smart contracts
- ZK proofs
- PDF parsing beyond basic text extraction (use `pdf-parse` for MVP)
- Vector database (in-memory is fine for testnet)

---

## 12. Key Packages to Install

```bash
npm install @shelby-protocol/sdk @shelby-protocol/react @aptos-labs/ts-sdk
npm install @tanstack/react-query
npm install @xenova/transformers
npm install @google/generative-ai
npm install pdf-parse
npm install uuid
npm install next react react-dom typescript tailwindcss
npm install @types/node @types/react @types/uuid
```

---

## 13. Important Constraints

1. **Shelbynet is wiped ~weekly** — do not rely on persisted blobs between sessions during dev. Always re-upload test data.
2. **You need ShelbyUSD to upload** — get from Shelby Discord. APT for gas from faucet.
3. **API key from geomi.dev** — required to avoid rate limiting. Create under "Testnet" network, server context key for backend, client key for frontend.
4. **Blob names cannot end in `/`** and can be up to 1024 characters.
5. **Chunk size** — keep chunks under 10MB (Shelby chunkset size). 500 tokens ≈ 2-3KB, well within limits.
6. **`Network.TESTNET` in the SDK maps to shelbynet** — this is the current active testnet.
7. **Do not claim** "automatically logged on Aptos" — we build the audit trail ourselves and store it as a blob. Be precise.

---

## 14. Resources

| Resource | URL |
|---|---|
| Shelby docs | https://docs.shelby.xyz |
| Protocol intro | https://docs.shelby.xyz/protocol |
| Architecture overview | https://docs.shelby.xyz/protocol/architecture/overview |
| TypeScript SDK | https://docs.shelby.xyz/sdks/typescript |
| Node.js upload guide | https://docs.shelby.xyz/sdks/typescript/node/guides/uploading-file |
| React SDK | https://docs.shelby.xyz/sdks/react |
| DApp example | https://docs.shelby.xyz/sdks/react/guides/dapp-example |
| Core specs | https://docs.shelby.xyz/sdks/typescript/core/specifications |
| Get API key | https://geomi.dev |
| Get testnet tokens | https://faucet.shelbynet.shelby.xyz |
| Explorer | https://explorer.shelby.xyz/shelbynet |
| Apply for early access | https://developers.shelby.xyz |
| Discord (ShelbyUSD) | https://discord.gg/shelbyprotocol |
| GitHub examples | https://github.com/shelby/examples |
| GitHub quickstart | https://github.com/shelby/shelby-quickstart |

---

## 15. Pitch to Shelby Team (for early access application)

> "Verifiable RAG on Shelby: users upload documents, ask questions, and get AI answers with a cryptographic audit trail. Every answer receipt — containing the question, answer, blob IDs, chunk hashes, and Merkle roots — is stored on Shelby. Anyone can verify what documents the AI used and confirm the source data hasn't changed. This is the first RAG pipeline where the retrieval layer has provenance, built specifically for legal, financial, and compliance use cases where 'trust the app' isn't enough."
