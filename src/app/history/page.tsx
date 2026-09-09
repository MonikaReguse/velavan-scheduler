'use client';

import { useState, useEffect } from 'react';

export default function HistoryPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, platforms: string[]) => {
    const hasInstagram = platforms?.includes('instagram');
    const confirmMsg = hasInstagram
      ? "This will delete the post from Facebook, LinkedIn, YouTube etc.\n\n⚠️ INSTAGRAM NOTE: Instagram does not allow deletion via API. You will need to manually delete it from the Instagram app.\n\nContinue?"
      : "Are you sure you want to permanently delete this post from all platforms?";

    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        let msg = "Post deleted from all platforms!";
        if (hasInstagram) {
          msg += "\n\n⚠️ Remember to also manually delete it from your Instagram app.";
        }
        alert(msg);
        fetchPosts();
      } else {
        alert("Error deleting post: " + data.error);
      }
    } catch (e) {
      alert("Failed to delete post");
    }
  };

  const handleEditSave = async () => {
    if (!editingPost) return;
    try {
      const res = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      const data = await res.json();
      if (data.success) {
        alert("Caption updated in your local history!");
        setEditingPost(null);
        fetchPosts();
      } else {
        alert("Error editing post: " + data.error);
      }
    } catch (e) {
      alert("Failed to edit post");
    }
  };

  if (loading) {
    return <div className="p-8"><div className="animate-pulse flex space-x-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post History</h1>
          <p className="text-gray-500">View and manage your published posts across all platforms.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">You haven't published any posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              {post.mediaUrl && (
                <div className="h-48 bg-gray-100 overflow-hidden relative">
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={post.mediaUrl} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {post.platforms?.map((p: string) => (
                      <span key={p} className="bg-white/90 px-2 py-1 rounded text-xs font-medium uppercase shadow-sm">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-4 flex-grow flex flex-col">
                <p className="text-sm text-gray-500 mb-2">{new Date(post.createdAt).toLocaleString()}</p>
                <p className="text-gray-800 text-sm whitespace-pre-wrap flex-grow line-clamp-4">
                  {post.content}
                </p>
                
                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                  <button 
                    onClick={() => { setEditingPost(post); setEditContent(post.content); }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(post.id, post.platforms)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">Edit Post Caption</h3>
              <p className="text-xs text-red-500 mt-1">Note: This only updates the local database. Instagram does not allow editing via API.</p>
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
                onClick={handleEditSave}
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
