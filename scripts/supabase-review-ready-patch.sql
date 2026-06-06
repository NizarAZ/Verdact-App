ALTER TABLE content
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS block_height TEXT;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS block_height TEXT;

UPDATE content
SET is_locked = true
FROM vaults
WHERE content.vault_id = vaults.id
  AND vaults.is_paid = true
  AND content.is_preview = false
  AND COALESCE(content.is_locked, false) = false;

UPDATE content
SET is_preview = true,
    is_locked = false
FROM vaults
WHERE content.vault_id = vaults.id
  AND vaults.is_paid = false;
