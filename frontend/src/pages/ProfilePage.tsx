import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import api, { getFullImageUrl } from '../lib/api';
import { User, Camera, Save, CheckCircle2, AlertCircle, Upload, Languages } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(user?.username || '');
  const [avatarURL, setAvatarURL] = useState(user?.avatar_url || '');
  const [language, setLanguage] = useState(user?.language || 'id');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const isSubscribed = user?.subscription_until && new Date(user.subscription_until) > new Date();

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatarURL(user.avatar_url);
      setLanguage(user.language || 'id');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await updateUser(username, avatarURL, language);
      setMessage({ type: 'success', text: t.profile.updateSuccess });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || t.profile.updateFailed 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedUrl = res.data.url;
      
      setAvatarURL(uploadedUrl);
      setMessage({ type: 'success', text: t.profile.uploadSuccess });
    } catch (err: any) {
      setMessage({ type: 'error', text: t.profile.uploadFailed });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-gray-800 tracking-tight">{t.profile.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Section */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-sm text-center space-y-6">
        <div 
            className="relative inline-block group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
        >
            <div className="relative">
                <img 
                    src={getFullImageUrl(avatarURL, username)} 
                    alt="Avatar Preview" 
                    className={`w-32 h-32 rounded-full border-4 object-cover shadow-lg group-hover:opacity-75 transition-all ${isUploading ? 'blur-sm grayscale' : ''} ${isSubscribed ? 'border-yellow-400' : 'border-gray-100'}`} 
                />
                
                {isSubscribed && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg border-4 border-white animate-in zoom-in-50 duration-300">
                        SUPER
                    </div>
                )}
              
              {/* Uploading Spinner */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-sky-blue/30 border-t-sky-blue rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/40 rounded-full p-2">
                <Camera className="w-8 h-8 text-white drop-shadow-md" />
              </div>
            </div>

            <div className="absolute -bottom-2 -right-2 bg-sky-blue text-white p-2 rounded-full shadow-lg border-4 border-white group-hover:scale-110 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          <div className="space-y-1">
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
              {t.profile.avatar}
            </p>
            <p className="text-xs text-gray-400 font-bold italic">
              {t.profile.uploadHint}
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest">
              {t.profile.username}
            </label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-16 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all font-bold text-gray-700"
              />
            </div>
          </div>

          <div className="space-y-2 opacity-50 cursor-not-allowed">
            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest">
              {t.profile.email}
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-6 py-4 rounded-2xl bg-gray-100 border-2 border-gray-200 outline-none font-bold text-gray-500"
            />
            <p className="text-[10px] font-black text-gray-300 uppercase">{t.profile.emailHint}</p>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-blue/10 rounded-xl text-sky-blue">
                <Languages className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{t.profile.language}</h2>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-400 uppercase tracking-widest">
                {t.profile.interfaceLanguage}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English (US)</option>
              </select>
              <p className="text-xs text-gray-400 font-bold">
                {t.profile.languageHint}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-bold">{message.text}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-sky-blue hover:bg-sky-blue-dark text-white py-5 rounded-3xl font-black text-xl shadow-lg shadow-sky-blue/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isSaving ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-6 h-6" />
              {t.profile.saveProfile}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
