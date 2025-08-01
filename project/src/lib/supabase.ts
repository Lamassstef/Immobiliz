import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nom: string | null
          prenom: string | null
          sexe: string | null
          telephone: string | null
          adresse: string | null
          code_postal: string | null
          mode_detention: string | null
          type_location: string | null
          date_debut_activite: string | null
          date_cloture_comptable: string | null
          numero_siret: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nom?: string | null
          prenom?: string | null
          sexe?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          mode_detention?: string | null
          type_location?: string | null
          date_debut_activite?: string | null
          date_cloture_comptable?: string | null
          numero_siret?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nom?: string | null
          prenom?: string | null
          sexe?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          mode_detention?: string | null
          type_location?: string | null
          date_debut_activite?: string | null
          date_cloture_comptable?: string | null
          numero_siret?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      biens: {
        Row: {
          id: string
          user_id: string
          denomination: string
          type_bien: string
          droit_propriete: string
          tva: string
          surface: number | null
          usage_personnel: string
          type_acquisition: string
          date_acquisition: string | null
          date_mise_en_location: string | null
          emprunt: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          denomination: string
          type_bien: string
          droit_propriete: string
          tva: string
          surface?: number | null
          usage_personnel: string
          type_acquisition: string
          date_acquisition?: string | null
          date_mise_en_location?: string | null
          emprunt: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          denomination?: string
          type_bien?: string
          droit_propriete?: string
          tva?: string
          surface?: number | null
          usage_personnel?: string
          type_acquisition?: string
          date_acquisition?: string | null
          date_mise_en_location?: string | null
          emprunt?: string
          created_at?: string
          updated_at?: string
        }
      }
      bilans: {
        Row: {
          id: string
          user_id: string
          year: string
          status: 'en_cours' | 'termine'
          date_termine: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: string
          status?: 'en_cours' | 'termine'
          date_termine?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: string
          status?: 'en_cours' | 'termine'
          date_termine?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comptabilite_entries: {
        Row: {
          id: string
          user_id: string
          bilan_id: string
          bien_id: string
          date: string | null
          affectation: string | null
          libelle: string | null
          encaissement: number | null
          decaissement: number | null
          piece_jointe_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bilan_id: string
          bien_id: string
          date?: string | null
          affectation?: string | null
          libelle?: string | null
          encaissement?: number | null
          decaissement?: number | null
          piece_jointe_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bilan_id?: string
          bien_id?: string
          date?: string | null
          affectation?: string | null
          libelle?: string | null
          encaissement?: number | null
          decaissement?: number | null
          piece_jointe_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comptabilite_entry_attachments: {
        Row: {
          id: string
          comptabilite_entry_id: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          created_at: string
        }
        Insert: {
          id?: string
          comptabilite_entry_id: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          created_at?: string
        }
        Update: {
          id?: string
          comptabilite_entry_id?: string
          user_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          created_at?: string
        }
      }
    }
  }
}