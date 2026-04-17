-- Champs supplémentaires pour les prospects (infos client devis)
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS phone    text,
  ADD COLUMN IF NOT EXISTS siret    text,
  ADD COLUMN IF NOT EXISTS address  text;

-- Table documents : pièces jointes liées à un prospect
CREATE TABLE IF NOT EXISTS documents (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id   uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  name          text NOT NULL,
  url           text NOT NULL,
  storage_path  text NOT NULL,
  type          text NOT NULL DEFAULT 'other', -- brief | quote | contract | other
  size_bytes    bigint,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_prospect_id_idx ON documents(prospect_id);

-- Thread pour la mémoire du chat Jarvis (conversations sans prospect attaché)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS thread_id text;

CREATE INDEX IF NOT EXISTS messages_thread_id_idx ON messages(thread_id);
