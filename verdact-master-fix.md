# Verdact — Master Fix Prompt
> This is a complete audit and fix instruction.
> Read the entire document before touching any file.
> Fix in the exact order listed. Do not skip sections.
> After each numbered fix, run `npm run build` before continuing.

---

## Context — what this app is and how it works

Verdact is a Verifiable RAG app built on Shelby Protocol (decentralized blob storage on Aptos).

The pipeline:
1. User uploads a document → split into chunks → each chunk embedded and stored as a Shelby blob
2. User asks a question → question embedded → top matching chunks retrieved from Shelby → sent to Gemini → answer generated
3. Every answer generates a receipt blob on Shelby: question + answer + source blob names + context hash
4. Anyone can verify a receipt by re-downloading the source chunks and recomputing the hash

Auth: Clerk. Each user gets a deterministic workspaceId derived from their Clerk user ID.
Storage: All blobs under one server Aptos account, namespaced per user by workspaceId.
Blob paths: `v/{workspaceId}/d/{docId}/...`, `v/{workspaceId}/c/{docId}/...`, `v/{workspaceId}/r/...`

---

## FIX 1 — Remove Supabase entirely

Supabase is not part of this project. Remove it completely.

Steps:
- Find every file that imports from `@supabase/supabase-js` or references `supabase`
- Remove those imports and any Supabase client initialization
- Remove any API route logic that queries or writes to Supabase
- Remove `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `.env.local.example` if present
- Uninstall the package: `npm uninstall @supabase/supabase-js`

WorkspaceId must come ONLY from this function — create it in `lib/workspace.ts` if it doesn't exist:

```ts
import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'

export async function getWorkspaceId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  // Deterministic 12-char workspace ID from Clerk user ID
  return crypto
    .createHash('sha256')
    .update(userId)
    .digest('hex')
    .slice(0, 12)
}
```

Every API route (`/api/ingest`, `/api/query`, `/api/receipts`, `/api/stats`, `/api/verify`)
must call `getWorkspaceId()` at the top and use it for all blob path construction.
No route should ever read or write a blob without the workspaceId prefix.

After removing Supabase, run `npm run build`. Fix any TypeScript errors before continuing.

---

## FIX 2 — Speed: embedder singleton

The embeddings model currently reloads on every request. This makes every query slow.

Replace the entire content of `lib/embeddings.ts` with this:

```ts
import 'server-only'

let embedderPromise: Promise<any> | null = null

function getEmbedder() {
  if (!embedderPromise) {
    console.time('embedder-init')
    embedderPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      })
    ).then(embedder => {
      console.timeEnd('embedder-init')
      return embedder
    })
  }
  return embedderPromise
}

export async function getEmbedding(text: string): Promise<number[]> {
  console.time('embedding')
  const embedder = await getEmbedder()
  const output = await embedder(text, { pooling: 'mean', normalize: true })
  console.timeEnd('embedding')
  return Array.from(output.data) as number[]
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}
```

Also in `app/api/query/route.ts`:
- Download all chunk blobs in parallel: use `Promise.all()` not sequential await
- Reduce top chunks from 5 to 3
- Add `console.time('gemini')` and `console.timeEnd('gemini')` around the Gemini call
- Add a 15-second timeout on the Gemini call:

```ts
const geminiPromise = model.generateContent(prompt)
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Gemini timeout after 15s')), 15000)
)
const result = await Promise.race([geminiPromise, timeoutPromise]) as any
```

After this fix, test two queries back to back.
The second query's embedding step should be under 500ms.
Show me the console.time output from both queries.

---

## FIX 3 — Remove UI elements Codex added without being asked

These were not in the original brief. Remove them. Do not replace with anything.

**Navbar (all pages):**
- KEEP: Verdact logo, "Verdact App", "built on Shelby / shelbynet", shelbynet status dot, Clerk `<UserButton />`
- KEEP: Navigation link back to landing page
- REMOVE: Nothing else — the navbar is correct as-is once Supabase errors are gone

**Upload page — remove entirely:**
- The "Registration path" right sidebar (the card with 01 Original document blob / 02 Chunk JSON blobs / 03 Supabase workspace index)
- Any reference to Supabase in the success state
- The hash display in the success state (too technical, not useful to users)

**Upload page — replace success state with this:**
```
✓ Stored on Shelby

