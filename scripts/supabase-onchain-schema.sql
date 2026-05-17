CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  file_name TEXT NOT NULL,
  title TEXT,
  onchain_tx_hash TEXT NOT NULL,
  blob_id TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  chunk_count INTEGER DEFAULT 0,
  size INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS onchain_tx_hash TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS blob_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS size INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();

CREATE TABLE IF NOT EXISTS answer_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  receipt_hash TEXT NOT NULL,
  onchain_tx_hash TEXT NOT NULL,
  blob_ids_used TEXT[] NOT NULL,
  blobs_used JSONB,
  receipt_blob_id TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE answer_receipts ADD COLUMN IF NOT EXISTS blobs_used JSONB;

CREATE INDEX IF NOT EXISTS documents_wallet_address_idx ON documents(wallet_address);
CREATE INDEX IF NOT EXISTS documents_onchain_tx_hash_idx ON documents(onchain_tx_hash);
CREATE INDEX IF NOT EXISTS answer_receipts_wallet_address_idx ON answer_receipts(wallet_address);
CREATE INDEX IF NOT EXISTS answer_receipts_onchain_tx_hash_idx ON answer_receipts(onchain_tx_hash);

ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE answer_receipts DISABLE ROW LEVEL SECURITY;

-- Optional if you re-enable RLS later and want direct public SELECT access.
DROP POLICY IF EXISTS "Public read" ON answer_receipts;
CREATE POLICY "Public read" ON answer_receipts FOR SELECT USING (true);
