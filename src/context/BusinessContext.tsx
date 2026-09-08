'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type Business = { id: string; name: string };

type BusinessContextType = {
  businesses: Business[];
  selectedBusinessId: string;
  addBusiness: (name: string) => void;
  deleteBusiness: (id: string) => void;
  setSelectedBusinessId: (id: string) => void;
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([
    { id: 'business-1', name: 'velavan properties' },
  ]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('business-1');

  const addBusiness = (name: string) => {
    const newId = `business-${Date.now()}`;
    setBusinesses([...businesses, { id: newId, name }]);
    setSelectedBusinessId(newId);
  };

  const deleteBusiness = (id: string) => {
    const remaining = businesses.filter(b => b.id !== id);
    setBusinesses(remaining);
    // If the currently selected business is deleted, switch to the first available one
    if (selectedBusinessId === id && remaining.length > 0) {
      setSelectedBusinessId(remaining[0].id);
    } else if (remaining.length === 0) {
      setSelectedBusinessId('');
    }
  };

  return (
    <BusinessContext.Provider value={{ businesses, selectedBusinessId, addBusiness, deleteBusiness, setSelectedBusinessId }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
  return context;
}
