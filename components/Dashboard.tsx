import React, { useEffect, useState, useRef } from 'react';
import { UserRole, User, Lesson, ChatMessage, NewsItem, Module, StudentAttempt } from '../types';
import { getDailyVerse, getAIQuizQuestion } from '../services/geminiService';
import { lessonService } from '../services/lessonService';
import { authService } from '../services/authService';
import AdminPanel from './AdminPanel';
import OrganizationPanel from './OrganizationPanel'; 
import LessonView from './LessonView'; 
import ParentOnboarding from './ParentOnboarding';
import ExportModal from './ExportModal';
import LessonBrowser from './LessonBrowser';
import LessonUpload from './LessonUpload';
import StudentPanel from './StudentPanel';
import Tooltip from './Tooltip'; 
import ResourceView from './ResourceView';
import NewsView from './NewsView';
import PerformanceReport from './PerformanceReport';
import ChatPanel from './ChatPanel';
import FrontendEngineerBadge from './FrontendEngineerBadge';
import CertificatesPanel from './CertificatesPanel'; 
import {
  BookOpen, Trophy, Activity, CheckCircle, Heart,
  Users, Upload, Play, Printer, Lock, TrendingUp, Edit3, Star, UserPlus, List, BarChart3, MessageSquare, Hash, ArrowRight, UserCircle, Camera, Save, Loader2,
  ArrowLeft, Settings, Globe, ClipboardList, Shield, Key, History, Mail, Bookmark, Briefcase, LayoutGrid, Award, BadgeCheck, ChevronDown, Clock, Newspaper, Calendar, Target, Zap, PieChart, Layers, Sparkles, LayoutDashboard, Mail as MailIcon, X, Languages, Moon, Sun, Monitor, Eye, ShieldCheck, Database, ZapOff, RefreshCcw, Bell, Trees, Waves, Flower2, Sunrise
} from 'lucide-react';

export type DashboardView = 
  | 'dashboard' | 'home' | 'resources' | 'news' | 'chat' | 'certificates' | 'profile' | 'edit-profile'
  | 'lessons' | 'progress' | 'group' | 'assignments' | 'admin' | 'users' 
  | 'org-panel' | 'staff' | 'child-progress' | 'settings' | 'upload' | 'performance-report' | 'requests' | 'logs' | 'invites' | 'curated';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onChangePasswordClick?: () => void;
  initialView?: DashboardView;
}

