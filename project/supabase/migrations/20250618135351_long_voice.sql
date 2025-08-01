/*
  # Création des tables pour la comptabilité

  1. Nouvelles Tables
    - `bilans`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers auth.users)
      - `year` (text, année du bilan)
      - `status` (text, statut: en_cours, termine)
      - `date_termine` (timestamp, date de finalisation)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `comptabilite_entries`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers auth.users)
      - `bilan_id` (uuid, référence vers bilans)
      - `bien_id` (uuid, référence vers biens)
      - `date` (date, date de l'opération)
      - `affectation` (text, type d'affectation)
      - `libelle` (text, description)
      - `encaissement` (numeric, montant encaissé)
      - `decaissement` (numeric, montant décaissé)
      - `piece_jointe_url` (text, URL de la pièce jointe)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Activation RLS sur toutes les tables
    - Politiques pour que les utilisateurs ne voient que leurs données
    - Index pour optimiser les performances
*/

-- Création de la table bilans
CREATE TABLE IF NOT EXISTS bilans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year text NOT NULL,
  status text NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'termine')),
  date_termine timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Création de la table comptabilite_entries
CREATE TABLE IF NOT EXISTS comptabilite_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bilan_id uuid REFERENCES bilans(id) ON DELETE CASCADE NOT NULL,
  bien_id uuid REFERENCES biens(id) ON DELETE CASCADE NOT NULL,
  date date,
  affectation text,
  libelle text,
  encaissement numeric(10,2),
  decaissement numeric(10,2),
  piece_jointe_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (encaissement IS NULL OR decaissement IS NULL OR (encaissement IS NULL AND decaissement IS NULL))
);

-- Activation de RLS
ALTER TABLE bilans ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite_entries ENABLE ROW LEVEL SECURITY;

-- Politiques pour bilans
CREATE POLICY "Users can manage their own bilans"
  ON bilans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiques pour comptabilite_entries
CREATE POLICY "Users can manage their own comptabilite entries"
  ON comptabilite_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_bilans_user_id ON bilans(user_id);
CREATE INDEX IF NOT EXISTS idx_bilans_year ON bilans(year);
CREATE INDEX IF NOT EXISTS idx_comptabilite_entries_user_id ON comptabilite_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_comptabilite_entries_bilan_id ON comptabilite_entries(bilan_id);
CREATE INDEX IF NOT EXISTS idx_comptabilite_entries_bien_id ON comptabilite_entries(bien_id);

-- Triggers pour updated_at
CREATE TRIGGER update_bilans_updated_at
  BEFORE UPDATE ON bilans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comptabilite_entries_updated_at
  BEFORE UPDATE ON comptabilite_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();