import { supabase } from './supabase';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface DocumentUploadResult {
  success: boolean;
  file?: UploadedFile;
  error?: string;
}

// Types de documents acceptés
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png'
};

// Taille maximale : 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux. Taille maximale autorisée : 5 MB`
    };
  }

  // Vérifier le type
  if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Formats acceptés : PDF, DOC, DOCX, JPG, PNG`
    };
  }

  return { valid: true };
};

export const uploadDocument = async (
  file: File,
  bienId: string,
  documentType: 'bail' | 'attestation_propriete' | 'releves_notaires' | 'tableau_amortissement',
  userId: string
): Promise<DocumentUploadResult> => {
  try {
    // Valider le fichier
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Déterminer le bucket selon le type de document
    const bucket = documentType === 'tableau_amortissement' 
      ? 'tableaux-amortissement' 
      : 'documents-juridiques';

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${userId}/${bienId}/${documentType}/${fileName}`;

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload:', uploadError);
      return {
        success: false,
        error: 'Erreur lors de l\'upload du fichier'
      };
    }

    // Obtenir l'URL du fichier
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // Enregistrer la référence en base de données
    const { data: docData, error: docError } = await supabase
      .from('bien_documents')
      .insert({
        bien_id: bienId,
        user_id: userId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single();

    if (docError) {
      console.error('Erreur sauvegarde document:', docError);
      // Supprimer le fichier uploadé en cas d'erreur
      await supabase.storage.from(bucket).remove([filePath]);
      return {
        success: false,
        error: 'Erreur lors de l\'enregistrement du document'
      };
    }

    return {
      success: true,
      file: {
        id: docData.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl
      }
    };

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de l\'upload'
    };
  }
};

export const uploadComptabiliteAttachment = async (
  file: File,
  comptabiliteEntryId: string,
  userId: string
): Promise<DocumentUploadResult> => {
  try {
    // Valider le fichier
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${userId}/${comptabiliteEntryId}/${fileName}`;

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('comptabilite-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload:', uploadError);
      return {
        success: false,
        error: 'Erreur lors de l\'upload du fichier'
      };
    }

    // Obtenir l'URL du fichier
    const { data: urlData } = supabase.storage
      .from('comptabilite-attachments')
      .getPublicUrl(filePath);

    // Enregistrer la référence en base de données
    const { data: attachmentData, error: attachmentError } = await supabase
      .from('comptabilite_entry_attachments')
      .insert({
        comptabilite_entry_id: comptabiliteEntryId,
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single();

    if (attachmentError) {
      console.error('Erreur sauvegarde attachment:', attachmentError);
      // Supprimer le fichier uploadé en cas d'erreur
      await supabase.storage.from('comptabilite-attachments').remove([filePath]);
      return {
        success: false,
        error: 'Erreur lors de l\'enregistrement de la pièce jointe'
      };
    }

    return {
      success: true,
      file: {
        id: attachmentData.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl
      }
    };

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de l\'upload'
    };
  }
};

export const deleteDocument = async (
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Récupérer les informations du document
    const { data: docData, error: fetchError } = await supabase
      .from('bien_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !docData) {
      return {
        success: false,
        error: 'Document non trouvé'
      };
    }

    // Déterminer le bucket
    const bucket = docData.document_type === 'tableau_amortissement' 
      ? 'tableaux-amortissement' 
      : 'documents-juridiques';

    // Supprimer le fichier du storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([docData.file_path]);

    if (storageError) {
      console.error('Erreur suppression storage:', storageError);
    }

    // Supprimer la référence en base
    const { error: dbError } = await supabase
      .from('bien_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('Erreur suppression DB:', dbError);
      return {
        success: false,
        error: 'Erreur lors de la suppression du document'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de la suppression'
    };
  }
};

export const deleteComptabiliteAttachment = async (
  attachmentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Récupérer les informations de la pièce jointe
    const { data: attachmentData, error: fetchError } = await supabase
      .from('comptabilite_entry_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !attachmentData) {
      return {
        success: false,
        error: 'Pièce jointe non trouvée'
      };
    }

    // Supprimer le fichier du storage
    const { error: storageError } = await supabase.storage
      .from('comptabilite-attachments')
      .remove([attachmentData.file_path]);

    if (storageError) {
      console.error('Erreur suppression storage:', storageError);
    }

    // Supprimer la référence en base
    const { error: dbError } = await supabase
      .from('comptabilite_entry_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('Erreur suppression DB:', dbError);
      return {
        success: false,
        error: 'Erreur lors de la suppression de la pièce jointe'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de la suppression'
    };
  }
};

export const getDocumentsByBien = async (
  bienId: string,
  userId: string
): Promise<{ success: boolean; documents?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('bien_documents')
      .select('*')
      .eq('bien_id', bienId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération documents:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des documents'
      };
    }

    return {
      success: true,
      documents: data || []
    };

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de la récupération'
    };
  }
};

export const getAttachmentsByComptabiliteEntry = async (
  comptabiliteEntryId: string,
  userId: string
): Promise<{ success: boolean; attachments?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('comptabilite_entry_attachments')
      .select('*')
      .eq('comptabilite_entry_id', comptabiliteEntryId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération pièces jointes:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des pièces jointes'
      };
    }

    return {
      success: true,
      attachments: data || []
    };

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de la récupération'
    };
  }
};