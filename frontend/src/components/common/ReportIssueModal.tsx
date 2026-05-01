import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { reportIssue } from '../../lib/issue-api';
import type { CreateIssueRequest } from '../../types';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId?: string;
  defaultCategory?: string;
}

export default function ReportIssueModal({ isOpen, onClose, transactionId, defaultCategory = 'bug' }: ReportIssueModalProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateIssueRequest>({
    reporter_name: user?.username || '',
    reporter_email: user?.email || '',
    transaction_id: transactionId || '',
    category: defaultCategory,
    title: '',
    description: '',
    priority: 'medium'
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        reporter_name: user?.username || '',
        reporter_email: user?.email || '',
        transaction_id: transactionId || '',
        category: defaultCategory,
        title: '',
        description: '',
        priority: 'medium'
      });
    }
  }, [isOpen, transactionId, defaultCategory, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await reportIssue(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Report Issue</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Help us improve Kilas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">Report Sent!</h3>
            <p className="text-gray-500 font-bold">Thank you for your feedback. Our team will look into it.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 animate-in shake duration-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-bold text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-red-400 outline-none font-bold text-gray-700 transition-all appearance-none cursor-pointer"
                >
                  <option value="bug">Bug / Error</option>
                  {formData.transaction_id && <option value="transaction">Payment Issue</option>}
                  <option value="account">Account Issue</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-red-400 outline-none font-bold text-gray-700 transition-all appearance-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
              <input
                type="text"
                required
                placeholder="What's going on?"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-red-400 outline-none font-bold text-gray-700 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
              <textarea
                required
                rows={4}
                placeholder="Tell us more details..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-red-400 outline-none font-bold text-gray-700 transition-all resize-none"
              />
            </div>

            {formData.transaction_id && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction ID</p>
                  <p className="font-mono font-bold text-gray-600">{formData.transaction_id}</p>
                </div>
                <div className="px-3 py-1 bg-white border-2 border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase">Linked</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
