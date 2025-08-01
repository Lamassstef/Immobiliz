import React, { useCallback, useState } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { uploadDocument, deleteDocument, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '../lib/fileUpload';
import { useAuth } from '../contexts/AuthContext';

interface FileUploadZoneProps {
  bienId: string;
  documentType: 'bail' | 'attestation_propriete' | 'releves_notaires' | 'tableau_amortissement';
  label: string;
  existingFiles?: any[];
  onUploadSuccess?: (file: any) => void;
  onDeleteSuccess?: (fileId: string) => void;
  disabled?: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  bienId,
  documentType,
  label,
  existingFiles = [],
  onUploadSuccess,
  onDeleteSuccess,
  disabled = false
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;

    clearMessages();
    setUploading(true);

    try {
      const file = files[0]; // Prendre seulement le premier fichier

      const result = await uploadDocument(file, bienId, documentType, user.id);

      if (result.success && result.file) {
        setSuccess('Fichier uploadé avec succès !');
        onUploadSuccess?.(result.file);
        
        // Effacer le message de succès après 3 secondes
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Erreur lors de l\'upload');
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      setError('Erreur inattendue lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }, [bienId, documentType, user, onUploadSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect, disabled, uploading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleDelete = async (fileId: string) => {
    if (!user || !confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      const result = await deleteDocument(fileId, user.id);
      
      if (result.success) {
        setSuccess('Fichier supprimé avec succès !');
        onDeleteSuccess?.(fileId);
        
        // Effacer le message de succès après 3 secondes
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur inattendue lors de la suppression');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeLabel = (mimeType: string) => {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/msword': 'DOC',
      'image/jpeg': 'JPG',
      'image/png': 'PNG'
    };
    return typeMap[mimeType] || 'Fichier';
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Messages d'état */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Zone d'upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : disabled || uploading
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          onChange={handleInputChange}
          accept={Object.values(ACCEPTED_FILE_TYPES).join(',')}
          disabled={disabled || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="space-y-2">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
              <p className="text-sm text-blue-600">Upload en cours...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Glissez-déposez un fichier ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-500">
                  Formats acceptés : PDF, DOC, DOCX, JPG, PNG
                </p>
                <p className="text-xs text-gray-500">
                  Taille maximale : {formatFileSize(MAX_FILE_SIZE)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Liste des fichiers existants */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Fichiers uploadés :</h4>
          <div className="space-y-2">
            {existingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {getFileTypeLabel(file.mime_type)} • {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                  title="Supprimer le fichier"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;