'use client';

import { useState, useEffect } from 'react';
import { useBusiness } from '@/context/BusinessContext';

type PlatformConfig = {
  clientId: string;
  clientSecret: string;
};

export default function AccountCenter() {
  const { businesses, selectedBusinessId, addBusiness, deleteBusiness } = useBusiness();
  const [viewingBusinessId, setViewingBusinessId] = useState<string | null>(null);
  const [newBusinessName, setNewBusinessName] = useState('');
  
  // Modal State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const handleAddBusiness = () => {
    if (newBusinessName.trim()) {
      addBusiness(newBusinessName.trim());
      setNewBusinessName('');
    }
  };

  const platforms = [
    { id: 'facebook', name: 'Facebook Page', color: 'bg-[#1877F2]' },
    { id: 'instagram', name: 'Instagram', color: 'bg-[#E4405F]' },
    { id: 'google', name: 'Google Business Profile', color: 'bg-[#1A73E8]' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-[#0A66C2]' },
    { id: 'pinterest', name: 'Pinterest', color: 'bg-[#E60023]' },
    { id: 'twitter', name: 'X (Twitter)', color: 'bg-[#1DA1F2]' },
    { id: 'youtube', name: 'YouTube', color: 'bg-[#FF0000]' }
  ];

  // Fetch existing config when switching businesses
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (viewingBusinessId) {
      fetch(`/api/settings?businessId=${viewingBusinessId}`)
        .then(res => res.json())
        .then(data => {
          if (data?.config) {
            setPlatformConfigs(data.config);
          }
        })
        .catch(console.error);
    }
  }, [viewingBusinessId]);

  const handleOpenConfig = (platformId: string) => {
    setActiveModal(platformId);
    setClientId(platformConfigs[platformId]?.clientId || '');
    setClientSecret(platformConfigs[platformId]?.clientSecret || '');
  };

  const handleSaveConfiguration = async () => {
    if (!viewingBusinessId || !activeModal) return;

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: viewingBusinessId,
          platform: activeModal,
          clientId: clientId,
          clientSecret: clientSecret
        })
      });

      if (res.ok) {
        setPlatformConfigs(prev => ({
          ...prev,
          [activeModal]: { clientId, clientSecret }
        }));
        setActiveModal(null);
        setClientId('');
        setClientSecret('');
      } else {
        alert("Failed to save configuration.");
      }
    } catch (err) {
      alert("Error saving configuration.");
    }
  };

  const renderModal = () => {
    if (!activeModal) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl relative">
          <h2 className="text-xl font-bold mb-6">Configure {platforms.find(p => p.id === activeModal)?.name} API</h2>
          
          <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg mb-6 leading-relaxed">
            <p className="font-semibold mb-1">1. Go to Developer Portal and create a Business App.</p>
            <p className="font-semibold mb-1">2. Add the Login / OAuth product.</p>
            <p className="font-semibold mb-1">3. Add this exact Redirect URI to the settings:</p>
            <div className="bg-white px-3 py-1.5 mt-1 border border-blue-200 rounded text-blue-600 font-mono text-xs overflow-x-auto">
              http://localhost:3000/api/oauth/{activeModal}/callback
            </div>
            <p className="font-semibold mt-2">4. Copy the App ID and App Secret.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Client ID / App ID</label>
              <input
                type="text"
                placeholder="e.g. 1234567890"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Client Secret / App Secret</label>
              <input
                type="password"
                placeholder="e.g. a1b2c3d4e5f6g7h8i9j0"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button 
              onClick={() => setActiveModal(null)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveConfiguration}
              className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-white font-semibold hover:bg-blue-700"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Detailed View for a specific Business
  if (viewingBusinessId) {
    const business = businesses.find(b => b.id === viewingBusinessId);

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0 relative">
        {renderModal()}
        
        <button 
          onClick={() => setViewingBusinessId(null)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-semibold text-lg"
        >
          <span className="mr-3 text-xl">←</span> {business?.name}
        </button>

        <p className="text-sm text-gray-500 mb-8 text-center">
          Manage your connected experiences and account settings for this business.
        </p>

        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Connected Platforms</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {platforms.map(platform => (
            <div key={platform.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-800 text-sm">{platform.name}</span>
                <button 
                  onClick={() => handleOpenConfig(platform.id)}
                  className="text-blue-500 text-xs font-semibold hover:underline"
                >
                  Configure
                </button>
              </div>
              {platformConfigs[platform.id]?.accessToken ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.location.href = `/api/oauth/${platform.id}?businessId=${viewingBusinessId}`}
                    className="flex-1 py-2.5 rounded-lg text-gray-700 bg-gray-100 text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Reconnect
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm(`Disconnect ${platform.name}?`)) {
                        fetch('/api/settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            businessId: viewingBusinessId,
                            platform: platform.id,
                            clientId: platformConfigs[platform.id]?.clientId,
                            clientSecret: platformConfigs[platform.id]?.clientSecret,
                            disconnect: true
                          })
                        }).then(() => {
                           setPlatformConfigs(prev => ({
                             ...prev,
                             [platform.id]: { ...prev[platform.id], accessToken: null }
                           }));
                        });
                      }
                    }}
                    className="flex-1 py-2.5 rounded-lg text-red-600 bg-red-50 text-sm font-semibold hover:bg-red-100 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => window.location.href = `/api/oauth/${platform.id}?businessId=${viewingBusinessId}`}
                  className={`w-full py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity ${platform.color}`}
                >
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default View: List of Business Profiles
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Profiles</h1>
      <p className="text-sm text-gray-500 mb-8">
        Manage your business profiles. Add more profiles to keep your social accounts isolated.
      </p>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <ul className="divide-y divide-gray-100">
          {businesses.map((business) => (
            <li key={business.id} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition group">
              <button 
                onClick={() => setViewingBusinessId(business.id)}
                className="flex-1 text-left flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-lg border">
                  {business.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition text-sm">{business.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {business.id === selectedBusinessId ? 'Currently Active' : 'Workspace'}
                  </p>
                </div>
              </button>
              <div className="flex items-center space-x-6">
                <button 
                  onClick={() => {
                    if(confirm(`Are you sure you want to delete "${business.name}"?`)) {
                      deleteBusiness(business.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold opacity-0 group-hover:opacity-100 transition focus:opacity-100"
                >
                  Delete
                </button>
                <button onClick={() => setViewingBusinessId(business.id)}>
                  <span className="text-gray-400 hover:text-blue-500 text-2xl font-light leading-none">→</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 max-w-lg">
        <input
          type="text"
          placeholder="New Business Name"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-700"
          value={newBusinessName}
          onChange={(e) => setNewBusinessName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddBusiness()}
        />
        <button 
          onClick={handleAddBusiness}
          className="bg-blue-50 text-blue-600 font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-100 transition whitespace-nowrap"
        >
          Add business
        </button>
      </div>
    </div>
  );
}
