import React, { useState, useEffect } from 'react';
import { Archive, ChevronDown, ChevronUp, Building, Calendar, Paperclip, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ArchivedEntry {
  id: string;
  date: string;
  affectation: string;
  libelle: string;
  encaissement: number | null;
  decaissement: number | null;
  attachments?: any[];
}

interface ArchivedBilan {
  id: string;
  year: string;
  dateTermine: string;
  biens: {
    [bienName: string]: ArchivedEntry[];
  };
}

const ArchivesPage: React.FC = () => {
  const { user } = useAuth();
  const [expandedBilan, setExpandedBilan] = useState<string | null>(null);
  const [selectedBien, setSelectedBien] = useState<{ [bilanId: string]: string }>({});
  const [archivedBilans, setArchivedBilans] = useState<ArchivedBilan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Charger les bilans archivés au montage du composant
  useEffect(() => {
    if (user) {
      loadArchivedBilans();
    }
  }, [user]);

  const loadArchivedBilans = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      // Récupérer les bilans terminés
      const { data: bilansData, error: bilansError } = await supabase
        .from('bilans')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'termine')
        .order('year', { ascending: false });

      if (bilansError) {
        console.error('Erreur chargement bilans:', bilansError);
        setError('Erreur lors du chargement des bilans archivés');
        return;
      }

      if (!bilansData || bilansData.length === 0) {
        setArchivedBilans([]);
        return;
      }

      // Pour chaque bilan, récupérer les entrées comptables et les biens
      const bilansWithData = await Promise.all(
        bilansData.map(async (bilan) => {
          // Récupérer les entrées comptables pour ce bilan
          const { data: entriesData, error: entriesError } = await supabase
            .from('comptabilite_entries')
            .select(`
              *,
              biens!inner(denomination)
            `)
            .eq('bilan_id', bilan.id)
            .order('date');

          if (entriesError) {
            console.error('Erreur chargement entrées:', entriesError);
            return null;
          }

          // Organiser les entrées par bien
          const biensByName: { [bienName: string]: ArchivedEntry[] } = {};
          
          if (entriesData) {
            entriesData.forEach((entry) => {
              const bienName = entry.biens.denomination;
              
              if (!biensByName[bienName]) {
                biensByName[bienName] = [];
              }

              biensByName[bienName].push({
                id: entry.id,
                date: entry.date || '',
                affectation: entry.affectation || '',
                libelle: entry.libelle || '',
                encaissement: entry.encaissement,
                decaissement: entry.decaissement,
                attachments: [] // Les pièces jointes pourraient être chargées si nécessaire
              });
            });
          }

          return {
            id: bilan.id,
            year: bilan.year,
            dateTermine: bilan.date_termine 
              ? new Date(bilan.date_termine).toLocaleDateString('fr-FR')
              : 'Date inconnue',
            biens: biensByName
          };
        })
      );

      // Filtrer les bilans null (en cas d'erreur)
      const validBilans = bilansWithData.filter(bilan => bilan !== null) as ArchivedBilan[];
      setArchivedBilans(validBilans);

    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des bilans archivés');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadArchivedBilans(true);
  };

  const toggleBilan = (bilanId: string) => {
    if (expandedBilan === bilanId) {
      setExpandedBilan(null);
    } else {
      setExpandedBilan(bilanId);
      // Sélectionner le premier bien par défaut
      const bilan = archivedBilans.find(b => b.id === bilanId);
      if (bilan) {
        const firstBien = Object.keys(bilan.biens)[0];
        if (firstBien) {
          setSelectedBien(prev => ({ ...prev, [bilanId]: firstBien }));
        }
      }
    }
  };

  const selectBien = (bilanId: string, bienName: string) => {
    setSelectedBien(prev => ({ ...prev, [bilanId]: bienName }));
  };

  const calculateTotals = (entries: ArchivedEntry[]) => {
    const totalEncaissements = entries.reduce((sum, entry) => sum + (entry.encaissement || 0), 0);
    const totalDecaissements = entries.reduce((sum, entry) => sum + (entry.decaissement || 0), 0);
    return { totalEncaissements, totalDecaissements };
  };

  const renderLoadingState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement des archives</h3>
      <p className="text-gray-600">
        Récupération de vos bilans terminés...
      </p>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center">
      <Archive className="w-16 h-16 text-red-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-red-900 mb-2">Erreur de chargement</h3>
      <p className="text-red-600 mb-4">{error}</p>
      <button
        onClick={loadArchivedBilans}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
      >
        Réessayer
      </button>
    </div>
  );

  const renderEmptyState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun bilan archivé</h3>
      <p className="text-gray-600">
        Vos bilans terminés apparaîtront ici une fois que vous aurez finalisé votre première déclaration.
      </p>
    </div>
  );

  const renderBilanCard = (bilan: ArchivedBilan) => {
    const isExpanded = expandedBilan === bilan.id;
    const bienNames = Object.keys(bilan.biens);
    
    if (bienNames.length === 0) {
      return null; // Ne pas afficher les bilans sans données
    }

    const currentSelectedBien = selectedBien[bilan.id] || bienNames[0];
    const currentEntries = bilan.biens[currentSelectedBien] || [];
    const { totalEncaissements, totalDecaissements } = calculateTotals(currentEntries);

    return (
      <div key={bilan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header du bilan */}
        <div 
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          onClick={() => toggleBilan(bilan.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Bilan {bilan.year}</h3>
                <p className="text-sm text-gray-600">Terminé le {bilan.dateTermine}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">{bienNames.length} bien(s)</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Contenu détaillé */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-6">
            {/* Sélection des biens */}
            {bienNames.length > 1 && (
              <div className="mb-6">
                <div className="flex space-x-2">
                  {bienNames.map((bienName) => (
                    <button
                      key={bienName}
                      onClick={() => selectBien(bilan.id, bienName)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        currentSelectedBien === bienName
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {bienName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Titre du tableau */}
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Encaissements et décaissements de l'année {bilan.year} - {currentSelectedBien}
            </h4>

            {/* Tableau des opérations */}
            {currentEntries.length > 0 ? (
              <>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Affectation</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Libellé</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Encaissement</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Décaissement</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">Pièce jointe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 text-sm">
                            {entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm">{entry.affectation || '-'}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm">{entry.libelle || '-'}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-green-600 font-medium">
                            {entry.encaissement ? `${entry.encaissement.toFixed(2)}€` : '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-red-600 font-medium">
                            {entry.decaissement ? `${entry.decaissement.toFixed(2)}€` : '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            {entry.attachments && entry.attachments.length > 0 ? (
                              <Paperclip className="w-4 h-4 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totaux */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Encaissements</p>
                      <p className="text-lg font-semibold text-green-600">
                        {totalEncaissements.toFixed(2)}€
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Décaissements</p>
                      <p className="text-lg font-semibold text-red-600">
                        {totalDecaissements.toFixed(2)}€
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Résultat</p>
                      <p className={`text-lg font-semibold ${
                        (totalEncaissements - totalDecaissements) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(totalEncaissements - totalDecaissements).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune entrée comptable pour ce bien</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton de rafraîchissement */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <Archive className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Archives</h1>
            <p className="text-sm text-gray-600">
              Consultez vos bilans terminés et validés des années précédentes.
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : archivedBilans.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">
          {archivedBilans.map(renderBilanCard)}
        </div>
      )}
    </div>
  );
};

export default ArchivesPage;