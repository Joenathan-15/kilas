import { useLanguageStore, type AppLanguage } from '../../stores/languageStore';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface LanguageSwitcherProps {
  /** Visual variant */
  variant?: 'header' | 'dropdown';
  className?: string;
}

const LANGUAGE_OPTIONS: { value: AppLanguage; label: string; flag: string; longLabel: string }[] = [
  { value: 'id', label: 'ID', longLabel: 'Bahasa Indonesia', flag: '/id.svg' },
  { value: 'en', label: 'US', longLabel: 'English (US)', flag: '/us.svg' },
];

export default function LanguageSwitcher({ variant = 'header', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGE_OPTIONS.find(opt => opt.value === language) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 bg-white p-0.5">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLanguage(opt.value)}
              className={`px-3 py-1.5 text-xs font-black tracking-wide transition-all cursor-pointer flex items-center gap-2 rounded-lg ${language === opt.value
                  ? 'bg-sky-blue text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              <img src={opt.flag} alt={opt.label} className="w-4 h-3 object-cover rounded-sm border border-black/10" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // custom dropdown variant — used in profile or settings
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 hover:border-sky-blue/30 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <img src={currentOption.flag} alt={currentOption.label} className="w-6 h-4 object-cover rounded-sm border border-black/10" />
          <span className="font-bold text-gray-700">{currentOption.longLabel}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} group-hover:text-sky-blue`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setLanguage(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-colors hover:bg-sky-blue/5 text-left ${
                language === opt.value ? 'bg-sky-blue/5' : ''
              }`}
            >
              <img src={opt.flag} alt={opt.label} className="w-6 h-4 object-cover rounded-sm border border-black/10" />
              <div className="flex flex-col">
                <span className={`font-bold ${language === opt.value ? 'text-sky-blue' : 'text-gray-700'}`}>
                  {opt.longLabel}
                </span>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{opt.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

