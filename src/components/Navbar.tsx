'use client';

import Link from 'next/link';
import { useBusiness } from '@/context/BusinessContext';

export default function Navbar() {
  const { businesses, selectedBusinessId, addBusiness, setSelectedBusinessId } = useBusiness();

  const handleBusinessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'add-new') {
      const newName = prompt('Enter the name of the new business/client:');
      if (newName && newName.trim() !== '') {
        addBusiness(newName.trim());
      } else {
        // Reset to previous if cancelled
        e.target.value = selectedBusinessId;
      }
    } else {
      setSelectedBusinessId(value);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex w-full">
            <div className="flex-shrink-0 flex items-center font-bold text-xl text-blue-600 mr-4">
              SocialScheduler
            </div>
            <div className="flex items-center mr-6">
              <select 
                className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white text-gray-700 cursor-pointer shadow-sm"
                value={selectedBusinessId}
                onChange={handleBusinessChange}
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
                <option disabled>──────────</option>
                <option value="add-new">+ Add New Business</option>
              </select>
            </div>
            <div className="hidden sm:flex sm:space-x-8">
              <Link href="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/history" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                History
              </Link>
              <Link href="/create" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Create Post
              </Link>
              <Link href="/settings" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Account Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