[document title]
[chunk count] chunks · [blob prefix in monospace, truncated]

[ Ask a question about this document → ]   ← pink link to /app/query
[ Back to dashboard ]                       ← ghost link
```

**Ask page — remove entirely:**
- The "Retrieval path" right sidebar (01 Read chunk blobs / 02 Rank source evidence / 03 Create answer receipt)
- The Ask page should be single column, max-width 720px, centered

**Receipts list page — remove:**
- The "extractive-fallback" badge or any internal model strategy label
- Keep: question text, timestamp, source count, verified/unverified badge

**Verify standalone page:**
- This page (app/app/verify) can stay as-is — it works correctly
- Only change: remove the individual blob path rows from the results
  (the `v/e111fcf7e2dc...` rows with "match" labels are too noisy)
- Replace with three clean check rows only:
  ```
  ✓ Context hash matches
  ✓ All source blobs found  
  ✓ Receipt blob intact
  ```
- Below those three: show the recomputed context hash in monospace

---

## FIX 4 — Visual consistency

Every page must use the same spacing, typography, and card style.
Go through every page file and apply these rules uniformly.

### Global rules
```css
/* Page wrapper — apply to every page's root div */
max-width: 1100px;
margin: 0 auto;
padding: 48px 24px;

/* Section titles */
font-family: var(--font-display);
font-size: 28px;
font-weight: 600;
color: var(--text-primary);
margin-bottom: 8px;

/* Section subtitles */
font-family: var(--font-body);
font-size: 14px;
color: var(--text-secondary);
margin-bottom: 32px;
```

### Card rules — apply to every card
```css
background: var(--bg-surface);
border: 1px solid var(--border);
border-radius: var(--radius-md); /* 10px */
padding: 28px;
/* NO box-shadow */
/* NO backdrop-filter */
```

### Clickable card hover
```css
transition: background 0.15s ease, border-color 0.15s ease;
cursor: pointer;
/* hover: */
background: var(--bg-elevated);
border-color: var(--border-hover);
```

### Typography — apply everywhere
```
Page titles:     font-display, 28-32px, weight 600
Card titles:     font-display, 18-20px, weight 500  
Body text:       font-body, 14-15px, color --text-primary
Descriptions:    font-body, 13px, color --text-secondary
Captions/labels: font-body, 12px, color --text-tertiary
Technical data:  font-mono (hashes, blob names, IDs, timestamps, addresses)
```

### Button rules — two types only
```css
/* Primary */
background: #ff2d78;
color: #0e1011;
font-family: var(--font-body);
font-weight: 500;
padding: 10px 20px;
border-radius: var(--radius-sm);
border: none;
cursor: pointer;

/* Ghost */
background: transparent;
border: 1px solid var(--border);
color: var(--text-secondary);
font-family: var(--font-body);
padding: 8px 16px;
border-radius: var(--radius-sm);
```

### Page-specific fixes

**Dashboard:**
- Stats panel min-height: 240px
- Stats 2×2 grid cells separated by `1px solid var(--border)` dividers
- Recent documents: max 3 rows shown, "View all →" link if more
- Recent receipts: max 3 rows shown, "View all →" link if more
- Action cards: true 2×2 grid, equal height, descriptions visible on all four cards

**Upload page:**
- Single column, max-width 600px, centered
- Drag zone: min-height 160px, dashed border
- Document title input below the drop zone
- Single pink "Upload to Shelby" button
- Success state as described in Fix 3

**Ask page:**
- Single column, max-width 720px, centered
- Document selector dropdown: full width
- Question textarea: full width, 4 rows minimum
- Character counter: bottom-right of textarea, monospace, --text-tertiary
- Submit button: "Get answer", full width on mobile, auto width on desktop
- Loading state: "Retrieving from Shelby..." text with animated dots
- Answer appears below in a card after response

**Answer display (after query):**
```
┌─────────────────────────────────────┐
│ [Answer text — font-body, 15px]     │
│                                     │
│ Sources                             │
│ ├ [doc title] chunk-1 [84%]         │
│ ├ [doc title] chunk-2 [71%]         │
│ └ [doc title] chunk-3 [68%]         │
│                                     │
│ context hash: [hash truncated]      │
│ Receipt saved · [ID truncated] ›    │
└─────────────────────────────────────┘
```

**Receipts list:**
- Full-width rows, not cards
- Columns: question | timestamp | sources | verified badge | →
- Divider between rows: `1px solid var(--border)`
- Click entire row to open receipt detail

**Receipt detail `/app/receipts/[id]`:**
If this page does not exist or does not work, build it now.

Zone 1 — Answer:
```
[Question — font-display, 24px]
[Answer — font-body, 15px, line-height 1.75, inside --bg-surface card]
[model badge] [timestamp]
```

Zone 2 — Sources:
```
Sources used
[Each source row:]
  [doc title]  [chunk-N]  [similarity bar]
  [blob name — BlobTag monospace pill]
  ↓ click to expand chunk text
