import React, { useState } from 'react';
import { User, Building, Calculator, Archive, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection }) => {
  const { signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigationItems = [
    { id: 'mon-compte', label: 'Mon compte', icon: User },
    { id: 'mes-biens', label: 'Mes biens', icon: Building },
    { id: 'comptabilite', label: 'Comptabilité', icon: Calculator },
    { id: 'archives', label: 'Archives', icon: Archive },
  ];

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const renderLogoutModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Confirmer la déconnexion</h3>
        
        <p className="text-gray-700 mb-8">
          Êtes-vous sûr de vouloir vous déconnecter ?
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancelLogout}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Non
          </button>
          <button
            onClick={handleConfirmLogout}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Oui
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 shadow-xl z-10">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">IMMOLOC</h1>
                <p className="text-slate-400 text-xs">Gestion locative</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-700 space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all duration-200">
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Aide ?</span>
            </button>
            <button 
              onClick={handleLogoutClick}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de déconnexion */}
      {showLogoutModal && renderLogoutModal()}
    </>
  );
};

export default Sidebar;