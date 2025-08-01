/*
  # Création de la table des biens immobiliers

  1. Nouvelles Tables
    - `biens`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers auth.users)
      - `denomination` (text, nom du bien)
      - `type_bien` (text, type: Maison, Appartement, etc.)
      - `droit_propriete` (text, type de propriété)
      - `tva` (text, statut TVA)
      - `surface` (numeric, surface en m²)
      - `usage_personnel` (text, usage personnel ou non)
      - `type_acquisition` (text, type d'acquisition)
      - `date_acquisition` (date, date d'acquisition)
      - `date_mise_en_location` (date, date de première location)
      - `emprunt` (text, présence d'emprunt)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Activation RLS sur la table `biens`
    - Politique permettant aux utilisateurs de gérer leurs propres biens
    - Index sur user_id pour optimiser les requêtes
*/

-- Création de la table biens
CREATE TABLE IF NOT EXISTS biens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  denomination text NOT NULL,
  type_bien text NOT NULL DEFAULT 'Maison',
  droit_propriete text NOT NULL DEFAULT 'Pleine propriété',
  tva text NOT NULL DEFAULT 'Non soumis à TVA',
  surface numeric,
  usage_personnel text NOT NULL DEFAULT 'Non',
  type_acquisition text NOT NULL DEFAULT 'Acquisition',
  date_acquisition date,
  date_mise_en_location date,
  emprunt text NOT NULL DEFAULT 'Non',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE biens ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres biens
CREATE POLICY "Users can manage their own biens"
  ON biens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pour optimiser les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_biens_user_id ON biens(user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_biens_updated_at
  BEFORE UPDATE ON biens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();