// Sub-component for Settings
const SettingsView: React.FC<{ user: User, currentTheme: string, onThemeChange: (t: string) => void, onChangePassword: () => void }> = ({ user, currentTheme, onThemeChange, onChangePassword }) => {
  const [lang, setLang] = useState('en-US');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [autoSave, setAutoSave] = useState(true);
  const [sync, setSync] = useState(true);
  const [recovery, setRecovery] = useState(true);
  const [fastLoad, setFastLoad] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  const ControlRow = ({ icon: Icon, title, desc, children, colorClass = "text-royal-600" }: any) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-6 bg-white border-2 border-gray-50 rounded-[1.5rem] md:rounded-[2rem] hover:border-royal-100 transition-all gap-2 md:gap-4">
      <div className="flex items-start gap-3 md:gap-4">
        <div className={`p-2 md:p-3 bg-gray-50 rounded-xl md:rounded-2xl shrink-0 ${colorClass}`}>
          <Icon size={18} className="md:size-6" />
        </div>
        <div className="min-w-0">
          <h4 className="font-black text-gray-900 uppercase tracking-tight text-[10px] md:text-base leading-tight">{title}</h4>
          <p className="text-[9px] md:text-sm text-gray-400 font-medium leading-tight mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="shrink-0 mt-2 md:mt-0">
        {children}
      </div>
    </div>
  );

  const Toggle = ({ enabled, setEnabled }: { enabled: boolean, setEnabled: (v: boolean) => void }) => (
    <button 
      onClick={() => setEnabled(!enabled)}
      className={`w-10 h-6 md:w-14 md:h-8 rounded-full transition-all relative p-1 shrink-0 ${enabled ? 'bg-royal-600 shadow-inner' : 'bg-gray-200'}`}
    >
      <div className={`w-4 h-4 md:w-6 md:h-6 bg-white rounded-full shadow-md transition-all transform ${enabled ? 'translate-x-4 md:translate-x-6' : 'translate-x-0'}`} />
    </button>
  );

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文 (简体)' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ar', name: 'العربية' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'it', name: 'Italiano' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'pl', name: 'Polski' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'th', name: 'ไทย' },
    { code: 'sw', name: 'Kiswahili' },
    { code: 'he', name: 'עברית' },
  ];

  const timezones = [
    "Pacific/Honolulu", "America/Anchorage", "America/Los_Angeles", "America/Phoenix", "America/Denver",
    "America/Chicago", "America/New_York", "America/Sao_Paulo", "America/St_Johns", "UTC",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Africa/Cairo",
    "Africa/Johannesburg", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka",
    "Asia/Bangkok", "Asia/Singapore", "Asia/Hong_Kong", "Asia/Tokyo", "Asia/Seoul",
    "Australia/Perth", "Australia/Adelaide", "Australia/Sydney", "Pacific/Auckland", "Pacific/Fiji"
  ];

  const themes = [
    { id: 'royal', label: 'Royal', icon: Sparkles, bg: 'bg-royal-900', text: 'text-white' },
    { id: 'midnight', label: 'Midnight', icon: Moon, bg: 'bg-gray-950', text: 'text-gray-200' },
    { id: 'parchment', label: 'Parchment', icon: BookOpen, bg: 'bg-[#f4ead5]', text: 'text-sepia-900' },
    { id: 'contrast', label: 'High Vis', icon: Eye, bg: 'bg-black', text: 'text-yellow-400' },
    { id: 'emerald', label: 'Emerald', icon: Trees, bg: 'bg-emerald-600', text: 'text-white' },
    { id: 'ocean', label: 'Ocean', icon: Waves, bg: 'bg-sky-600', text: 'text-white' },
    { id: 'rose', label: 'Rose', icon: Flower2, bg: 'bg-rose-600', text: 'text-white' },
    { id: 'amber', label: 'Amber', icon: Sunrise, bg: 'bg-amber-600', text: 'text-white' },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-royal-900 p-3 md:p-10 rounded-t-[1.5rem] md:rounded-t-[3rem] text-white relative overflow-hidden border-b-4 md:border-b-8 border-gold-500">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 flex items-center gap-3 md:gap-6">
          <div className="p-2 md:p-4 bg-white/10 rounded-xl md:rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl shrink-0">
            <Settings className="text-gold-400 animate-spin-slow w-5 h-5 md:w-10 md:h-10" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[10px] md:text-4xl font-serif font-black uppercase tracking-tight leading-tight">Account System</h2>
            <p className="text-royal-200 text-[6px] md:text-sm font-black uppercase tracking-tighter md:tracking-[0.3em] opacity-80 mt-0.5 leading-tight">Global & Role Aware Controls</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-12 rounded-b-[1.5rem] md:rounded-b-[3rem] shadow-2xl border-x border-b border-gray-100 space-y-6 md:space-y-12">
        
        <section className="space-y-3 md:space-y-6">
          <h3 className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] md:tracking-[0.4em] border-b border-gray-100 pb-1.5 ml-1 md:ml-2">Regional & Language</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <ControlRow icon={Languages} title="System Language" desc="Dialect for UI interaction.">
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
                className="bg-gray-50 border-2 border-gray-100 rounded-lg px-2 py-1 md:px-4 md:py-2 font-bold text-gray-800 outline-none focus:border-royal-500 transition-all w-full md:w-auto text-[10px] md:text-sm"
              >
                {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </ControlRow>
            <ControlRow icon={Clock} title="Time Zone" desc="Identified automatically.">
              <select 
                value={timezone} 
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-gray-50 border-2 border-gray-100 rounded-lg px-2 py-1 md:px-4 md:py-2 font-bold text-gray-800 outline-none focus:border-royal-500 transition-all w-full md:max-w-[200px] text-[10px] md:text-sm"
              >
                <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>Automatic ({Intl.DateTimeFormat().resolvedOptions().timeZone})</option>
                {timezones.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
              </select>
            </ControlRow>
          </div>
        </section>

        <section className="space-y-3 md:space-y-6">
          <h3 className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] md:tracking-[0.4em] border-b border-gray-100 pb-1.5 ml-1 md:ml-2">Personalized Atmosphere</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {themes.map(t => (
              <button 
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={`flex flex-col items-center gap-1.5 md:gap-3 p-3 md:p-6 rounded-[1rem] md:rounded-[2rem] border-2 md:border-4 transition-all ${currentTheme === t.id ? 'border-royal-600 ring-2 md:ring-4 ring-royal-50 scale-105' : 'border-gray-100 hover:border-royal-200'}`}
              >
                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg ${t.bg} ${t.text}`}>
                  <t.icon size={16} className="md:size-6" />
                </div>
                <span className="font-black text-[8px] md:text-[10px] uppercase tracking-wider">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 md:space-y-6">
          <h3 className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] md:tracking-[0.4em] border-b border-gray-100 pb-1.5 ml-1 md:ml-2">Discipleship Performance</h3>
          <div className="space-y-2 md:space-y-4">
            <ControlRow icon={Save} title="Intelligence AutoSave" desc="Preserve progress." colorClass="text-emerald-600">
              <Toggle enabled={autoSave} setEnabled={setAutoSave} />
            </ControlRow>
            <ControlRow icon={RefreshCcw} title="Session Recovery" desc="Restore unsubmitted." colorClass="text-orange-500">
              <Toggle enabled={recovery} setEnabled={setRecovery} />
            </ControlRow>
            <ControlRow icon={Zap} title="Fast Load Engine" desc="Instant transitions." colorClass="text-gold-600">
              <Toggle enabled={fastLoad} setEnabled={setFastLoad} />
            </ControlRow>
            <ControlRow icon={Monitor} title="Device Sync" desc="Cross-device status." colorClass="text-indigo-600">
              <Toggle enabled={sync} setEnabled={setSync} />
            </ControlRow>
          </div>
        </section>

        <section className="space-y-3 md:space-y-6">
          <h3 className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] md:tracking-[0.4em] border-b border-gray-100 pb-1.5 ml-1 md:ml-2">Privacy & Compliance</h3>
          <div className="bg-gray-50 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 border-2 border-dashed border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <ShieldCheck className="text-emerald-500" size={18} />
                  <h4 className="font-black text-gray-900 uppercase text-[10px] md:text-xs">Security Verified</h4>
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[8px] md:text-[10px] font-black text-gray-500">GDPR</span>
                  <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[8px] md:text-[10px] font-black text-gray-500">FERPA</span>
                </div>
                <p className="text-[9px] md:text-xs text-gray-400 leading-tight font-medium">Data protection protocols are active and verified.</p>
              </div>
              <div className="space-y-3 md:space-y-4">
                <ControlRow icon={Database} title="Anonymize Session" desc="Hide metrics." colorClass="text-purple-600">
                  <Toggle enabled={privacyMode} setEnabled={setPrivacyMode} />
                </ControlRow>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-2 md:pt-6">
          <div className="bg-royal-50 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-royal-100 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-4 bg-royal-800 text-white rounded-xl md:rounded-2xl shadow-xl shrink-0">
                <Key size={20} className="md:size-6" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 uppercase text-[11px] md:text-base">System Access</h4>
                <p className="text-[9px] md:text-sm text-royal-600 font-medium">Update master password.</p>
              </div>
            </div>
            <button 
              onClick={onChangePassword}
              className="w-full md:w-auto px-6 md:px-10 py-3 md:py-4 bg-royal-800 text-white font-black rounded-xl md:rounded-2xl hover:bg-black transition-all shadow-xl border-b-4 border-royal-950 flex items-center justify-center gap-2 uppercase text-[9px] md:text-xs"
            >
              Update Security Code
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

// Sub-component for Profile Display
const ProfileView: React.FC<{ user: User, completedCount: number, onEdit: () => void }> = ({ user, completedCount, onEdit }) => (
  <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
      <div className="bg-royal-900 h-48 relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl">
            <div className="w-full h-full rounded-[2rem] bg-royal-100 flex items-center justify-center overflow-hidden border-4 border-royal-50">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={80} className="text-royal-300" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-20 pb-12 px-8 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-serif font-black text-gray-900 mb-2 uppercase tracking-tight">{user.name}</h1>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-1 bg-royal-100 text-royal-700 rounded-full text-xs font-black uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
              <span className="px-4 py-1 bg-gold-50 text-gold-600 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-gold-100">
                <Shield size={12} /> VERIFIED ACCOUNT
              </span>
            </div>
          </div>
          <button 
            onClick={onEdit}
            className="w-full md:w-auto px-8 py-3 bg-royal-800 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl border-b-4 border-royal-950 uppercase text-sm"
          >
            <Edit3 size={18} /> Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100 pb-2">Identification</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="p-3 bg-gray-50 rounded-2xl text-royal-600 group-hover:bg-royal-600 group-hover:text-white transition-all"><MailIcon size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Email Address</p>
                  <p className="font-bold text-gray-800 text-sm md:text-base">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="p-3 bg-gray-50 rounded-2xl text-royal-600 group-hover:bg-royal-600 group-hover:text-white transition-all"><Users size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Primary Role</p>
                  <p className="font-bold text-gray-800 uppercase tracking-wide text-sm md:text-base">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100 pb-2">Engagement</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="p-3 bg-gray-50 rounded-2xl text-gold-600 group-hover:bg-gold-500 group-hover:text-white transition-all"><Clock size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Last Recorded Session</p>
                  <p className="font-bold text-gray-800 text-sm md:text-base">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First Session'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="p-3 bg-gray-50 rounded-2xl text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all"><Award size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Certificates Earned</p>
                  <p className="font-bold text-gray-800 text-sm md:text-base">{completedCount} Validated Credentials</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Sub-component for Profile Editing
const EditProfileView: React.FC<{ user: User, onUpdate: (u: User) => void, onCancel: () => void }> = ({ user, onUpdate, onCancel }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isSaving, setIsSaving] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(user.avatarUrl);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewAvatar(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await authService.updateProfile(user.id, { name, email, avatarUrl: previewAvatar });
      onUpdate(updated);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-10 border-b-2 border-gray-50 pb-6">
          <h2 className="text-2xl md:text-3xl font-serif font-black text-gray-900 uppercase tracking-tight">Edit Identity</h2>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group/avatar">
              <div className="w-32 h-32 rounded-[2rem] bg-royal-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                {previewAvatar ? <img src={previewAvatar} alt="preview" className="w-full h-full object-cover" /> : <UserCircle size={64} className="text-royal-200" />}
              </div>
              <button 
                type="button"
                onClick={() => document.getElementById('avatar-input')?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]"
              >
                <Camera size={32} className="text-white" />
              </button>
              <input id="avatar-input" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Profile Photo</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 block mb-2">Full Name</label>
              <input 
                required 
                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-royal-500 outline-none transition-all font-bold text-gray-800"
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 block mb-2">Email Address</label>
              <input 
                required 
                type="email" 
                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-royal-500 outline-none transition-all font-bold text-gray-800"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 block mb-2">Role Perspective</label>
              <div className="p-4 bg-gray-100 rounded-2xl font-black text-gray-400 uppercase tracking-widest text-sm border-2 border-dashed border-gray-200 cursor-not-allowed">
                {user.role.replace('_', ' ')} (Locked System Permission)
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-[2] py-4 bg-royal-800 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs border-b-4 border-royal-950"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Update Identity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ScrollReveal = ({ children, className = "", delay = 0 }: { children?: React.ReactNode, className?: string, delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-1000 ease-out transform ${isVisible 
        ? 'opacity-100 translate-y-0 scale-100 filter brightness-110 contrast-125 saturate-125' 
        : 'opacity-100 translate-y-4 scale-95 filter brightness-100 contrast-100'}`}
    >
      {children}
    </div>
  );
};

