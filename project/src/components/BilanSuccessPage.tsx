import React from 'react';
import { CheckCircle, Home } from 'lucide-react';

interface BilanSuccessPageProps {
  year: string;
  onReturnHome: () => void;
}

const BilanSuccessPage: React.FC<BilanSuccessPageProps> = ({ year, onReturnHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
          {/* Header avec gradient */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bilan transmis avec succès !
            </h1>
            <p className="text-green-100 text-lg">
              Année {year}
            </p>
          </div>

          {/* Contenu */}
          <div className="px-8 py-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Félicitations !
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Les chiffres de votre comptabilité ont bien été transmis à votre comptable.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-green-900 mb-2">
                      Prochaines étapes
                    </h3>
                    <ul className="text-green-800 space-y-2 text-sm">
                      <li>• Votre comptable va analyser vos données</li>
                      <li>• Vous recevrez un retour sous 5 à 10 jours ouvrés</li>
                      <li>• Vos documents seront archivés automatiquement</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">i</span>
                  </div>
                  <h3 className="font-semibold text-blue-900">
                    Informations importantes
                  </h3>
                </div>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Votre bilan de l'année {year} est maintenant clôturé et ne peut plus être modifié. 
                  Vous pouvez le consulter à tout moment dans la section "Archives".
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onReturnHome}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Home className="w-5 h-5" />
                <span>Retourner à l'accueil</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/archives'}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <span>Voir les archives</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Merci de votre confiance • IMMOLOC
          </p>
        </div>
      </div>
    </div>
  );
};

export default BilanSuccessPage;