/*
  # Création du système de pièces jointes pour les entrées comptables

  1. Nouvelles Tables
    - `comptabilite_entry_attachments`
      - `id` (uuid, clé primaire)
      - `comptabilite_entry_id` (uuid, référence vers comptabilite_entries)
      - `user_id` (uuid, référence vers auth.users)
      - `file_name` (text, nom original du fichier)
      - `file_path` (text, chemin dans le storage)
      - `file_size` (integer, taille en bytes)
      - `mime_type` (text, type MIME)
      - `created_at` (timestamp)

  2. Nouveau Bucket
    - `comptabilite-attachments` pour les pièces jointes comptables

  3. Sécurité
    - Activation RLS sur la nouvelle table
    - Politiques permettant aux utilisateurs de gérer leurs propres pièces jointes
    - Politiques de stockage pour le nouveau bucket
*/

-- Création de la table pour les pièces jointes comptables
CREATE TABLE IF NOT EXISTS comptabilite_entry_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comptabilite_entry_id uuid REFERENCES comptabilite_entries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE comptabilite_entry_attachments ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres pièces jointes
CREATE POLICY "Users can manage their own comptabilite attachments"
  ON comptabilite_entry_attachments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_comptabilite_attachments_entry_id ON comptabilite_entry_attachments(comptabilite_entry_id);
CREATE INDEX IF NOT EXISTS idx_comptabilite_attachments_user_id ON comptabilite_entry_attachments(user_id);

-- Création du bucket pour les pièces jointes comptables
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comptabilite-attachments',
  'comptabilite-attachments',
  false,
  5242880, -- 5MB en bytes
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket comptabilite-attachments
CREATE POLICY "Users can upload their own comptabilite attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comptabilite-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own comptabilite attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'comptabilite-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own comptabilite attachments"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'comptabilite-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own comptabilite attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'comptabilite-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);