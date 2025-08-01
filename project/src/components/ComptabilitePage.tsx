import React, { useState, useEffect } from 'react';
import { Calculator, Plus, ChevronLeft, Trash2, Paperclip, Camera, Upload, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadComptabiliteAttachment, deleteComptabiliteAttachment, getAttachmentsByComptabiliteEntry } from '../lib/fileUpload';
import BilanSuccessPage from './BilanSuccessPage';

interface LayoutProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

interface ComptabilityEntry {
  id: string;
  date: string;
  affectation: string;
  libelle: string;
  encaissement: number | null;
  decaissement: number | null;
  attachments?: any[];
}

interface Bien {
  id: string;
  denomination: string;
}

const ComptabilitePage: React.FC<LayoutProps> = ({ activeSection, setActiveSection }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [bilanStarted, setBilanStarted] = useState(false);
  const [showComptabilityTable, setShowComptabilityTable] = useState(false);
  const [showBilanSuccess, setShowBilanSuccess] = useState(false);
  
  // États pour les étapes
  const [hasNewProperty, setHasNewProperty] = useState<boolean | null>(null);
  const [showNewPropertyModal, setShowNewPropertyModal] = useState(false);
  const [hasMoved, setHasMoved] = useState<boolean | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveData, setMoveData] = useState({ adresse: '', codePostal: '' });
  const [declarationYear, setDeclarationYear] = useState('');
  const [hasAcceptedConditions, setHasAcceptedConditions] = useState(false);

  // États pour le tableau de comptabilité
  const [selectedProperty, setSelectedProperty] = useState('');
  const [entries, setEntries] = useState<ComptabilityEntry[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFileUploadModal, setShowFileUploadModal] = useState<string | null>(null);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDateErrorModal, setShowDateErrorModal] = useState(false);
  const [showMissingFluxModal, setShowMissingFluxModal] = useState(false);
  const [missingFluxBiens, setMissingFluxBiens] = useState<string[]>([]);

  // États pour la gestion des données
  const [properties, setProperties] = useState<Bien[]>([]);
  const [currentBilan, setCurrentBilan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // États pour les années disponibles
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);

  // Calcul des années disponibles (3 ans maximum en arrière)
  const currentYear = new Date().getFullYear();

  // Liste des affectations possibles
  const affectations = [
    '',
    'Appels de Fonds/Charges de copropriété',
    'Assurance Emprunteur (Hors échéancier d\'emprunt)',
    'Assurance PNO',
    'Autre',
    'Caution',
    'Cotisation foncière des entreprises (CFE)',
    'Eau',
    'Echeance emprunt',
    'Electricité',
    'Entretien du bien/Nettoyage',
    'Frais bancaires',
    'Frais de comptabilité',
    'Frais postaux',
    'Gaz',
    'Internet',
    'Loyer',
    'Mobilier',
    'Publicité/Annonces',
    'Remboursement Assurance',
    'Taxe foncière',
    'Travaux'
  ];

  // Affectations nécessitant une pièce jointe obligatoire
  const affectationsAvecPieceJointeObligatoire = [
    'Appels de Fonds/Charges de copropriété',
    'Autre',
    'Cotisation foncière des entreprises (CFE)',
    'Entretien du bien/Nettoyage',
    'Frais de comptabilité',
    'Frais postaux',
    'Internet',
    'Mobilier',
    'Publicité/Annonces',
    'Remboursement Assurance',
    'Taxe foncière',
    'Travaux'
  ];

  // Charger les biens au montage du composant
  useEffect(() => {
    if (user) {
      loadProperties();
      checkExistingBilan();
    }
  }, [user]);

  // Charger les entrées quand on change de bien
  useEffect(() => {
    if (currentBilan && selectedProperty) {
      loadEntries();
    }
  }, [currentBilan, selectedProperty]);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('biens')
        .select('id, denomination')
        .eq('user_id', user?.id)
        .order('denomination');

      if (error) {
        console.error('Erreur chargement biens:', error);
        return;
      }

      setProperties(data || []);
      if (data && data.length > 0) {
        setSelectedProperty(data[0].id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const checkExistingBilan = async () => {
    try {
      const { data, error } = await supabase
        .from('bilans')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'en_cours')
        .limit(1);

      if (error) {
        console.error('Erreur vérification bilan:', error);
        return;
      }

      if (data && data.length > 0) {
        setCurrentBilan(data[0]);
        setDeclarationYear(data[0].year);
        setShowComptabilityTable(true);
        setBilanStarted(true);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadAvailableYears = async () => {
    try {
      setLoadingYears(true);
      
      // Récupérer toutes les années déjà utilisées par l'utilisateur
      const { data, error } = await supabase
        .from('bilans')
        .select('year')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Erreur chargement années:', error);
        setError('Erreur lors de la vérification des années disponibles');
        return;
      }

      // Extraire les années déjà utilisées
      const usedYears = data?.map(bilan => parseInt(bilan.year)) || [];
      
      // Calculer les années disponibles (3 dernières années - années déjà utilisées)
      const allPossibleYears = [];
      for (let i = 0; i < 3; i++) {
        allPossibleYears.push(currentYear - i);
      }
      
      const available = allPossibleYears.filter(year => !usedYears.includes(year));
      setAvailableYears(available);

    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la vérification des années disponibles');
    } finally {
      setLoadingYears(false);
    }
  };

  const loadEntries = async () => {
    if (!currentBilan || !selectedProperty) return;

    try {
      const { data, error } = await supabase
        .from('comptabilite_entries')
        .select('*')
        .eq('bilan_id', currentBilan.id)
        .eq('bien_id', selectedProperty)
        .order('created_at');

      if (error) {
        console.error('Erreur chargement entrées:', error);
        return;
      }

      // Charger les pièces jointes pour chaque entrée
      const entriesWithAttachments = await Promise.all(
        (data || []).map(async (entry) => {
          const attachmentsResult = await getAttachmentsByComptabiliteEntry(entry.id, user!.id);
          return {
            ...entry,
            attachments: attachmentsResult.success ? attachmentsResult.attachments : []
          };
        })
      );

      setEntries(entriesWithAttachments);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const createBilan = async (year: string) => {
    try {
      const { data, error } = await supabase
        .from('bilans')
        .insert({
          user_id: user?.id,
          year: year,
          status: 'en_cours'
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création bilan:', error);
        setError('Erreur lors de la création du bilan');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la création du bilan');
      return null;
    }
  };

  const saveEntry = async (entry: ComptabilityEntry) => {
    if (!currentBilan || !selectedProperty) return;

    // ✅ VALIDATION: Empêcher la sauvegarde si la date n'est pas renseignée
    if (!entry.date || entry.date.trim() === '') {
      console.log('Sauvegarde ignorée: date manquante pour l\'entrée', entry.id);
      return;
    }

    try {
      // Validation et correction des données pour respecter la contrainte DB
      let validatedEncaissement = entry.encaissement;
      let validatedDecaissement = entry.decaissement;

      // Convertir 0 en null pour les deux champs
      if (validatedEncaissement === 0) validatedEncaissement = null;
      if (validatedDecaissement === 0) validatedDecaissement = null;

      // Cas 1: Si les deux sont null, mettre encaissement à 0 et decaissement à null
      if (validatedEncaissement === null && validatedDecaissement === null) {
        validatedEncaissement = 0;
        validatedDecaissement = null;
      }
      // Cas 2: Si les deux ont une valeur, garder seulement encaissement
      else if (validatedEncaissement !== null && validatedDecaissement !== null) {
        validatedDecaissement = null;
      }

      const entryData = {
        user_id: user?.id,
        bilan_id: currentBilan.id,
        bien_id: selectedProperty,
        date: entry.date || null,
        affectation: entry.affectation || '',
        libelle: entry.libelle || '',
        encaissement: validatedEncaissement,
        decaissement: validatedDecaissement
      };

      if (entry.id.startsWith('temp_')) {
        // Nouvelle entrée
        const { data, error } = await supabase
          .from('comptabilite_entries')
          .insert(entryData)
          .select()
          .single();

        if (error) {
          console.error('Erreur création entrée:', error);
          return;
        }

        // Mettre à jour l'ID local et les valeurs validées
        setEntries(prev => prev.map(e => 
          e.id === entry.id ? { 
            ...e, 
            id: data.id,
            encaissement: validatedEncaissement,
            decaissement: validatedDecaissement
          } : e
        ));
      } else {
        // Mise à jour d'une entrée existante
        const { error } = await supabase
          .from('comptabilite_entries')
          .update(entryData)
          .eq('id', entry.id);

        if (error) {
          console.error('Erreur mise à jour entrée:', error);
          return;
        }

        // Mettre à jour les valeurs validées dans l'état local
        setEntries(prev => prev.map(e => 
          e.id === entry.id ? { 
            ...e,
            encaissement: validatedEncaissement,
            decaissement: validatedDecaissement
          } : e
        ));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const validateDateForYear = (date: string, year: string): boolean => {
    if (!date) return true; // Date vide autorisée
    
    const entryYear = new Date(date).getFullYear().toString();
    return entryYear === year;
  };

  const checkMissingFluxForBiens = async () => {
    if (!currentBilan || !user) return [];

    try {
      // Récupérer toutes les entrées comptables pour ce bilan
      const { data: allEntries, error } = await supabase
        .from('comptabilite_entries')
        .select(`
          bien_id,
          biens!inner(denomination)
        `)
        .eq('bilan_id', currentBilan.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erreur vérification flux:', error);
        return [];
      }

      // Créer un Set des biens qui ont des entrées
      const biensWithEntries = new Set(allEntries?.map(entry => entry.bien_id) || []);
      
      // Trouver les biens sans entrées
      const biensWithoutEntries = properties.filter(bien => !biensWithEntries.has(bien.id));
      
      return biensWithoutEntries.map(bien => bien.denomination);
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  };

  const handleStartNewBilan = () => {
    setBilanStarted(true);
    setCurrentStep(1);
  };

  const handleStep1Response = (response: boolean) => {
    setHasNewProperty(response);
    if (response) {
      setShowNewPropertyModal(true);
    } else {
      setCurrentStep(2);
    }
  };

  const handleNewPropertyContinue = () => {
    setShowNewPropertyModal(false);
    setActiveSection('mes-biens');
  };

  const handleNewPropertyCancel = () => {
    setShowNewPropertyModal(false);
    setHasNewProperty(null);
  };

  const handleStep2Response = (response: boolean) => {
    setHasMoved(response);
    if (response) {
      setShowMoveModal(true);
    } else {
      setCurrentStep(3);
      // Charger les années disponibles quand on arrive à l'étape 3
      loadAvailableYears();
    }
  };

  const handleMoveSubmit = () => {
    setShowMoveModal(false);
    setCurrentStep(3);
    // Charger les années disponibles quand on arrive à l'étape 3
    loadAvailableYears();
  };

  const handleMoveCancel = () => {
    setShowMoveModal(false);
    setHasMoved(null);
  };

  const handleStep3Continue = () => {
    if (declarationYear) {
      setCurrentStep(4);
    }
  };

  const handleStep4Continue = async () => {
    if (hasAcceptedConditions) {
      setLoading(true);
      const bilan = await createBilan(declarationYear);
      if (bilan) {
        setCurrentBilan(bilan);
        setShowComptabilityTable(true);
      }
      setLoading(false);
    }
  };

  const goBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) {
        setHasNewProperty(null);
      } else if (currentStep === 3) {
        setHasMoved(null);
        setAvailableYears([]); // Reset des années disponibles
        setDeclarationYear(''); // Reset de l'année sélectionnée
      } else if (currentStep === 4) {
        setDeclarationYear('');
      }
    }
  };

  const handleAddEntry = () => {
    const newEntry: ComptabilityEntry = {
      id: `temp_${Date.now()}`,
      date: '',
      affectation: 'Loyer',
      libelle: 'Loyer',
      encaissement: 0, // ✅ Valeur par défaut pour respecter la contrainte DB
      decaissement: null, // ✅ L'autre reste à null
      attachments: []
    };
    setEntries([...entries, newEntry]);
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      if (!id.startsWith('temp_')) {
        const { error } = await supabase
          .from('comptabilite_entries')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Erreur suppression entrée:', error);
          return;
        }
      }

      setEntries(entries.filter(entry => entry.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Fonction pour mettre à jour l'état local avec gestion de l'exclusivité mutuelle
  const handleUpdateEntry = (id: string, field: keyof ComptabilityEntry, value: any) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const updatedEntry = { ...entry };
        
        if (field === 'encaissement') {
          const numValue = value === '' ? null : parseFloat(value);
          updatedEntry.encaissement = isNaN(numValue!) ? null : numValue;
          // Clear decaissement when encaissement is set
          if (numValue !== null && !isNaN(numValue!) && numValue !== 0) {
            updatedEntry.decaissement = null;
          }
        } else if (field === 'decaissement') {
          const numValue = value === '' ? null : parseFloat(value);
          updatedEntry.decaissement = isNaN(numValue!) ? null : numValue;
          // Clear encaissement when decaissement is set
          if (numValue !== null && !isNaN(numValue!) && numValue !== 0) {
            updatedEntry.encaissement = null;
          }
        } else {
          updatedEntry[field] = value;
          
          // Si on change l'affectation, on met à jour le libellé automatiquement
          if (field === 'affectation' && value) {
            updatedEntry.libelle = value;
          }
        }
        
        return updatedEntry;
      }
      return entry;
    }));
  };

  // Fonction pour gérer la perte de focus et déclencher la sauvegarde
  const handleFieldBlur = (id: string, field: keyof ComptabilityEntry, value: any) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    // Validation spéciale pour la date
    if (field === 'date' && value && !validateDateForYear(value, declarationYear)) {
      setShowDateErrorModal(true);
      // Réinitialiser la date dans l'état local
      setEntries(prev => prev.map(e => 
        e.id === id ? { ...e, date: '' } : e
      ));
      return;
    }

    // Sauvegarder si l'entrée a des données significatives
    if (entry.date || entry.affectation || entry.libelle || 
        entry.encaissement !== null || entry.decaissement !== null) {
      saveEntry(entry);
    }
  };

  const handleTerminateBilan = async () => {
    // Vérifier d'abord les pièces jointes manquantes
    const hasIncompleteEntries = entries.some(entry => {
      const needsPieceJointe = affectationsAvecPieceJointeObligatoire.includes(entry.affectation);
      const hasBasicFields = entry.date && entry.affectation && entry.libelle && 
                            (entry.encaissement !== null || entry.decaissement !== null);
      return needsPieceJointe && hasBasicFields && (!entry.attachments || entry.attachments.length === 0);
    });

    if (hasIncompleteEntries) {
      setShowErrorModal(true);
      return;
    }

    // Vérifier les flux manquants pour chaque bien
    const missingBiens = await checkMissingFluxForBiens();
    
    if (missingBiens.length > 0) {
      setMissingFluxBiens(missingBiens);
      setShowMissingFluxModal(true);
    } else {
      setShowTerminateModal(true);
    }
  };

  const handleConfirmTerminateBilan = async () => {
    try {
      setLoading(true);
      
      // Mettre à jour le statut du bilan
      const { error } = await supabase
        .from('bilans')
        .update({
          status: 'termine',
          date_termine: new Date().toISOString()
        })
        .eq('id', currentBilan.id);

      if (error) {
        console.error('Erreur terminaison bilan:', error);
        setError('Erreur lors de la terminaison du bilan');
        return;
      }

      // Fermer les modales
      setShowTerminateModal(false);
      setShowMissingFluxModal(false);
      
      // Afficher la page de succès
      setShowBilanSuccess(true);
      
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la terminaison du bilan');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = () => {
    // Reset de tous les états
    setShowBilanSuccess(false);
    setShowComptabilityTable(false);
    setBilanStarted(false);
    setCurrentStep(0);
    setCurrentBilan(null);
    setDeclarationYear('');
    setEntries([]);
    setSelectedProperty('');
    
    // Retour à l'accueil
    setActiveSection('home');
  };

  const handleFileUpload = async (entryId: string, file: File) => {
    try {
      const result = await uploadComptabiliteAttachment(file, entryId, user!.id);
      
      if (result.success) {
        // Recharger les pièces jointes pour cette entrée
        const attachmentsResult = await getAttachmentsByComptabiliteEntry(entryId, user!.id);
        
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, attachments: attachmentsResult.success ? attachmentsResult.attachments : [] }
            : entry
        ));
        
        setShowFileUploadModal(null);
      } else {
        setError(result.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      setError('Erreur lors de l\'upload');
    }
  };

  const handleCameraCapture = (entryId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(entryId, file);
      }
    };
    input.click();
  };

  const isEntryComplete = (entry: ComptabilityEntry) => {
    const hasBasicFields = entry.date && entry.affectation && entry.libelle && 
                          (entry.encaissement !== null || entry.decaissement !== null);
    
    const needsPieceJointe = affectationsAvecPieceJointeObligatoire.includes(entry.affectation);
    
    if (needsPieceJointe) {
      return hasBasicFields && entry.attachments && entry.attachments.length > 0;
    }
    
    return hasBasicFields;
  };

  const getEntryRowColor = (entry: ComptabilityEntry) => {
    const needsPieceJointe = affectationsAvecPieceJointeObligatoire.includes(entry.affectation);
    const hasBasicFields = entry.date && entry.affectation && entry.libelle && 
                          (entry.encaissement !== null || entry.decaissement !== null);
    
    if (isEntryComplete(entry)) {
      return 'bg-green-100 border-green-300 hover:bg-green-100';
    } else if (needsPieceJointe && hasBasicFields && (!entry.attachments || entry.attachments.length === 0)) {
      return 'bg-orange-100 border-orange-300 hover:bg-orange-100';
    }
    
    return 'hover:bg-gray-50';
  };

  const getPaperclipColor = (entry: ComptabilityEntry) => {
    if (entry.attachments && entry.attachments.length > 0) {
      return 'text-green-600 hover:text-green-700';
    }
    return 'text-gray-400 hover:text-gray-600';
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-1 ${currentStep >= step ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            {step < 4 && <div className={`w-16 h-1 ${currentStep > step ? 'bg-purple-600' : 'bg-gray-300'}`}></div>}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span className={currentStep >= 1 ? 'text-purple-600 font-medium' : ''}>Étape 1</span>
        <span className={currentStep >= 2 ? 'text-purple-600 font-medium' : ''}>Étape 2</span>
        <span className={currentStep >= 3 ? 'text-purple-600 font-medium' : ''}>Étape 3</span>
        <span className={currentStep >= 4 ? 'text-purple-600 font-medium' : ''}>Étape 4</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="bg-purple-50 rounded-xl p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setBilanStarted(false);
            setCurrentStep(0);
            setHasNewProperty(null);
          }}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
        <span className="text-sm text-gray-600">Étape 1/4</span>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
        Avez-vous acquis un nouveau bien cette année ?
      </h2>
      <p className="text-sm text-gray-600 text-center mb-8">
        (Si le bien a déjà été créé dans l'onglet "Mes Biens", cliquer sur "Non")
      </p>
      
      <div className="space-y-4">
        <button
          onClick={() => handleStep1Response(true)}
          className="w-full p-4 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-left"
        >
          Oui
        </button>
        <button
          onClick={() => handleStep1Response(false)}
          className="w-full p-4 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-left"
        >
          Non
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-purple-50 rounded-xl p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goBackStep}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
        <span className="text-sm text-gray-600">Étape 2/4</span>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 text-center mb-8">
        Avez-vous déménagé cette année ?
      </h2>
      
      <div className="space-y-4">
        <button
          onClick={() => handleStep2Response(true)}
          className="w-full p-4 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-left"
        >
          Oui
        </button>
        <button
          onClick={() => handleStep2Response(false)}
          className="w-full p-4 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-left"
        >
          Non
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-purple-50 rounded-xl p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goBackStep}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
        <span className="text-sm text-gray-600">Étape 3/4</span>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 text-center mb-8">
        Quelle année souhaitez-vous déclarer ?
      </h2>
      
      <div className="space-y-6">
        {loadingYears ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Vérification des années disponibles...</p>
          </div>
        ) : availableYears.length === 0 ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              Aucune année disponible
            </h3>
            <p className="text-orange-800 text-sm">
              Vous avez déjà créé des bilans pour toutes les années autorisées (3 dernières années). 
              Consultez vos archives pour voir vos bilans existants.
            </p>
          </div>
        ) : (
          <>
            <select
              value={declarationYear}
              onChange={(e) => setDeclarationYear(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Choisissez l'année</option>
              {availableYears.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Vous ne pouvez pas remonter plus de 3 ans en arrière. 
                Une fois un bilan terminé et clôturé, vous ne pourrez plus le modifier.
              </p>
            </div>
            
            <button
              onClick={handleStep3Continue}
              disabled={!declarationYear}
              className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                declarationYear
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continuer
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="bg-purple-50 rounded-xl p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goBackStep}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
        <span className="text-sm text-gray-600">Étape 4/4</span>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-8">
        Avant de commencer :
      </h2>
      
      <div className="space-y-4 mb-8 text-gray-700">
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold">•</span>
          <p>Munissez-vous de vos comptes bancaires où passent vos opérations liées à votre location meublée pour remplir ce tableau ainsi que les documents / factures associés.</p>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold">•</span>
          <p>Vous n'avez pas à saisir les frais de notaires.</p>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold">•</span>
          <p>Vos déblocages d'emprunt ne sont pas à renseigner.</p>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold">•</span>
          <p>Les échéances d'emprunt ne sont pas à séparer entre intérêts, assurance et capital amorti.</p>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold">•</span>
          <p>Ne pas réaliser de calculs globaux.</p>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold">•</span>
          <p>Si vous faites de la location courte durée type, airbnb, booking, contacter votre comptable, des spécificités sont à prendre en compte.</p>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold">•</span>
          <p>La date limite pour déposer le bilan est le 15 janvier 2026</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={hasAcceptedConditions}
            onChange={(e) => setHasAcceptedConditions(e.target.checked)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <span className="text-gray-700">J'ai bien pris connaissance des conditions</span>
        </label>
        
        <button
          onClick={handleStep4Continue}
          disabled={!hasAcceptedConditions || loading}
          className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
            hasAcceptedConditions && !loading
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Création du bilan...' : 'Continuer'}
        </button>
      </div>
    </div>
  );

  const renderComptabilityTable = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <Calculator className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
            <p className="text-sm text-gray-600">
              Cet onglet vous permet de saisir vos encaissements et décaissements et lier vos documents pour votre activité de loueur en meublé.
            </p>
          </div>
        </div>
        <button
          onClick={handleTerminateBilan}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Terminer le bilan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-700 mb-6">
          Vous pouvez remplir vos encaissements et décaissements de l'année à partir d'un template.
        </p>

        {/* Sélection des biens */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {properties.map((property) => (
              <button
                key={property.id}
                onClick={() => setSelectedProperty(property.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  selectedProperty === property.id
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {property.denomination}
              </button>
            ))}
          </div>
        </div>

        {/* Titre du tableau */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Encaissements et décaissements de l'année {declarationYear}
        </h3>

        {/* Bouton Ajouter une ligne */}
        <div className="mb-6">
          <button
            onClick={handleAddEntry}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une ligne</span>
          </button>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Affectation</th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Libellé</th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Encaissement</th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Décaissement</th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Pièce jointe</th>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className={`${getEntryRowColor(entry)}`}>
                  <td className="border border-gray-300 px-4 py-3">
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => handleUpdateEntry(entry.id, 'date', e.target.value)}
                      onBlur={(e) => handleFieldBlur(entry.id, 'date', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-transparent"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <select
                      value={entry.affectation}
                      onChange={(e) => handleUpdateEntry(entry.id, 'affectation', e.target.value)}
                      onBlur={(e) => handleFieldBlur(entry.id, 'affectation', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-transparent"
                    >
                      {affectations.map((affectation) => (
                        <option key={affectation} value={affectation}>
                          {affectation}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <input
                      type="text"
                      value={entry.libelle}
                      onChange={(e) => handleUpdateEntry(entry.id, 'libelle', e.target.value)}
                      onBlur={(e) => handleFieldBlur(entry.id, 'libelle', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-transparent"
                      placeholder="Libellé"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <input
                      type="number"
                      value={entry.encaissement || ''}
                      onChange={(e) => handleUpdateEntry(entry.id, 'encaissement', e.target.value)}
                      onBlur={(e) => handleFieldBlur(entry.id, 'encaissement', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <input
                      type="number"
                      value={entry.decaissement || ''}
                      onChange={(e) => handleUpdateEntry(entry.id, 'decaissement', e.target.value)}
                      onBlur={(e) => handleFieldBlur(entry.id, 'decaissement', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <button 
                      onClick={() => setShowFileUploadModal(entry.id)}
                      className={`transition-colors ${getPaperclipColor(entry)}`}
                      disabled={entry.id.startsWith('temp_')}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <button
                      onClick={() => setShowDeleteConfirm(entry.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    Aucune ligne ajoutée. Cliquez sur "Ajouter une ligne" pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bouton + pour ajouter une ligne après la dernière */}
        {entries.length > 0 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleAddEntry}
              className="w-8 h-8 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderFileUploadModal = () => (
    showFileUploadModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Ajouter une pièce jointe</h3>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    handleFileUpload(showFileUploadModal, file);
                  }
                };
                input.click();
              }}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">Sélectionner un fichier</span>
            </button>

            <button
              onClick={() => handleCameraCapture(showFileUploadModal)}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <Camera className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">Prendre une photo</span>
            </button>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowFileUploadModal(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    )
  );

  const renderDateErrorModal = () => (
    showDateErrorModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-semibold text-gray-900">Date non valide</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            Vous ne pouvez saisir que des opérations de l'année {declarationYear}. 
            Veuillez vérifier la date saisie.
          </p>

          <div className="flex justify-end">
            <button
              onClick={() => setShowDateErrorModal(false)}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    )
  );

  const renderNewPropertyModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Nouveau bien acquis</h3>
        
        <p className="text-gray-700 mb-6">
          Vous avez acquis un nouveau bien durant cette année. Vous allez être redirigé vers la création d'un nouveau bien. redirection dans l'onglet Mes biens
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleNewPropertyCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleNewPropertyContinue}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );

  const renderMoveModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Nouvelle adresse</h3>
        
        <p className="text-gray-700 mb-6">
          Veuillez renseigner votre nouvelle adresse
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse de résidence principale
            </label>
            <input
              type="text"
              value={moveData.adresse}
              onChange={(e) => setMoveData({...moveData, adresse: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code postal
            </label>
            <input
              type="text"
              value={moveData.codePostal}
              onChange={(e) => setMoveData({...moveData, codePostal: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleMoveCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleMoveSubmit}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );

  const renderDeleteConfirmModal = () => (
    showDeleteConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Confirmer la suppression</h3>
          
          <p className="text-gray-700 mb-6">
            Êtes-vous sûr de vouloir supprimer cette ligne ? Cette action est irréversible.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Annuler
            </button>
            <button
              onClick={() => handleDeleteEntry(showDeleteConfirm)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    )
  );

  const renderTerminateModal = () => (
    showTerminateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Terminer le bilan</h3>
          
          <p className="text-gray-700 mb-6">
            Êtes-vous sûr de vouloir terminer votre bilan de l'année {declarationYear} ?
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowTerminateModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Non
            </button>
            <button
              onClick={handleConfirmTerminateBilan}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? 'Terminaison...' : 'Oui'}
            </button>
          </div>
        </div>
      </div>
    )
  );

  const renderMissingFluxModal = () => (
    showMissingFluxModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full mx-4">
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-semibold text-gray-900">Flux manquants détectés</h3>
          </div>
          
          <p className="text-gray-700 mb-4">
            Êtes-vous sûr de vouloir terminer le bilan ? Vous n'avez pas ajouté de flux pour :
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <ul className="list-disc list-inside space-y-1">
              {missingFluxBiens.map((bienName, index) => (
                <li key={index} className="text-orange-800 font-medium">
                  {bienName}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Vous pouvez confirmer quand même ou annuler pour ajouter les flux manquants.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowMissingFluxModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmTerminateBilan}
              disabled={loading}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? 'Terminaison...' : 'Confirmer quand même'}
            </button>
          </div>
        </div>
      </div>
    )
  );

  const renderErrorModal = () => (
    showErrorModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-red-600 mb-6">Justificatifs manquants</h3>
          
          <p className="text-gray-700 mb-6">
            Il faut d'abord déposer les justificatifs obligatoires pour toutes les lignes marquées en orange avant de pouvoir terminer le bilan.
          </p>

          <div className="flex justify-end">
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    )
  );

  const renderNoBilanState = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <Calculator className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
          <p className="text-sm text-gray-600">
            Cet onglet vous permet de saisir vos encaissements et décaissements et lier vos documents pour votre activité de loueur en meublé.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <p className="text-gray-700 mb-8">
          Vous pouvez remplir vos encaissements et décaissements de l'année à partir d'un template.
        </p>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucun bilan en cours</h2>
            <p className="text-gray-600 mb-8">
              Vous n'avez pour l'instant aucun bilan en cours. Vous pouvez en commencer un en appuyant sur le bouton "Commencer un nouveau bilan".
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-16 text-center">
            <button
              onClick={handleStartNewBilan}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Commencer un nouveau bilan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepsInterface = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <Calculator className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
          <p className="text-sm text-gray-600">
            Cet onglet vous permet de saisir vos encaissements et décaissements et lier vos documents pour votre activité de loueur en meublé.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <p className="text-gray-700 mb-8">
          Vous pouvez remplir vos encaissements et décaissements de l'année à partir d'un template.
        </p>

        {renderProgressBar()}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );

  // Affichage de la page de succès
  if (showBilanSuccess) {
    return (
      <BilanSuccessPage 
        year={declarationYear} 
        onReturnHome={handleReturnHome}
      />
    );
  }

  // Logique d'affichage principal
  if (showComptabilityTable) {
    return (
      <>
        {renderComptabilityTable()}
        {renderFileUploadModal()}
        {renderDateErrorModal()}
        {renderDeleteConfirmModal()}
        {renderTerminateModal()}
        {renderMissingFluxModal()}
        {renderErrorModal()}
      </>
    );
  }

  return (
    <>
      {!bilanStarted ? renderNoBilanState() : renderStepsInterface()}
      {showNewPropertyModal && renderNewPropertyModal()}
      {showMoveModal && renderMoveModal()}
    </>
  );
};

export default ComptabilitePage;