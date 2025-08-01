import React from 'react';
import { TrendingUp, Building, Users, Euro } from 'lucide-react';

const HomePage: React.FC = () => {
  const stats = [
    {
      label: 'Biens gérés',
      value: '24',
      icon: Building,
      color: 'bg-blue-500',
      change: '+2 ce mois'
    },
    {
      label: 'Revenus mensuels',
      value: '12,450€',
      icon: Euro,
      color: 'bg-green-500',
      change: '+5.2%'
    },
    {
      label: 'Locataires actifs',
      value: '18',
      icon: Users,
      color: 'bg-purple-500',
      change: 'Stable'
    },
    {
      label: 'Rendement moyen',
      value: '7.8%',
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+0.3%'
    }
  ];

  const recentActivities = [
    { date: '15 Dec', action: 'Loyer encaissé', property: 'Appartement Lyon 3', amount: '+850€' },
    { date: '14 Dec', action: 'Charge décaissée', property: 'Villa Marseille', amount: '-125€' },
    { date: '13 Dec', action: 'Nouveau locataire', property: 'Studio Paris 11', amount: '' },
    { date: '12 Dec', action: 'Réparation', property: 'Appartement Lille', amount: '-320€' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div 
          className="relative px-8 py-12 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')`
          }}
        >
          <div className="absolute inset-0 bg-slate-900/80"></div>
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl font-bold text-white mb-4">
              Bienvenue sur votre portail IMMOLOC
            </h1>
            <p className="text-xl text-slate-200 mb-6">
              Gérez facilement vos investissements immobiliers locatifs et optimisez votre comptabilité.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
              Voir mes biens
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Activités récentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.map((activity, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500 w-12">{activity.date}</div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.property}</p>
                  </div>
                </div>
                {activity.amount && (
                  <span className={`font-semibold ${
                    activity.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activity.amount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-2">Saisir un loyer</h4>
          <p className="text-blue-700 text-sm mb-4">Enregistrez rapidement un nouveau loyer encaissé</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
            Saisir maintenant
          </button>
        </div>
        
        <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
          <h4 className="font-semibold text-orange-900 mb-2">Ajouter une charge</h4>
          <p className="text-orange-700 text-sm mb-4">Déclarez vos frais et charges déductibles</p>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
            Ajouter charge
          </button>
        </div>
        
        <div className="bg-green-50 rounded-xl p-6 border border-green-100">
          <h4 className="font-semibold text-green-900 mb-2">Rapport mensuel</h4>
          <p className="text-green-700 text-sm mb-4">Consultez votre synthèse comptable du mois</p>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
            Voir rapport
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;