import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white shadow-sm border-b border-gray-200 z-5">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">Tableau de bord</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;