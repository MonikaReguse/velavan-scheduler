'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useBusiness } from '@/context/BusinessContext';

export default function Dashboard() {
  const { selectedBusinessId, businesses } = useBusiness();
  const currentBusiness = businesses.find(b => b.id === selectedBusinessId);

  const [upcomingPosts, setUpcomingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingPost, setEditingPost] = useState<any>(null);
  const [editContent, setEditContent] = useState('');

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scheduled?businessId=${selectedBusinessId}`);
      const data = await res.json();
      if (data.success) {
        setUpcomingPosts(data.posts || []);
      }
    } catch (e) {
      console.error("Failed to fetch scheduled posts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, [selectedBusinessId]);

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      const res = await fetch(`/api/scheduled/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      const data = await res.json();
      if (data.success) {
        setEditingPost(null);
        fetchScheduledPosts();
      } else {
        alert("Error updating post: " + data.error);
      }
    } catch (e) {
      alert("Failed to update scheduled post");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to cancel this scheduled post?')) {
      try {
        const res = await fetch(`/api/scheduled/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          fetchScheduledPosts();
        } else {
          alert("Error cancelling post: " + data.error);
        }
      } catch (e) {
        alert("Failed to cancel scheduled post");
      }
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">View and manage your upcoming scheduled posts.</p>
        </div>
        <Link 
          href="/create" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          + New Post
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Scheduled Posts</h2>
          <button 
            onClick={fetchScheduledPosts} 
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Refresh
          </button>
        </div>

        <ul role="list" className="divide-y divide-gray-200">
          {loading ? (
            <li className="px-4 py-12 text-center text-gray-500">
              Loading scheduled posts...
            </li>
          ) : upcomingPosts.length === 0 ? (
            <li className="px-4 py-12 text-center text-gray-500">
              No scheduled posts for {currentBusiness?.name || 'this business'}. Click "New Post" to schedule one!
            </li>
          ) : (
            upcomingPosts.map((post) => (
              <li key={post.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
                    <div className="flex items-center space-x-3 mb-2 md:mb-0 max-w-lg">
                      {post.mediaUrl && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border">
                          {post.mediaType === 'video' ? (
                            <video src={post.mediaUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={post.mediaUrl} className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{post.content}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {post.status}
                      </span>
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
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex text-sm text-gray-500">
                    <p className="flex items-center">
                      Platforms: <span className="ml-1 font-medium text-gray-700">{Array.isArray(post.platforms) ? post.platforms.join(', ') : post.platforms}</span>
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Scheduled for: <span className="font-medium text-gray-700">{new Date(post.scheduledTime).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">Edit Scheduled Post</h3>
            </div>
            <div className="p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              ></textarea>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button 
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
