import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import HomePage from './HomePage';
import MonComptePage from './MonComptePage';
import MesBiensPage from './MesBiensPage';
import ComptabilitePage from './ComptabilitePage';
import ArchivesPage from './ArchivesPage';

const Layout: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');

  const renderContent = () => {
    switch (activeSection) {
      case 'mon-compte':
        return <MonComptePage />;
      case 'mes-biens':
        return <MesBiensPage />;
      case 'comptabilite':
        return <ComptabilitePage activeSection={activeSection} setActiveSection={setActiveSection} />;
      case 'archives':
        return <ArchivesPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <Header />
      
      <main className="ml-64 pt-16">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Layout;