const MiniPieChart = ({ percent, color, bgColor }: { percent: number, color: string, bgColor: string }) => {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="20" cy="20" r={radius} stroke={bgColor} strokeWidth="3" fill="none" />
        <circle cx="20" cy="20" r={radius} stroke={color} strokeWidth="3" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <span className="absolute text-[8px] font-black" style={{ color }}>{Math.round(percent)}%</span>
    </div>
  );
};

const ConsoleDropdown = ({ label, items, primaryColorClass, direction = 'down' }: { label: string, items: DropdownOption[], primaryColorClass: string, direction?: 'up' | 'down' }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs md:text-sm tracking-[0.3em] transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl border-b-[8px] ${primaryColorClass} text-white uppercase group overflow-hidden relative z-[101]`}>
        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-1000 ease-in-out -skew-x-12 -translate-x-full pointer-events-none"></div>
        <span className="relative z-10">{label}</span>
        <ChevronDown size={18} className={`relative z-10 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setIsOpen(false)} />}
      {isOpen && (
        <div className={`absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-[16rem] md:w-[20rem] bg-white rounded-[2.2rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.4)] border border-gray-100 p-2.5 md:p-3 z-[150] animate-in fade-in zoom-in-95 duration-300 ${direction === 'up' ? 'bottom-full mb-4 origin-bottom slide-in-from-bottom-4' : 'top-full mt-4 origin-top slide-in-from-top-4'}`}>
          <div className="flex flex-col gap-1 md:gap-1.5">
            {items.map((item, idx) => (
              <button key={idx} onClick={() => { item.action(); setIsOpen(false); }} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-[1.4rem] md:rounded-[1.6rem] transition-all duration-300 group/item hover:scale-[1.03] ${item.hoverBg} text-left active:scale-95`}>
                <div className={`p-2 md:p-2.5 rounded-xl shadow-lg transition-all duration-500 ${item.color} group-hover/item:scale-110 group-hover/item:shadow-[0_0_20px_rgba(0,0,0,0.2)]`} style={{ filter: `drop-shadow(0 0 8px ${item.glowColor}90)` }}><item.icon size={16} /></div>
                <div className="flex flex-col"><span className="font-black text-[10px] md:text-sm uppercase tracking-[0.1em] text-gray-700 group-hover/item:text-gray-950 transition-colors leading-tight">{item.label}</span><div className="h-0.5 w-0 group-hover/item:w-full transition-all duration-500 rounded-full mt-0.5" style={{ backgroundColor: item.glowColor }}></div></div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownOption {
  label: string; icon: React.ElementType; action: () => void; color: string; glowColor: string; hoverBg: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onChangePasswordClick, initialView = 'dashboard' }) => {
  const [internalView, setInternalView] = useState<DashboardView>(initialView);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [recentChats, setRecentChats] = useState<ChatMessage[]>([]);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [learningMetrics, setLearningMetrics] = useState({ lastLesson: null, lastModuleProgress: 0, lastLessonTime: 0, lastModuleTime: 0, completedModulesCount: 0, totalModulesCount: 1, lastLessonScore: 0 });
  
  // Lifted Theme State
  const [theme, setTheme] = useState(localStorage.getItem('bbl_theme') || 'royal');

  useEffect(() => { setInternalView(initialView); }, [initialView]);

  // Unified Theme Controller
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-midnight', 'theme-parchment', 'theme-contrast', 'theme-emerald', 'theme-ocean', 'theme-rose', 'theme-amber');
    if (theme !== 'royal') {
      root.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('bbl_theme', theme);
  }, [theme]);

  useEffect(() => {
    authService.getRecentMessages(user, 4).then(setRecentChats);
    lessonService.getNews().then(items => {
        const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentNews(sorted.slice(0, 2));
    });
    calculateLearningPath();
  }, [user]);

  const calculateLearningPath = async () => {
    const allLessons = await lessonService.getLessons();
    const allModules = await lessonService.getModules();
    let lastLId = null;
    const history = localStorage.getItem('bbl_db_attempts') ? JSON.parse(localStorage.getItem('bbl_db_attempts')!) : [];
    const userHistory = history.filter((h: StudentAttempt) => h.studentId === user.id).sort((a: any, b: any) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime());
    if (userHistory.length > 0) lastLId = userHistory[0].lessonId;
    if (lastLId) {
      const lastLesson = allLessons.find(l => l.id === lastLId);
      if (lastLesson) {
        const progress = await lessonService.getModuleProgress(user.id, lastLesson.moduleId);
        const lastLessonTime = await lessonService.getQuizTimer(user.id, lastLesson.id);
        const moduleLessons = allLessons.filter(l => l.moduleId === lastLesson.moduleId);
        let modTime = 0;
        for(const ml of moduleLessons) modTime += await lessonService.getQuizTimer(user.id, ml.id);
        let completedCount = 0;
        for(const m of allModules) {
          const mProg = await lessonService.getModuleProgress(user.id, m.id);
          if (mProg.completed >= mProg.total && mProg.total > 0) completedCount++;
        }
        const lastLessonAttempts = userHistory.filter((h: any) => h.lessonId === lastLId);
        const uniqueQInLastLesson = lastLesson.sections.reduce((acc, s) => acc + (s.quizzes?.length || 0), 0);
        const uniqueCorrect = new Set(lastLessonAttempts.filter((a: any) => a.isCorrect).map((a: any) => a.quizId)).size;
        const scorePerc = uniqueQInLastLesson > 0 ? (uniqueCorrect / uniqueQInLastLesson) * 100 : 0;
        setLearningMetrics({ lastLesson: lastLesson as any, lastModuleProgress: Math.round((progress.completed / progress.total) * 100) || 0, lastLessonTime, lastModuleTime: modTime, completedModulesCount: completedCount, totalModulesCount: allModules.length || 1, lastLessonScore: scorePerc });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const renderHomeDashboard = () => {
    const isStudent = user.role === UserRole.STUDENT;
    const isParent = user.role === UserRole.PARENT;
    const canManageContent = [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.ORGANIZATION].includes(user.role);
    const firstName = user.name.split(' ')[0];

    const personalItems: DropdownOption[] = [
      { label: "TAKE LESSONS", icon: Play, action: () => setInternalView('lessons'), color: "bg-indigo-600 text-white", glowColor: "#4f46e5", hoverBg: "hover:bg-indigo-50" },
    ];
    if (canManageContent) personalItems.push({ label: "UPLOAD CONTENT", icon: Upload, action: () => setInternalView('upload'), color: "bg-emerald-500 text-white", glowColor: "#10b981", hoverBg: "hover:bg-emerald-50" });
    personalItems.push(
      { label: "PERFORMANCE", icon: Trophy, action: () => setInternalView('performance-report'), color: "bg-indigo-700 text-white", glowColor: "#4338ca", hoverBg: "hover:bg-indigo-50" },
      { label: "MY LIST", icon: Bookmark, action: () => setInternalView('curated'), color: "bg-purple-600 text-white", glowColor: "#9333ea", hoverBg: "hover:bg-purple-50" },
      { label: "MY CERTIFICATES", icon: BadgeCheck, action: () => setInternalView('certificates'), color: "bg-gold-500 text-white", glowColor: "#f59e0b", hoverBg: "hover:bg-yellow-50" }
    );

    const groupItems: DropdownOption[] = [];
    if (canManageContent) groupItems.push({ label: "REQUESTS", icon: UserPlus, action: () => setInternalView('requests'), color: "bg-amber-500 text-white", glowColor: "#f59e0b", hoverBg: "hover:bg-amber-50" });
    groupItems.push(
      { label: "MEMBERS", icon: Users, action: () => setInternalView('users'), color: "bg-indigo-700 text-white", glowColor: "#4338ca", hoverBg: "hover:bg-indigo-50" },
      { label: "INVITES", icon: Mail, action: () => setInternalView('invites'), color: "bg-blue-600 text-white", glowColor: "#2563eb", hoverBg: "hover:bg-blue-50" },
      { label: "ANALYTICS", icon: BarChart3, action: () => setInternalView('performance-report'), color: "bg-gold-500 text-white", glowColor: "#f59e0b", hoverBg: "hover:bg-yellow-50" },
      { label: "CURRICULUM", icon: LayoutGrid, action: () => setInternalView('lessons'), color: "bg-purple-600 text-white", glowColor: "#9333ea", hoverBg: "hover:bg-purple-50" }
    );
    if (canManageContent || isParent) groupItems.push({ label: "AUDIT LOGS", icon: History, action: () => setInternalView('logs'), color: "bg-slate-600 text-white", glowColor: "#475569", hoverBg: "hover:bg-slate-50" });

    return (
      <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
          <div className="bg-white p-5 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 lg:max-w-[70%] lg:mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative z-10 text-center md:text-left">
                  <div className="relative group/avatar">
                    <button onClick={() => setInternalView('edit-profile')} className="w-16 h-16 md:w-24 md:h-24 rounded-3xl md:rounded-[2.5rem] bg-royal-900 flex items-center justify-center text-gold-400 font-serif font-black shadow-2xl ring-6 md:ring-8 ring-royal-50/50 overflow-hidden relative">
                      {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : <UserCircle size={48} className="md:w-16 md:h-16" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center"><Camera size={24} className="text-white" /></div>
                    </button>
                  </div>
                  <div>
                      <h1 className="text-xl md:text-4xl font-serif font-black text-gray-900 tracking-tight leading-tight uppercase">WELCOME BACK, <span className="text-royal-700">{firstName}</span></h1>
                      <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-royal-950 text-white rounded-xl shadow-xl border border-white/10">
                          <Sparkles size={20} className="text-gold-400 animate-pulse" />
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">{user.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                  </div>
              </div>
              <button onClick={() => setInternalView('edit-profile')} className="w-full md:w-auto flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs md:text-sm hover:bg-indigo-700 shadow-2xl transition-all transform hover:-translate-y-1 border-b-[4px] border-indigo-900 uppercase">
                <Edit3 size={18} /> EDIT PROFILE
              </button>
          </div>

          <div className="flex flex-col gap-6 md:gap-10 relative">
              <div className="bg-gradient-to-br from-indigo-700 via-royal-800 to-royal-900 rounded-[2.2rem] md:rounded-[2.8rem] p-5 md:p-8 shadow-[0_30px_80px_-20px_rgba(30,27,75,0.4)] relative border-b-[10px] border-indigo-950 w-full lg:max-w-[60%] lg:mx-auto">
                  <div className="flex flex-col relative z-10 gap-3"><div className="flex items-center gap-2.5"><div className="p-2 bg-white/10 text-white rounded-xl border border-white/20 backdrop-blur-2xl"><UserCircle size={24} /></div><h3 className="font-serif font-black text-white uppercase text-base md:text-2xl tracking-[0.15em]">Personal Console</h3></div><p className="text-indigo-50 text-[10px] md:text-base font-medium opacity-90 italic">Your inner sanctuary for growth. Track transformations, curate your library, and verify achievements.</p><div className="mt-2"><ConsoleDropdown label="CLICK HERE" items={personalItems} direction="up" primaryColorClass="bg-indigo-600 hover:bg-indigo-500 border-indigo-900 shadow-indigo-950/60" /></div></div>
              </div>
              {!isStudent && (
                <div className={`bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-[2.2rem] md:rounded-[2.8rem] p-5 md:p-8 border-t-[10px] ${isParent ? 'border-indigo-400' : 'border-gold-500'} shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] relative w-full lg:max-w-[60%] lg:mx-auto`}>
                    <div className="flex flex-col relative z-10 gap-3"><div className="flex items-center gap-2.5"><div className="p-2 bg-white/5 text-gold-400 rounded-xl border border-white/10 backdrop-blur-2xl">{isParent ? <Heart size={24} className="text-rose-400"/> : <Users size={24}/>}</div><h3 className="font-serif font-black text-white uppercase text-base md:text-2xl tracking-[0.15em]">{isParent ? "My Child's Console" : "Group Console"}</h3></div><p className="text-amber-50 text-[10px] md:text-base font-medium opacity-90 italic">{isParent ? "Oversee spiritual foundations. Audit logs, track modules, and manage credentials." : "Command center for community oversight. Manage invites, validate requests, and analyze performance."}</p><div className="mt-2"><ConsoleDropdown label="CLICK HERE" items={groupItems} direction="down" primaryColorClass={isParent ? "bg-indigo-500 hover:bg-indigo-400 border-indigo-900 shadow-black/70" : "bg-gold-500 hover:bg-gold-400 border-gold-800 shadow-black/70"} /></div></div>
                </div>
              )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-14 relative z-0 lg:max-w-[90%] lg:mx-auto">
              <div className="lg:col-span-2 space-y-8 md:space-y-14">
                  <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border-2 border-gray-50 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b-4 border-royal-50 pb-6 gap-4">
                         <div className="flex items-center gap-2.5 md:gap-4"><div className="p-2 bg-royal-900 text-gold-400 rounded-2xl shadow-xl"><Newspaper size={24} /></div><h3 className="font-serif font-black text-gray-900 text-lg md:text-3xl uppercase tracking-tighter">News & Updates</h3></div>
                         <button onClick={() => setInternalView('news')} className="px-6 py-2.5 bg-royal-800 hover:bg-royal-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl border-b-4 border-royal-950 flex items-center gap-2">VIEW ARCHIVE <ArrowRight size={14} /></button>
                      </div>
                      <div className="space-y-8">
                         {recentNews.length > 0 ? recentNews.map(item => (
                             <div key={item.id} className="relative pl-10 border-l-4 border-royal-100 hover:border-royal-600 transition-colors group/news">
                                 <div className="absolute -left-[10px] top-0 w-4 h-4 rounded-full bg-white border-4 border-royal-100 group-hover/news:border-royal-600 transition-all"></div>
                                 <div className="flex flex-col md:flex-row justify-between items-center mb-3 gap-2"><span className="px-3 py-1 bg-royal-50 text-royal-700 text-[9px] font-black rounded-full uppercase tracking-widest">{item.category}</span><div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase"><span><Calendar size={12}/> {new Date(item.date).toLocaleDateString()}</span></div></div>
                                 <h4 className="font-serif font-black text-xl md:text-2xl text-gray-900 leading-tight group-hover/news:text-royal-600">{item.title}</h4>
                                 <p className="mt-2 text-gray-500 text-sm md:text-base font-medium line-clamp-1 opacity-80">{item.content}</p>
                             </div>
                         )) : <div className="text-center py-10 opacity-40 italic">Waiting for system updates...</div>}
                      </div>
                  </div>
                  
                  <div className="p-3 md:p-4 bg-white rounded-[2rem] md:rounded-[2.5rem] border-4 border-royal-100 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] flex flex-col gap-3 group relative overflow-hidden">
                      <div className="flex flex-col md:flex-row items-center gap-4 relative z-10">
                          <div className="p-3 bg-royal-900 rounded-[1.4rem] text-gold-400 shrink-0 shadow-2xl border-b-[5px] border-royal-950"><Globe size={22}/></div>
                          <div className="text-center md:text-left flex-1">
                              <h4 className="font-serif font-black text-gray-950 text-base md:text-xl uppercase tracking-tighter">Active Learning Path</h4>
                              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                                <p className="text-[10px] md:text-xs text-gray-500 font-bold opacity-80">Continue your discipleship journey. Your next milestone is moments away.</p>
                                <button onClick={() => learningMetrics.lastLesson && setSelectedLessonId((learningMetrics.lastLesson as any).id)} className="px-7 py-2.5 bg-royal-800 hover:bg-black text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 border-b-2 border-royal-950 flex items-center gap-1.5">CONTINUE <ArrowRight size={14} /></button>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                          <ScrollReveal className="lg:col-span-2" delay={100}>
                            <div className="space-y-2 bg-white p-2.5 rounded-2xl border-4 border-indigo-400 shadow-sm group/stat hover:border-indigo-600 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2.5"><div className="p-2 bg-royal-100 text-royal-700 rounded-lg group-hover/stat:bg-royal-600 group-hover/stat:text-white transition-colors shadow-sm"><Layers size={16} /></div><div><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none">Module Progress</h5><p className="text-[9px] font-bold text-gray-400 truncate max-w-[80px]">{(learningMetrics.lastLesson as any)?.moduleId || 'N/A'}</p></div></div>
                                    <span className="text-xl font-black text-royal-950 leading-none">{learningMetrics.lastModuleProgress}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-gray-50 rounded-full border border-royal-50 overflow-hidden p-0.5"><div className="h-full bg-gradient-to-r from-royal-600 to-royal-400 rounded-full transition-all duration-1000" style={{ width: `${learningMetrics.lastModuleProgress}%` }} /></div>
                            </div>
                          </ScrollReveal>

                          <ScrollReveal delay={200}>
                            <div className="bg-white p-2.5 rounded-2xl border-4 border-gold-400 flex items-center gap-2.5 shadow-sm group/stat hover:border-gold-600 transition-all h-full">
                                <div className="p-2 bg-gold-50 text-gold-600 rounded-lg group-hover/stat:bg-gold-500 group-hover/stat:text-white transition-colors shadow-sm shrink-0"><Award size={16} /></div>
                                <div className="min-w-0"><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">Mastered</h5><div className="flex items-baseline gap-1"><span className="text-xl font-black text-royal-950 leading-none">{learningMetrics.completedModulesCount}</span><span className="text-[10px] text-gray-300 font-bold">/ {learningMetrics.totalModulesCount}</span></div></div>
                            </div>
                          </ScrollReveal>

                          <ScrollReveal delay={300}>
                            <div className="bg-white p-2.5 rounded-2xl border-4 border-royal-500 flex items-center gap-2.5 shadow-sm group/stat hover:border-royal-700 transition-all h-full">
                                <div className="min-w-0 flex items-center gap-1.5"><MiniPieChart percent={learningMetrics.lastLessonScore} color="#4f46e5" bgColor="#e0e7ff" /><div><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">Precision</h5><span className="text-xl font-black text-royal-950 leading-none">{Math.round(learningMetrics.lastLessonScore)}%</span></div></div>
                            </div>
                          </ScrollReveal>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <ScrollReveal delay={400} className="w-full">
                            <div className="flex items-center gap-2.5 p-2.5 bg-white border-4 border-amber-400 rounded-2xl shadow-sm hover:shadow-xl hover:border-amber-500 transition-all group/time">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover/time:bg-amber-500 group-hover/time:text-white transition-colors shadow-sm"><Clock size={20} /></div>
                                <div><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">Last Session</h5><p className="text-lg md:text-xl font-black text-gray-900 leading-none">{formatTime(learningMetrics.lastLessonTime)}</p></div>
                            </div>
                          </ScrollReveal>
                          <ScrollReveal delay={500} className="w-full">
                            <div className="flex items-center gap-2.5 p-2.5 bg-white border-4 border-emerald-400 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all group/time">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover/time:bg-emerald-500 group-hover/time:text-white transition-colors shadow-sm"><History size={20} /></div>
                                <div><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">Total Effort</h5><p className="text-lg md:text-xl font-black text-gray-900 leading-none">{formatTime(learningMetrics.lastModuleTime)}</p></div>
                            </div>
                          </ScrollReveal>
                      </div>
                  </div>
              </div>

              <div className="space-y-8 md:space-y-14">
                  <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border-2 border-gray-50 shadow-2xl">
                      <h3 className="font-serif font-black text-gray-900 text-base md:text-2xl uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                        <div className="p-2 bg-royal-900 text-white rounded-2xl shadow-lg"><MessageSquare size={22} /></div> RECENT CHATS
                      </h3>
                      <div className="space-y-6">
                          {recentChats.map(m => (
                                <div key={m.id} className="p-4 rounded-3xl bg-gray-50/50 hover:bg-white border-2 border-transparent hover:border-royal-100 hover:shadow-xl transition-all group cursor-pointer" onClick={() => setInternalView('chat')}>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white flex items-center justify-center font-black text-royal-700 border border-royal-100 shrink-0 shadow-sm relative group-hover:scale-110 transition-transform">{m.senderName.charAt(0)}<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div></div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-center mb-1.5"><span className="text-[10px] font-black text-royal-600 uppercase tracking-[0.2em]">{m.senderName}</span><span className="text-[9px] font-bold text-gray-400"><Clock size={10} /> {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                            <p className="text-sm md:text-base font-serif font-black text-royal-950 leading-snug line-clamp-2 tracking-tight">"{m.text}"</p>
                                        </div>
                                    </div>
                                </div>
                          ))}
                      </div>
                      <button onClick={() => setInternalView('chat')} className="w-full mt-10 py-5 bg-royal-900 text-white text-[10px] font-black rounded-[1.5rem] hover:bg-black uppercase tracking-[0.3em] transition-all shadow-2xl border-b-[5px] border-black">OPEN CHATS APP</button>
                  </div>
              </div>
          </div>
          <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} currentUser={user} />
      </div>
    );
  };

  const renderView = () => {
    if (selectedLessonId) return <LessonViewWrapper lessonId={selectedLessonId} user={user} onBack={() => setSelectedLessonId(null)} />;
    switch (internalView) {
      case 'upload': return <LessonUpload currentUser={user} onSuccess={() => setInternalView('dashboard')} onCancel={() => setInternalView('dashboard')} />;
      case 'admin': case 'users': case 'requests': case 'logs': case 'invites': case 'curated': case 'news': case 'resources':
        return <AdminPanel currentUser={user} activeTab={internalView === 'dashboard' ? 'users' : internalView as any} onTabChange={(tab: any) => setInternalView(tab)} onBack={() => setInternalView('dashboard')} />;
      case 'org-panel': case 'staff': return <OrganizationPanel currentUser={user} />;
      case 'lessons': case 'progress': return user.role === UserRole.STUDENT ? <StudentPanel currentUser={user} activeTab={internalView === 'lessons' ? 'lessons' : 'browse'} onTakeLesson={setSelectedLessonId} /> : <AdminPanel currentUser={user} activeTab="lessons" onTabChange={(tab: any) => setInternalView(tab)} onBack={() => setInternalView('dashboard')} />;
      case 'group' : case 'assignments': return <AdminPanel currentUser={user} activeTab={internalView === 'group' ? 'requests' : 'lessons'} onTabChange={(tab: any) => setInternalView(tab)} onBack={() => setInternalView('dashboard')} />;
      case 'resources': return <ResourceView />;
      case 'news': return <NewsView />;
      case 'chat': return <ChatPanel currentUser={user} />;
      case 'certificates': return <CertificatesPanel currentUser={user} />;
      case 'performance-report': return <PerformanceReport currentUser={user} onBack={() => setInternalView('dashboard')} />;
      case 'profile': return <ProfileView user={user} completedCount={learningMetrics.completedModulesCount} onEdit={() => setInternalView('edit-profile')} />;
      case 'edit-profile': return <EditProfileView user={user} onUpdate={(u) => { onUpdateUser(u); setInternalView('profile'); }} onCancel={() => setInternalView('profile')} />;
      case 'settings': return <SettingsView user={user} currentTheme={theme} onThemeChange={setTheme} onChangePassword={onChangePasswordClick || (() => {})} />;
      case 'dashboard': default: return renderHomeDashboard();
    }
  };

  return (<div className="max-w-7xl mx-auto space-y-4 md:space-y-8 relative"><FrontendEngineerBadge />{renderView()}</div>);
};

const LessonViewWrapper = ({ lessonId, user, onBack }: any) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  useEffect(() => { lessonService.getLessonById(lessonId).then(l => setLesson(l || null)); }, [lessonId]);
  if (!lesson) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-royal-600" size={48} /></div>;
  return <LessonView lesson={lesson} currentUser={user} onBack={onBack} />;
};

export default Dashboard;