```

Zone 3 — Verification:
```
[ Verify this receipt ]  ← full-width pink button

[After click:]
● Verified
✓ Context hash matches
✓ All source blobs found
✓ Receipt blob intact
context hash: [full hash in monospace]
```

**Verify standalone page `/app/verify`:**
- Input placeholder: "Paste receipt ID"
- Button: "Verify receipt"
- Results: three check rows + context hash (as described in Fix 3)
- Remove individual blob path rows

---

## FIX 5 — Receipt detail page routing

The receipt ID in the URL must match what's stored in the receipt blob.

In the receipts list, each row links to `/app/receipts/[id]`.
The `[id]` must be the `receipt_id` field from the receipt JSON.

In `app/app/receipts/[id]/page.tsx`:
1. Get `receipt_id` from URL params
2. Call `/api/receipts/[id]` — build this route if it doesn't exist:
   - List all blobs at `v/{workspaceId}/r/` prefix
   - Find the blob whose parsed JSON has `receipt_id === params.id`
   - Return the full receipt JSON
3. Display the receipt using the three-zone layout above
4. The verify button on this page calls `/api/verify` with the receipt's blob name

---

## FIX 6 — Error states

Every page that fetches data needs a proper error state. Not a console.error. A visible UI state.

For each of these scenarios, show a clean error card:

**Shelby unavailable:**
```
Could not reach Shelby network.
Check your connection or try again in a moment.
[ Retry ]
```

**No documents uploaded (Ask page):**
```
No documents yet.
Upload a document before asking questions.
[ Upload document → ]
```

**Receipt not found (Receipt detail):**
```
Receipt not found.
This receipt may have expired or the ID is incorrect.
[ Back to receipts ]
```

**Gemini timeout:**
```
Answer generation timed out.
Try a shorter question or try again.
[ Try again ]
```

Error cards use:
- Background: `var(--bg-surface)`
- Border: `1px solid var(--danger)` with 30% opacity
- Icon: `AlertCircle` from lucide-react, `var(--danger)` color
- Text: font-body, --text-primary for headline, --text-secondary for description

---

## Final checklist — do not mark done until all pass

### Functional
- [ ] Supabase fully removed, `npm run build` passes
- [ ] Second query embedding step under 500ms (check console.time)
- [ ] Upload works for .txt and .pdf files
- [ ] Query returns answer with sources in under 10s (after first warm-up)
- [ ] Receipt is saved to Shelby after every query
- [ ] Clicking a receipt row opens the detail page
- [ ] Verify button on receipt detail returns verified: true
- [ ] Standalone verify page works with pasted receipt ID
- [ ] All routes return 401 if user is not authenticated (Clerk middleware)

### Visual
- [ ] No hardcoded hex colors in any component file
- [ ] No "Registration path" or "Retrieval path" sidebars anywhere
- [ ] No "extractive-fallback" or internal model labels visible to users
- [ ] No individual blob path rows in verify results
- [ ] All four action cards show title + description
- [ ] Stats panel shows 2×2 grid with dividers
- [ ] Receipt detail page exists and displays all three zones
- [ ] Error states exist on every data-fetching page
- [ ] Mobile layout (375px) stacks correctly on all pages

### Before reporting done
Run through this exact flow once:
1. Sign in with Clerk
2. Upload a .txt file
3. Ask one question about it
4. Click the receipt from the dashboard
5. Click "Verify this receipt" on the detail page
6. Confirm "● Verified" with three green checks

If any step fails, fix it before reporting done.
