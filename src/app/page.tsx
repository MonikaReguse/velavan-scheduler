'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useBusiness } from '@/context/BusinessContext';

export default function Dashboard() {
  const { selectedBusinessId, businesses } = useBusiness();
  const currentBusiness = businesses.find(b => b.id === selectedBusinessId);

  // Mocked data mapped by business ID
  const allPosts: Record<string, any[]> = {
    'business-1': [
      {
        id: '1',
        content: 'Excited to announce our new product launch! 🚀',
        scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toLocaleString(),
        status: 'PENDING',
        platforms: ['Facebook', 'Instagram'],
      }
    ],
    'business-2': [
      {
        id: '2',
        content: 'Check out our latest blog post on marketing tips.',
        scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toLocaleString(),
        status: 'PUBLISHED',
        platforms: ['LinkedIn', 'Twitter (X)'],
      }
    ]
  };

  const allAccounts: Record<string, any[]> = {
    'business-1': [
      { platform: 'Facebook Page', handle: '@mainbrand' },
      { platform: 'Instagram', handle: '@mainbrand_ig' },
    ],
    'business-2': [
      { platform: 'LinkedIn', handle: 'clientacorp' },
    ]
  };

  const initialPosts = allPosts[selectedBusinessId] || [];
  const currentAccounts = allAccounts[selectedBusinessId] || [];

  const [localPosts, setLocalPosts] = useState(allPosts);

  const upcomingPosts = localPosts[selectedBusinessId] || [];

  const [editingPost, setEditingPost] = useState<any>(null);
  const [editContent, setEditContent] = useState('');

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;
    const updatedPosts = upcomingPosts.map((p) => 
      p.id === editingPost.id ? { ...p, content: editContent } : p
    );
    setLocalPosts({
      ...localPosts,
      [selectedBusinessId]: updatedPosts
    });
    setEditingPost(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled post?')) {
      const updatedPostsForBusiness = upcomingPosts.filter(post => post.id !== id);
      setLocalPosts({
        ...localPosts,
        [selectedBusinessId]: updatedPostsForBusiness
      });
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Link 
          href="/create" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          + New Post
        </Link>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {upcomingPosts.length === 0 ? (
            <li className="px-4 py-12 text-center text-gray-500">
              No scheduled posts for {currentBusiness?.name}. Click "New Post" to get started!
            </li>
          ) : (
            upcomingPosts.map((post) => (
              <li key={post.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
                    <p className="text-sm font-medium text-gray-900 truncate mb-2 md:mb-0 max-w-lg">{post.content}</p>
                    <div className="flex items-center space-x-4">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {post.status}
                      </p>
                      <button 
                        onClick={() => handleEdit(post)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium focus:outline-none hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex text-sm text-gray-500">
                    <p className="flex items-center">
                      Platforms: {post.platforms.join(', ')}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Scheduled for: {post.scheduledTime}
                    </p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Scheduled Post</h3>
            </div>
            <div className="p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-32 p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none outline-none"
              ></textarea>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
