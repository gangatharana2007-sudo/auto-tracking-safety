import React, { useState } from 'react';
import { 
  Radio, 
  ShieldAlert, 
  MapPin, 
  Cpu, 
  Compass, 
  Database, 
  Award, 
  Sun, 
  Moon, 
  Contrast, 
  Globe, 
  Fingerprint, 
  Bell, 
  UserCheck, 
  Car 
} from 'lucide-react';
import { LanguageCode, UserRole } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { triggerHaptic } from '../utils/haptics';

interface TopNavigationProps {
  currentTab: 'map' | 'inspector' | 'geofence' | 'queue' | 'dashboard';
  onSelectTab: (tab: 'map' | 'inspector' | 'geofence' | 'queue' | 'dashboard') => void;
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  userRole: UserRole;
  onToggleRole: () => void;
  onOpenSOS: () => void;
  onOpenBiometric: () => void;
  isBiometricVerified: boolean;
  queuedMessagesCount: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onSelectTab,
  language,
  onSelectLanguage,
  darkMode,
  onToggleDarkMode,
  highContrast,
  onToggleHighContrast,
  userRole,
  onToggleRole,
  onOpenSOS,
  onOpenBiometric,
  isBiometricVerified,
  queuedMessagesCount
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const t = TRANSLATIONS[language];

  const handleNavClick = (tab: 'map' | 'inspector' | 'geofence' | 'queue' | 'dashboard') => {
    triggerHaptic('tap');
    onSelectTab(tab);
  };

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
      highContrast 
        ? 'bg-black border-amber-400 text-yellow-300' 
        : darkMode 
          ? 'bg-slate-950/90 border-slate-800 text-slate-100' 
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
    }`}>
      {/* Zone 1, 2, 3 Single-Row Contract */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Zone 1: Single Text Element Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => handleNavClick('map')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-amber-500 rounded-sm"
            aria-label="KavachMesh Home"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm tracking-wider ${
              highContrast ? 'bg-yellow-400 text-black' : 'bg-amber-500 text-slate-950 shadow-sm'
            }`}>
              KM
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight leading-none">
                {t.appName}
              </span>
              <span className={`text-[10px] sm:text-xs font-mono tracking-tight leading-none mt-1 ${
                highContrast ? 'text-yellow-400' : darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                P2P Auto Safety Mesh
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleNavClick('map')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'map'
                ? highContrast
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'bg-amber-500/15 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{t.navMap}</span>
          </button>

          <button
            onClick={() => handleNavClick('inspector')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'inspector'
                ? highContrast
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'bg-amber-500/15 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{t.navInspector}</span>
          </button>

          <button
            onClick={() => handleNavClick('geofence')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'geofence'
                ? highContrast
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'bg-amber-500/15 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t.navGeofence}</span>
          </button>

          <button
            onClick={() => handleNavClick('queue')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap relative ${
              currentTab === 'queue'
                ? highContrast
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'bg-amber-500/15 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{t.navQueue}</span>
            {queuedMessagesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            )}
          </button>

          <button
            onClick={() => handleNavClick('dashboard')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'dashboard'
                ? highContrast
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'bg-amber-500/15 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{t.navDashboard}</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions & Preferences */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Role Switcher */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              onToggleRole();
            }}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              userRole === 'driver'
                ? highContrast 
                  ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="Toggle between Auto Driver and Passenger View"
            aria-label="Switch User Mode"
          >
            {userRole === 'driver' ? <Car className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            <span className="truncate max-w-[100px]">{userRole === 'driver' ? t.driverRole : t.passengerRole}</span>
          </button>

          {/* Biometric Status / Trigger */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              onOpenBiometric();
            }}
            className={`p-2 rounded-lg border transition-colors relative ${
              isBiometricVerified
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                : 'border-slate-700 text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
            title={isBiometricVerified ? t.biometricSuccess : t.biometricVerify}
            aria-label={t.biometricVerify}
          >
            <Fingerprint className="w-4 h-4" />
            {isBiometricVerified && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          {/* High Contrast Mode Toggle */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              onToggleHighContrast();
            }}
            className={`p-2 rounded-lg border transition-colors ${
              highContrast
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'border-slate-700 text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
            title={t.highContrast}
            aria-label={t.highContrast}
          >
            <Contrast className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              onToggleDarkMode();
            }}
            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 bg-slate-800/60 transition-colors"
            title={t.darkMode}
            aria-label={t.darkMode}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic('tap');
                setLangMenuOpen(!langMenuOpen);
              }}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 bg-slate-800/60 transition-colors flex items-center gap-1"
              title={t.language}
              aria-label="Select Language"
              aria-expanded={langMenuOpen}
            >
              <Globe className="w-4 h-4" />
              <span className="text-[11px] font-mono uppercase font-semibold">{language}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-50 text-xs">
                {(['en', 'ta', 'es', 'fr'] as LanguageCode[]).map((code) => {
                  const names: Record<LanguageCode, string> = {
                    en: 'English',
                    ta: 'தமிழ் (Tamil)',
                    es: 'Español',
                    fr: 'Français'
                  };
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        onSelectLanguage(code);
                        setLangMenuOpen(false);
                        triggerHaptic('tap');
                      }}
                      className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between ${
                        language === code
                          ? 'bg-amber-500/20 text-amber-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{names[code]}</span>
                      {language === code && <span className="text-amber-400">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Big SOS Primary Action Button */}
          <button
            onClick={() => {
              triggerHaptic('sos');
              onOpenSOS();
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-1.5 whitespace-nowrap animate-pulse ${
              highContrast
                ? 'bg-red-600 text-white hover:bg-red-700 border-2 border-yellow-300'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
            }`}
            aria-label="Trigger Emergency SOS"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="truncate">{t.sosButton}</span>
          </button>
        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-1.5 bg-slate-950/80 text-[11px] font-medium overflow-x-auto">
        <button
          onClick={() => handleNavClick('map')}
          className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap ${
            currentTab === 'map' ? 'text-amber-400 bg-amber-500/10 font-semibold' : 'text-slate-400'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{t.navMap}</span>
        </button>
        <button
          onClick={() => handleNavClick('inspector')}
          className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap ${
            currentTab === 'inspector' ? 'text-amber-400 bg-amber-500/10 font-semibold' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{t.navInspector}</span>
        </button>
        <button
          onClick={() => handleNavClick('geofence')}
          className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap ${
            currentTab === 'geofence' ? 'text-amber-400 bg-amber-500/10 font-semibold' : 'text-slate-400'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{t.navGeofence}</span>
        </button>
        <button
          onClick={() => handleNavClick('queue')}
          className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap relative ${
            currentTab === 'queue' ? 'text-amber-400 bg-amber-500/10 font-semibold' : 'text-slate-400'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{t.navQueue}</span>
          {queuedMessagesCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />}
        </button>
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`py-1 px-2.5 rounded-md flex items-center gap-1 whitespace-nowrap ${
            currentTab === 'dashboard' ? 'text-amber-400 bg-amber-500/10 font-semibold' : 'text-slate-400'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{t.navDashboard}</span>
        </button>
      </div>
    </header>
  );
};
