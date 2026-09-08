'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBusiness } from '@/context/BusinessContext';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [platforms, setPlatforms] = useState({ 
    facebook: false, 
    instagram: false,
    linkedin: false,
    pinterest: false,
    twitter: false,
    youtube: false
  });

  // Calculate how many platforms selected
  const selectedCount = Object.values(platforms).filter(Boolean).length;

  useEffect(() => {
    if (media) {
      const objectUrl = URL.createObjectURL(media);
      setMediaPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setMediaPreview(null);
    }
  }, [media]);

  const { selectedBusinessId } = useBusiness();
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessId) {
      alert("Please select a business first.");
      return;
    }

    const selectedPlatforms = Object.entries(platforms)
      .filter(([_, isSelected]) => isSelected)
      .map(([platformId]) => platformId);

    if (selectedPlatforms.length === 0) {
      alert("Please select at least one platform.");
      return;
    }

    setIsPosting(true);

    let finalMediaUrl = null;
    let finalMediaType = null;

    if (media) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', media);
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
          });
          
          const uploadData = await uploadRes.json();
          if (uploadData.secure_url) {
            finalMediaUrl = uploadData.secure_url;
            
            const isVideo = media.type.startsWith('video/') || 
                            media.name.toLowerCase().match(/\.(mp4|mov|avi|wmv|webm|mkv)$/);
            
            finalMediaType = isVideo ? 'video' : 'image';
            console.log("Detected Media Type:", finalMediaType);
          } else {
            throw new Error(uploadData.error?.message || "Upload failed");
          }
        } catch (err) {
        console.error("Cloudinary upload failed:", err);
      }
    }

    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          content: content,
          platforms: selectedPlatforms,
          scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : null,
          mediaUrl: finalMediaUrl,
          mediaType: finalMediaType
        })
      });

      const data = await res.json();
      if (res.ok && data.results) {
        const successPlatforms = data.results.filter((r: any) => r.status === 'success').map((r: any) => r.platform);
        const errorPlatforms = data.results.filter((r: any) => r.status === 'error');
        
        if (successPlatforms.length > 0) {
          alert(`SUCCESS! Published to: ${successPlatforms.join(', ')}`);
        }
        if (errorPlatforms.length > 0) {
          errorPlatforms.forEach((err: any) => alert(`ERROR on ${err.platform}: ${err.error}`));
        }
        if (successPlatforms.length === selectedPlatforms.length) {
          setContent("");
          setMedia(null);
        }
      } else if (res.ok) {
        alert("Post published successfully!");
        setContent("");
        setMedia(null);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Failed to send post.");
    } finally {
      setIsPosting(false);
    }
  };

  const previewTabs = ['Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'Pinterest', 'YouTube', 'Google'];
  const [activeTab, setActiveTab] = useState('Facebook');

  return (
    <div className="px-4 py-6 sm:px-0 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Post</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Form */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Post Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                  Post Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="What do you want to share?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              {/* Attach Media */}
              <div>
                <label htmlFor="media" className="block text-sm font-semibold text-gray-700 mb-2">
                  Attach Media (Image or Video)
                </label>
                {!mediaPreview ? (
                  <div className="flex items-center border border-gray-300 rounded-lg p-2 bg-white transition hover:border-gray-400">
                    <input
                      type="file"
                      id="media"
                      name="media"
                      accept="image/*,video/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setMedia(e.target.files[0]);
                        } else {
                          setMedia(null);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative inline-block border border-gray-300 rounded-lg overflow-hidden bg-gray-50 p-2">
                    {media?.type.startsWith('video/') ? (
                      <video src={mediaPreview} controls className="max-h-48 object-contain rounded" />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="max-h-48 object-contain rounded" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMedia(null);
                        setMediaPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 focus:outline-none shadow-md text-sm font-bold"
                      title="Remove media"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              {/* Image Alt Text */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="altText" className="block text-sm font-semibold text-gray-400">
                    Image Alt Text
                  </label>
                </div>
                <input
                  type="text"
                  name="altText"
                  id="altText"
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 text-gray-700"
                  placeholder="Describe this image for visually impaired users..."
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>

              {/* Schedule Time */}
              <div>
                <label htmlFor="scheduledTime" className="block text-sm font-semibold text-gray-700 mb-2">
                  Schedule Time
                </label>
                <input
                  type="datetime-local"
                  name="scheduledTime"
                  id="scheduledTime"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>

              {/* Publish To */}
              <div>
                <label className="inline-block text-sm font-bold text-white bg-blue-600 px-2.5 py-1 rounded mb-4 shadow-sm">
                  Publish To
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { id: 'facebook', label: 'Facebook Page' },
                    { id: 'instagram', label: 'Instagram' },
                    { id: 'linkedin', label: 'LinkedIn' },
                    { id: 'pinterest', label: 'Pinterest' },
                    { id: 'twitter', label: 'Twitter (X)' },
                    { id: 'youtube', label: 'YouTube' },
                  ].map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-3 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition">
                      <input
                        id={platform.id}
                        name={platform.id}
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                        checked={platforms[platform.id as keyof typeof platforms]}
                        onChange={(e) => setPlatforms({ ...platforms, [platform.id]: e.target.checked })}
                      />
                      <label htmlFor={platform.id} className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                        {platform.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex justify-end items-center space-x-3 border-t border-gray-100 mt-8">
                <button
                  type="button"
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPosting}
                  className={`px-6 py-2.5 text-white font-bold text-sm rounded-lg shadow-sm transition ${isPosting ? 'bg-emerald-300' : 'bg-emerald-400 hover:bg-emerald-500'}`}
                >
                  {isPosting ? 'Posting...' : 'Post Now'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-500 text-white font-bold text-sm rounded-lg hover:bg-blue-600 transition shadow-sm"
                >
                  Schedule Post
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white shadow-sm rounded-xl flex flex-col h-full min-h-[650px] border border-gray-100 overflow-hidden">
            {/* Preview Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white">
              <h2 className="text-sm font-bold text-gray-800">Live Preview</h2>
              <span className="text-sm font-bold text-blue-600">{selectedCount} Selected</span>
            </div>
            
            {/* Preview Tabs */}
            <div className="px-2 pt-2 border-b border-gray-100 bg-white overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="flex space-x-6 px-4">
                {previewTabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-bold border-b-2 transition ${
                      activeTab === tab 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 bg-[#f4f6f8] flex flex-col items-center justify-center p-8 text-center relative">
              {content || mediaPreview ? (
                <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-sm w-full text-left shadow-md absolute top-12">
                  {/* Mock Post Preview */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-3 w-24 bg-gray-200 rounded mb-1.5"></div>
                      <div className="h-2 w-16 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  {content && <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">{content}</p>}
                  {mediaPreview && (
                    <div className="rounded-lg overflow-hidden border border-gray-100 mt-2">
                      {media?.type.startsWith('video/') ? (
                        <video src={mediaPreview} className="w-full max-h-64 object-cover" />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-cover" />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 border-2 border-white shadow-sm">
                    {/* SVG Eye Icon */}
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-bold text-sm tracking-wide">Select one or more accounts to see a live preview.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
