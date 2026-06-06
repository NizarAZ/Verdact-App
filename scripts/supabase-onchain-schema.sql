CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS answer_receipts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

CREATE TABLE IF NOT EXISTS vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  category TEXT,
  avatar_blob_id TEXT,
  cover_blob_id TEXT,
  is_paid BOOLEAN DEFAULT false,
  price_monthly NUMERIC DEFAULT 0,
  subscriber_count INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  show_donation_total BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES vaults(id),
  wallet_address TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT,
  file_name TEXT,
  blob_id TEXT,
  onchain_tx_hash TEXT,
  size_bytes INTEGER,
  duration_seconds INTEGER,
  thumbnail_blob_id TEXT,
  allow_download BOOLEAN DEFAULT true,
  is_preview BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_wallet TEXT NOT NULL,
  creator_wallet TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  block_height TEXT,
  amount_paid NUMERIC,
  starts_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_wallet TEXT NOT NULL,
  creator_wallet TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  tx_hash TEXT NOT NULL,
  block_height TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_wallet TEXT NOT NULL,
  creator_wallet TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(subscriber_wallet, creator_wallet)
);

CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id),
  viewer_wallet TEXT,
  viewed_at TIMESTAMP DEFAULT now()
);

ALTER TABLE vaults DISABLE ROW LEVEL SECURITY;
ALTER TABLE content DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE favourites DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_views DISABLE ROW LEVEL SECURITY;
