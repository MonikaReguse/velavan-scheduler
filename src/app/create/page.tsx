'use client';

import { useState, useEffect } from 'react';
import { useBusiness } from '@/context/BusinessContext';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // 12-Hour AM/PM Schedule State
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleHour, setScheduleHour] = useState('03');
  const [scheduleMinute, setScheduleMinute] = useState('30');
  const [scheduleAmpm, setScheduleAmpm] = useState('PM');

  const [platforms, setPlatforms] = useState({
    facebook: false,
    instagram: false,
    linkedin: false,
    pinterest: false,
    twitter: false,
    youtube: false,
  });

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedia(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (media) {
      const url = URL.createObjectURL(media);
      setMediaPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setMediaPreview(null);
    }
  }, [media]);

  const { selectedBusinessId } = useBusiness();
  const [isPosting, setIsPosting] = useState(false);

  const getScheduledISO = () => {
    if (!scheduleDate) return null;
    let hour = parseInt(scheduleHour, 10);
    if (scheduleAmpm === 'PM' && hour < 12) hour += 12;
    if (scheduleAmpm === 'AM' && hour === 12) hour = 0;
    
    const paddedHour = String(hour).padStart(2, '0');
    const paddedMin = String(scheduleMinute).padStart(2, '0');
    
    const localDateTimeStr = `${scheduleDate}T${paddedHour}:${paddedMin}`;
    const d = new Date(localDateTimeStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent, isScheduleTarget: boolean = false) => {
    if (e && e.preventDefault) e.preventDefault();

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

    let payloadScheduledTime: string | null = null;

    if (isScheduleTarget) {
      if (!scheduleDate) {
        alert("Please select a Schedule Date and Time before clicking Schedule Post.");
        return;
      }
      payloadScheduledTime = getScheduledISO();
      if (!payloadScheduledTime) {
        alert("Invalid Date or Time selected.");
        return;
      }
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
          scheduledTime: payloadScheduledTime,
          isSchedule: isScheduleTarget,
          mediaUrl: finalMediaUrl,
          mediaType: finalMediaType
        })
      });

      const data = await res.json();
      if (res.ok && data.isScheduled) {
        alert(`SUCCESS! Post scheduled for ${new Date(data.scheduledTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`);
        setContent("");
        setMedia(null);
        setScheduleDate("");
      } else if (res.ok && data.results) {
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
          setScheduleDate("");
        }
      } else if (res.ok) {
        alert("Post published successfully!");
        setContent("");
        setMedia(null);
        setScheduleDate("");
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
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
              
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
                  placeholder="What would you like to share?"
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
                
                {mediaPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 max-h-64 flex items-center justify-center">
                    {media?.type.startsWith('video/') ? (
                      <video src={mediaPreview} controls className="max-h-64 w-auto object-contain" />
                    ) : (
                      <img src={mediaPreview} alt="Upload preview" className="max-h-64 w-auto object-contain" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMedia(null)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-700 transition"
                      title="Remove media"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    id="media"
                    name="media"
                    accept="image/*,video/*"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg cursor-pointer"
                    onChange={handleMediaChange}
                  />
                )}
              </div>

              {/* Schedule Date & Time with AM/PM */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Schedule Date & Time (Select AM / PM)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {/* Date Input */}
                  <div className="sm:col-span-2">
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>

                  {/* Hour & Minute */}
                  <div className="flex items-center space-x-1">
                    <select
                      value={scheduleHour}
                      onChange={(e) => setScheduleHour(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {['01','02','03','04','05','06','07','08','09','10','11','12'].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="font-bold text-gray-500">:</span>
                    <select
                      value={scheduleMinute}
                      onChange={(e) => setScheduleMinute(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {['00','05','10','15','20','25','30','35','40','45','50','55'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* AM / PM Selector */}
                  <div>
                    <select
                      value={scheduleAmpm}
                      onChange={(e) => setScheduleAmpm(e.target.value)}
                      className="w-full border border-blue-300 bg-blue-50 text-blue-800 font-bold rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  To schedule, select date and time above, then click <strong>Schedule Post</strong>.
                </p>
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
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isPosting}
                  className={`px-6 py-2.5 text-white font-bold text-sm rounded-lg shadow-sm transition ${isPosting ? 'bg-emerald-300' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  {isPosting ? 'Posting...' : 'Post Now'}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isPosting}
                  className={`px-6 py-2.5 text-white font-bold text-sm rounded-lg transition shadow-sm ${isPosting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isPosting ? 'Scheduling...' : 'Schedule Post'}
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
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                {Object.values(platforms).filter(Boolean).length} Selected
              </span>
            </div>

            {/* Platform Sub-tabs */}
            <div className="flex border-b border-gray-100 px-6 bg-gray-50/50 space-x-6 overflow-x-auto">
              {previewTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Preview Card Body */}
            <div className="p-6 flex-1 flex items-start justify-center bg-gray-50/30">
              <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-center space-x-3 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                  <div>
                    <div className="h-3.5 bg-gray-200 rounded w-28 mb-1.5" />
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap min-h-[40px]">
                    {content || <span className="text-gray-400 italic">Your post text will appear here...</span>}
                  </p>
                </div>

                {mediaPreview && (
                  <div className="border-t border-gray-100 bg-black flex items-center justify-center max-h-80 overflow-hidden">
                    {media?.type.startsWith('video/') ? (
                      <video src={mediaPreview} controls className="max-h-80 w-full object-contain" />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="max-h-80 w-full object-contain" />
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
