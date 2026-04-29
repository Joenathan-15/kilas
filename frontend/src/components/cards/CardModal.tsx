import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import api, { getFullImageUrl } from '../../lib/api';
import toast from 'react-hot-toast';
import type { Card } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Card;
  title: string;
}

export default function CardModal({ isOpen, onClose, onSubmit, initialData, title }: CardModalProps) {
  useEscapeKey(onClose, isOpen);
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    front_image_url: '',
    back_image_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<'front' | 'back' | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        front: initialData.front,
        back: initialData.back,
        front_image_url: initialData.front_image_url || '',
        back_image_url: initialData.back_image_url || '',
      });
    } else {
      setFormData({
        front: '',
        back: '',
        front_image_url: '',
        back_image_url: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const res = await api.post('/upload/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = res.data.url;
      setFormData((prev) => ({
        ...prev,
        [uploadTarget === 'front' ? 'front_image_url' : 'back_image_url']: imageUrl,
      }));
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadTarget(null);
    }
  };

  const removeImage = (target: 'front' | 'back') => {
    setFormData((prev) => ({
      ...prev,
      [target === 'front' ? 'front_image_url' : 'back_image_url']: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white w-full max-w-lg rounded-3xl border-b-8 border-gray-200 p-6 z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-700 uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Front of Card */}
          <div className="space-y-3">
            <label className="block text-sm font-black text-gray-400 uppercase tracking-wider">
              Front (Question) <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative group">
              <textarea
                required
                value={formData.front}
                onChange={(e) => setFormData({ ...formData, front: e.target.value })}
                className="w-full px-4 py-4 bg-gray-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-blue focus:ring-0 transition-all font-bold text-gray-700 outline-none resize-none"
                rows={3}
                placeholder="What do you want to learn?"
              />

              <div className="mt-2 flex flex-wrap gap-2">
                {formData.front_image_url ? (
                  <div className="relative group/img w-24 h-24">
                    <img
                      src={getFullImageUrl(formData.front_image_url)}
                      alt="Front"
                      className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage('front')}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => {
                      setUploadTarget('front');
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-black text-gray-500 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {isUploading && uploadTarget === 'front' ? 'UPLOADING...' : 'ADD IMAGE'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Back of Card */}
          <div className="space-y-3">
            <label className="block text-sm font-black text-gray-400 uppercase tracking-wider">
              Back (Answer) <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative group">
              <textarea
                required
                value={formData.back}
                onChange={(e) => setFormData({ ...formData, back: e.target.value })}
                className="w-full px-4 py-4 bg-gray-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-blue focus:ring-0 transition-all font-bold text-gray-700 outline-none resize-none"
                rows={3}
                placeholder="The correct answer or translation..."
              />

              <div className="mt-2 flex flex-wrap gap-2">
                {formData.back_image_url ? (
                  <div className="relative group/img w-24 h-24">
                    <img
                      src={getFullImageUrl(formData.back_image_url)}
                      alt="Back"
                      className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage('back')}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => {
                      setUploadTarget('back');
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-black text-gray-500 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {isUploading && uploadTarget === 'back' ? 'UPLOADING...' : 'ADD IMAGE'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />

          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="btn-primary w-full py-4 text-lg mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'SAVE CARD'}
          </button>
        </form>
      </div>
    </div>
  );
}
