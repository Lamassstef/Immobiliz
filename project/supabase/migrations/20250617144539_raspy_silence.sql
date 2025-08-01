/*
  # Configuration du stockage de fichiers

  1. Nouveaux Buckets
    - `documents-juridiques` pour les baux, attestations et relevés notaires
    - `tableaux-amortissement` pour les tableaux d'amortissement

  2. Sécurité
    - Buckets privés avec RLS
    - Politiques permettant aux utilisateurs de gérer leurs propres fichiers
    - Restrictions sur les types de fichiers et tailles
*/

-- Création du bucket pour les documents juridiques
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents-juridiques',
  'documents-juridiques',
  false,
  5242880, -- 5MB en bytes
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png']
);

-- Création du bucket pour les tableaux d'amortissement
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tableaux-amortissement',
  'tableaux-amortissement',
  false,
  5242880, -- 5MB en bytes
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png']
);

-- Politique pour les documents juridiques - permettre aux utilisateurs de gérer leurs propres fichiers
CREATE POLICY "Users can upload their own documents juridiques"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents-juridiques' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents juridiques"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents-juridiques' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents juridiques"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents-juridiques' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents juridiques"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents-juridiques' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour les tableaux d'amortissement
CREATE POLICY "Users can upload their own tableaux amortissement"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tableaux-amortissement' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own tableaux amortissement"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'tableaux-amortissement' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own tableaux amortissement"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tableaux-amortissement' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own tableaux amortissement"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'tableaux-amortissement' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Table pour stocker les références des documents liés aux biens
CREATE TABLE IF NOT EXISTS bien_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id uuid REFERENCES biens(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL, -- 'bail', 'attestation_propriete', 'releves_notaires', 'tableau_amortissement'
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activation de RLS sur la table des documents
ALTER TABLE bien_documents ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres documents
CREATE POLICY "Users can manage their own bien documents"
  ON bien_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_bien_documents_bien_id ON bien_documents(bien_id);
CREATE INDEX IF NOT EXISTS idx_bien_documents_user_id ON bien_documents(user_id);