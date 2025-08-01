import React, { useState, useEffect } from 'react';
import { User, Upload, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ProfileData {
  nom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  adresse: string;
  code_postal: string;
  mode_detention: string;
  type_location: string;
  date_debut_activite: string;
  date_cloture_comptable: string;
  numero_siret: string;
}

const MonComptePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('infos-generales');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<ProfileData>({
    nom: '',
    prenom: '',
    sexe: 'Masculin',
    telephone: '',
    adresse: '',
    code_postal: '',
    mode_detention: 'Indivision',
    type_location: 'Longue durée',
    date_debut_activite: '',
    date_cloture_comptable: '31/12',
    numero_siret: ''
  });

  const [passwordData, setPasswordData] = useState({
    nouveauMotDePasse: '',
    confirmerMotDePasse: ''
  });

  // Charger les données du profil au montage du composant
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du profil:', error);
        setErrorMessage('Erreur lors du chargement des données');
        return;
      }

      if (data) {
        setFormData({
          nom: data.nom || '',
          prenom: data.prenom || '',
          sexe: data.sexe || 'Masculin',
          telephone: data.telephone || '',
          adresse: data.adresse || '',
          code_postal: data.code_postal || '',
          mode_detention: data.mode_detention || 'Indivision',
          type_location: data.type_location || 'Longue durée',
          date_debut_activite: data.date_debut_activite || '',
          date_cloture_comptable: data.date_cloture_comptable || '31/12',
          numero_siret: data.numero_siret || ''
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setErrorMessage('Erreur lors du chargement des données');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      setErrorMessage('Le nom est obligatoire');
      return false;
    }
    if (!formData.prenom.trim()) {
      setErrorMessage('Le prénom est obligatoire');
      return false;
    }
    if (!formData.adresse.trim()) {
      setErrorMessage('L\'adresse est obligatoire');
      return false;
    }
    if (!formData.date_debut_activite) {
      setErrorMessage('La date de début d\'activité est obligatoire');
      return false;
    }
    if (!formData.numero_siret.trim()) {
      setErrorMessage('Le numéro SIRET est obligatoire');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        setErrorMessage('Erreur lors de la sauvegarde des données');
        return;
      }

      setSuccessMessage('Informations mises à jour avec succès !');
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error('Erreur:', error);
      setErrorMessage('Erreur lors de la sauvegarde des données');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.nouveauMotDePasse) {
      setErrorMessage('Le nouveau mot de passe est obligatoire');
      return;
    }

    if (passwordData.nouveauMotDePasse !== passwordData.confirmerMotDePasse) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.nouveauMotDePasse.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const { error } = await supabase.auth.updateUser({
        password: passwordData.nouveauMotDePasse
      });

      if (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        setErrorMessage('Erreur lors du changement de mot de passe');
        return;
      }

      setSuccessMessage('Mot de passe modifié avec succès !');
      setPasswordData({
        nouveauMotDePasse: '',
        confirmerMotDePasse: ''
      });

      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error('Erreur:', error);
      setErrorMessage('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const renderActionButton = (isTop = false) => (
    <button 
      onClick={activeTab === 'infos-generales' ? handleSaveProfile : handleChangePassword}
      disabled={loading}
      className={`bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 ${
        isTop ? 'ml-auto' : ''
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCircle className="w-4 h-4" />
      )}
      <span>
        {activeTab === 'infos-generales' ? 'Valider les modifications' : 'Changer mon mot de passe'}
      </span>
    </button>
  );

  const renderInfosGenerales = () => (
    <div className="space-y-8">
      {/* Informations personnelles */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-6">Informations personnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom *
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom *
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sexe
            </label>
            <select
              name="sexe"
              value={formData.sexe}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Masculin">Masculin</option>
              <option value="Féminin">Féminin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone
            </label>
            <div className="flex">
              <div className="flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                <span className="text-lg">🇫🇷</span>
              </div>
              <input
                type="text"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+33 (0)6 33 87 89 75"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse de résidence principale *
            </label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code postal
            </label>
            <input
              type="text"
              name="code_postal"
              value={formData.code_postal}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Photo de profil */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo de profil
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Ajouter un fichier (.pdf, .docx, .png, .jpg)
            </p>
            <p className="text-xs text-gray-500">
              (5Mo Maximum)
            </p>
          </div>
        </div>
      </div>

      {/* Juridique */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-6">Juridique</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de détention
            </label>
            <select
              name="mode_detention"
              value={formData.mode_detention}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Nom propre">Nom propre</option>
              <option value="Indivision">Indivision</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de location
            </label>
            <select
              name="type_location"
              value={formData.type_location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Longue durée">Longue durée</option>
              <option value="Courte durée">Courte durée</option>
              <option value="Mixte">Mixte</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début d'activité *
            </label>
            <input
              type="date"
              name="date_debut_activite"
              value={formData.date_debut_activite}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de clôture comptable (jour/mois) *
            </label>
            <input
              type="text"
              name="date_cloture_comptable"
              value={formData.date_cloture_comptable}
              onChange={handleInputChange}
              placeholder="31/12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Siret *
          </label>
          <input
            type="text"
            name="numero_siret"
            value={formData.numero_siret}
            onChange={handleInputChange}
            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Statut de loueur en meublé */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-6">Votre statut de loueur en meublé</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="statutLoueur"
              value="inscription-cga"
              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
            />
            <span className="ml-3 text-sm text-gray-700">Inscription au CGA</span>
          </label>
        </div>
      </div>

      {/* URSSAF */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-6">URSSAF</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="urssaf"
              value="adherent"
              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
            />
            <span className="ml-3 text-sm text-gray-700">Adhérent</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecurite = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sécurité</h3>
        <p className="text-sm text-gray-600 mb-8">
          Changez ici votre mot de passe. Pour changer votre adresse e-mail, contactez votre cabinet.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="nouveauMotDePasse"
                value={passwordData.nouveauMotDePasse}
                onChange={handlePasswordChange}
                placeholder="Nouveau mot de passe"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmerMotDePasse"
                value={passwordData.confirmerMotDePasse}
                onChange={handlePasswordChange}
                placeholder="Confirmez votre nouveau mot de passe"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'action */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>
            <p className="text-sm text-gray-600">
              Cet onglet récapitule vos informations personnelles et celles sur votre statut de loueur en meublé.
            </p>
          </div>
        </div>
        {renderActionButton(true)}
      </div>

      {/* Messages de succès/erreur */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('infos-generales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'infos-generales'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Infos générales
          </button>
          <button
            onClick={() => setActiveTab('securite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'securite'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sécurité
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {activeTab === 'infos-generales' ? renderInfosGenerales() : renderSecurite()}
        
        {/* Action Button en bas */}
        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default MonComptePage;