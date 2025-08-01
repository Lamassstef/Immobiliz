import React, { useState, useEffect } from 'react';
import { Building, X, Plus, Loader2, AlertCircle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import FileUploadZone from './FileUploadZone';
import { getDocumentsByBien } from '../lib/fileUpload';

interface Bien {
  id: string;
  denomination: string;
  type_bien: string;
  droit_propriete: string;
  tva: string;
  surface: number | null;
  usage_personnel: string;
  type_acquisition: string;
  date_acquisition: string | null;
  date_mise_en_location: string | null;
  emprunt: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  denomination: string;
  type_bien: string;
  droit_propriete: string;
  tva: string;
  surface: string;
  usage_personnel: string;
  type_acquisition: string;
  date_acquisition: string;
  date_mise_en_location: string;
  emprunt: string;
}

const MesBiensPage: React.FC = () => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBien, setEditingBien] = useState<Bien | null>(null);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // États pour les documents
  const [documents, setDocuments] = useState<{ [key: string]: any[] }>({});
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    denomination: '',
    type_bien: 'Maison',
    droit_propriete: 'Pleine propriété',
    tva: 'Non soumis à TVA',
    surface: '',
    usage_personnel: 'Non',
    type_acquisition: 'Acquisition',
    date_acquisition: '',
    date_mise_en_location: '',
    emprunt: 'Non'
  });

  // Charger les biens au montage du composant
  useEffect(() => {
    if (user) {
      loadBiens();
    }
  }, [user]);

  // Charger les documents quand on édite un bien
  useEffect(() => {
    if (editingBien && user) {
      loadDocuments(editingBien.id);
    }
  }, [editingBien, user]);

  const loadBiens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('biens')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des biens:', error);
        setError('Erreur lors du chargement des biens');
        return;
      }

      setBiens(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des biens');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (bienId: string) => {
    if (!user) return;

    try {
      setLoadingDocuments(true);
      const result = await getDocumentsByBien(bienId, user.id);
      
      if (result.success && result.documents) {
        // Organiser les documents par type
        const docsByType: { [key: string]: any[] } = {
          bail: [],
          attestation_propriete: [],
          releves_notaires: [],
          tableau_amortissement: []
        };

        result.documents.forEach(doc => {
          if (docsByType[doc.document_type]) {
            docsByType[doc.document_type].push(doc);
          }
        });

        setDocuments(docsByType);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const resetForm = () => {
    setFormData({
      denomination: '',
      type_bien: 'Maison',
      droit_propriete: 'Pleine propriété',
      tva: 'Non soumis à TVA',
      surface: '',
      usage_personnel: 'Non',
      type_acquisition: 'Acquisition',
      date_acquisition: '',
      date_mise_en_location: '',
      emprunt: 'Non'
    });
    setDocuments({
      bail: [],
      attestation_propriete: [],
      releves_notaires: [],
      tableau_amortissement: []
    });
    setError('');
    setSuccess('');
  };

  const handleAddClick = () => {
    resetForm();
    setEditingBien(null);
    setShowAddForm(true);
  };

  const handleEditClick = (bien: Bien) => {
    setFormData({
      denomination: bien.denomination,
      type_bien: bien.type_bien,
      droit_propriete: bien.droit_propriete,
      tva: bien.tva,
      surface: bien.surface?.toString() || '',
      usage_personnel: bien.usage_personnel,
      type_acquisition: bien.type_acquisition,
      date_acquisition: bien.date_acquisition || '',
      date_mise_en_location: bien.date_mise_en_location || '',
      emprunt: bien.emprunt
    });
    setEditingBien(bien);
    setShowAddForm(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingBien(null);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.denomination.trim()) {
      setError('La dénomination du bien est obligatoire');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const bienData = {
        denomination: formData.denomination.trim(),
        type_bien: formData.type_bien,
        droit_propriete: formData.droit_propriete,
        tva: formData.tva,
        surface: formData.surface ? parseFloat(formData.surface) : null,
        usage_personnel: formData.usage_personnel,
        type_acquisition: formData.type_acquisition,
        date_acquisition: formData.date_acquisition || null,
        date_mise_en_location: formData.date_mise_en_location || null,
        emprunt: formData.emprunt,
        user_id: user?.id
      };

      if (editingBien) {
        // Modification d'un bien existant
        const { error } = await supabase
          .from('biens')
          .update(bienData)
          .eq('id', editingBien.id);

        if (error) {
          console.error('Erreur lors de la modification:', error);
          setError('Erreur lors de la modification du bien');
          return;
        }

        setSuccess('Bien modifié avec succès !');
      } else {
        // Création d'un nouveau bien
        const { error } = await supabase
          .from('biens')
          .insert([bienData]);

        if (error) {
          console.error('Erreur lors de la création:', error);
          setError('Erreur lors de la création du bien');
          return;
        }

        setSuccess('Bien ajouté avec succès !');
      }

      // Recharger la liste des biens
      await loadBiens();

      // Fermer le formulaire après un délai
      setTimeout(() => {
        setShowAddForm(false);
        setEditingBien(null);
        resetForm();
      }, 1500);

    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la sauvegarde du bien');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bien: Bien) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le bien "${bien.denomination}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('biens')
        .delete()
        .eq('id', bien.id);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression du bien');
        return;
      }

      setSuccess('Bien supprimé avec succès !');
      await loadBiens();

      // Effacer le message après 3 secondes
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la suppression du bien');
    }
  };

  const handleFileUploadSuccess = (documentType: string) => {
    // Recharger les documents après un upload réussi
    if (editingBien) {
      loadDocuments(editingBien.id);
    }
  };

  const handleFileDeleteSuccess = (documentType: string) => {
    // Recharger les documents après une suppression réussie
    if (editingBien) {
      loadDocuments(editingBien.id);
    }
  };

  const renderBiensList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <Building className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes biens</h1>
            <p className="text-sm text-gray-600">
              Gérez vos propriétés immobilières louées en meublé, leurs revenus et leurs charges.
            </p>
          </div>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un bien</span>
        </button>
      </div>

      {/* Messages de succès/erreur */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Liste des biens */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des biens...</p>
            </div>
          </div>
        ) : biens.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun bien enregistré</h3>
            <p className="text-gray-600 mb-6">
              Commencez par ajouter votre premier bien immobilier.
            </p>
            <button
              onClick={handleAddClick}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter mon premier bien</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {biens.map((bien) => (
              <div key={bien.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{bien.denomination}</h3>
                    <p className="text-sm text-gray-600">Type : {bien.type_bien}</p>
                    {bien.surface && (
                      <p className="text-sm text-gray-600">Surface : {bien.surface} m²</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    Créé le {new Date(bien.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(bien)}
                      className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bien)}
                      className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section tableaux d'amortissement globaux */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes tableaux d'amortissement d'emprunt</h3>
        <FileUploadZone
          bienId="global" // ID spécial pour les documents globaux
          documentType="tableau_amortissement"
          label=""
          onUploadSuccess={() => {}}
          onDeleteSuccess={() => {}}
        />
      </div>
    </div>
  );

  const renderAddForm = () => (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingBien ? 'Modifier le bien' : 'Nouveau bien'}
            </h1>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>{editingBien ? 'Modifier le bien' : 'Ajouter le bien'}</span>
        </button>
      </div>

      {/* Messages de succès/erreur */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-8">
          {/* Informations générales */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Informations générales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dénomination du bien *
                </label>
                <input
                  type="text"
                  name="denomination"
                  value={formData.denomination}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de bien
                </label>
                <select
                  name="type_bien"
                  value={formData.type_bien}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="Maison">Maison</option>
                  <option value="Appartement">Appartement</option>
                  <option value="Immeuble de rapport">Immeuble de rapport</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Droit de propriété
                </label>
                <select
                  name="droit_propriete"
                  value={formData.droit_propriete}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="Pleine propriété">Pleine propriété</option>
                  <option value="Usufruit">Usufruit</option>
                  <option value="Nue propriété">Nue propriété</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TVA
                </label>
                <select
                  name="tva"
                  value={formData.tva}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="Soumis à TVA">Soumis à TVA</option>
                  <option value="Non soumis à TVA">Non soumis à TVA</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surface (m²)
                </label>
                <input
                  type="number"
                  name="surface"
                  value={formData.surface}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bien à usage personnel ?
                </label>
                <select
                  name="usage_personnel"
                  value={formData.usage_personnel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'acquisition
                </label>
                <select
                  name="type_acquisition"
                  value={formData.type_acquisition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="Acquisition">Acquisition</option>
                  <option value="Donation/héritage">Donation/héritage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avez-vous emprunté ?
                </label>
                <select
                  name="emprunt"
                  value={formData.emprunt}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'acquisition
                </label>
                <input
                  type="date"
                  name="date_acquisition"
                  value={formData.date_acquisition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de 1ère location
                </label>
                <input
                  type="date"
                  name="date_mise_en_location"
                  value={formData.date_mise_en_location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Documents juridiques - seulement en mode édition */}
          {editingBien && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Documents juridiques</h3>
              
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                  <span className="text-gray-600">Chargement des documents...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <FileUploadZone
                    bienId={editingBien.id}
                    documentType="bail"
                    label="Bail"
                    existingFiles={documents.bail || []}
                    onUploadSuccess={() => handleFileUploadSuccess('bail')}
                    onDeleteSuccess={() => handleFileDeleteSuccess('bail')}
                    disabled={submitting}
                  />

                  <FileUploadZone
                    bienId={editingBien.id}
                    documentType="attestation_propriete"
                    label="Attestation de propriété"
                    existingFiles={documents.attestation_propriete || []}
                    onUploadSuccess={() => handleFileUploadSuccess('attestation_propriete')}
                    onDeleteSuccess={() => handleFileDeleteSuccess('attestation_propriete')}
                    disabled={submitting}
                  />

                  <FileUploadZone
                    bienId={editingBien.id}
                    documentType="releves_notaires"
                    label="Relevés de compte définitifs des notaires"
                    existingFiles={documents.releves_notaires || []}
                    onUploadSuccess={() => handleFileUploadSuccess('releves_notaires')}
                    onDeleteSuccess={() => handleFileDeleteSuccess('releves_notaires')}
                    disabled={submitting}
                  />

                  <FileUploadZone
                    bienId={editingBien.id}
                    documentType="tableau_amortissement"
                    label="Tableaux d'amortissement d'emprunt"
                    existingFiles={documents.tableau_amortissement || []}
                    onUploadSuccess={() => handleFileUploadSuccess('tableau_amortissement')}
                    onDeleteSuccess={() => handleFileDeleteSuccess('tableau_amortissement')}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>
          )}

          {/* Message pour les nouveaux biens */}
          {!editingBien && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Note :</strong> Les documents juridiques pourront être ajoutés après la création du bien.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return showAddForm ? renderAddForm() : renderBiensList();
};

export default MesBiensPage;