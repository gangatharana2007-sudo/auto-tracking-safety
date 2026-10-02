/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  ShieldAlert, 
  MapPin, 
  Cpu, 
  Compass, 
  Database, 
  Award, 
  WifiOff, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { LanguageCode, UserRole, DriverSafetyStats } from './types';
import { TRANSLATIONS } from './utils/translations';
import { TopNavigation } from './components/TopNavigation';
import { MeshLiveMap } from './components/MeshLiveMap';
import { PacketInspector } from './components/PacketInspector';
import { DeviationGeofencePanel } from './components/DeviationGeofencePanel';
import { OfflineQueueDrawer } from './components/OfflineQueueDrawer';
import { DriverPassengerDashboard } from './components/DriverPassengerDashboard';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { BiometricAuthModal } from './components/BiometricAuthModal';
import { ShareSafetyModal } from './components/ShareSafetyModal';
import { localQueueDb } from './utils/indexedDbQueue';
import { triggerHaptic } from './utils/haptics';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'map' | 'inspector' | 'geofence' | 'queue' | 'dashboard'>('map');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('driver');
  const [isBiometricVerified, setIsBiometricVerified] = useState<boolean>(true);

  // Modals
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  // Screen reader live status message
  const [liveAriaMessage, setLiveAriaMessage] = useState<string>('KavachMesh active. Listening for offline BLE beacons.');

  // Offline queue item count badge
  const [queuedCount, setQueuedCount] = useState<number>(0);

  // Driver Profile
  const driverPlate = 'TN-09-BK-4021';
  const driverStats: DriverSafetyStats = {
    driverName: 'Karthik Raja',
    autoRegNumber: driverPlate,
    badgeTitle: 'Golden Rickshaw Guardian',
    karmaPoints: 980,
    safeKilometers: 1480,
    safeTripsStreak: 42,
    meshRelaysAssisted: 14,
    nodeUptimeHours: 184,
    emergencyResponseCount: 3
  };

  const t = TRANSLATIONS[language];

  // Refresh queue count
  const refreshQueueCount = async () => {
    try {
      const records = await localQueueDb.getAll();
      setQueuedCount(records.length);
    } catch (e) {
      // Ignored
    }
  };

  useEffect(() => {
    refreshQueueCount();
    const interval = setInterval(refreshQueueCount, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      highContrast 
        ? 'bg-black text-yellow-300 font-sans' 
        : darkMode 
          ? 'bg-slate-950 text-slate-100 font-sans' 
          : 'bg-slate-50 text-slate-900 font-sans'
    }`}>
      
      {/* Screen Reader Live Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {liveAriaMessage}
      </div>

      {/* Top Bar Contract (3 zones, single row) */}
      <TopNavigation
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setLiveAriaMessage(`Switched to tab: ${tab}`);
        }}
        language={language}
        onSelectLanguage={(lang) => {
          setLanguage(lang);
          setLiveAriaMessage(`Language changed to ${lang}`);
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        userRole={userRole}
        onToggleRole={() => {
          const next = userRole === 'driver' ? 'passenger' : 'driver';
          setUserRole(next);
          setLiveAriaMessage(`Switched persona to ${next}`);
        }}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenBiometric={() => setIsBiometricOpen(true)}
        isBiometricVerified={isBiometricVerified}
        queuedMessagesCount={queuedCount}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        
        {/* Hero Context Banner for Public Transport Mesh Safety */}
        <section className={`rounded-2xl border p-4 sm:p-5 relative overflow-hidden transition-all ${
          highContrast
            ? 'bg-black border-amber-400 text-yellow-300'
            : darkMode
              ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 text-slate-100'
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-slate-900'
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-emerald-400">
                  {t.statusOnlineMesh}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">{t.statusOfflineMode}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-balance">
                Auto-Driver & Passenger Dynamic Safety Mesh
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Autonomous offline emergency response infrastructure for Indian auto-rickshaws. Combines 
                sub-second spherical geofence deviation detection, 28-byte BLE advertising beacons, 
                and rotating privacy IDs to protect passengers and drivers without mobile cellular data.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  triggerHaptic('sos');
                  setIsSOSOpen(true);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-2 ${
                  highContrast
                    ? 'bg-red-600 text-white hover:bg-red-700 border-2 border-yellow-300'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40'
                }`}
                aria-label="Broadcast Emergency SOS"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t.sosButton}</span>
              </button>

              <button
                onClick={() => setCurrentTab('inspector')}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Wire Spec</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tab Content Panes */}
        {currentTab === 'map' && (
          <MeshLiveMap
            language={language}
            highContrast={highContrast}
            onTriggerSOSModal={() => setIsSOSOpen(true)}
            driverPlate={driverPlate}
          />
        )}

        {currentTab === 'inspector' && (
          <PacketInspector
            language={language}
            highContrast={highContrast}
            driverPlate={driverPlate}
          />
        )}

        {currentTab === 'geofence' && (
          <DeviationGeofencePanel
            language={language}
            highContrast={highContrast}
          />
        )}

        {currentTab === 'queue' && (
          <OfflineQueueDrawer
            language={language}
            highContrast={highContrast}
            driverPlate={driverPlate}
          />
        )}

        {currentTab === 'dashboard' && (
          <DriverPassengerDashboard
            language={language}
            highContrast={highContrast}
            userRole={userRole}
            onToggleRole={() => setUserRole(userRole === 'driver' ? 'passenger' : 'driver')}
            driverStats={driverStats}
            onOpenShareModal={() => setIsShareOpen(true)}
            onOpenBiometricModal={() => setIsBiometricOpen(true)}
            isBiometricVerified={isBiometricVerified}
            onTriggerSOS={() => setIsSOSOpen(true)}
          />
        )}

      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/60 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px]">
          <div>
            KavachMesh · Chennai, Bengaluru & Delhi Transit Safety Specification 2026
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>BLE 4.2 / 5.0 Mesh Radio</span>
            <span aria-hidden="true">·</span>
            <span>AES-256-GCM Cryptography</span>
            <span aria-hidden="true">·</span>
            <span>Zero Cellular Dependency</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EmergencySOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        language={language}
        highContrast={highContrast}
        currentLat={13.085025}
        currentLng={80.210145}
        currentBearing={145}
        currentSpeed={32}
        driverPlate={driverPlate}
      />

      <BiometricAuthModal
        isOpen={isBiometricOpen}
        onClose={() => setIsBiometricOpen(false)}
        onSuccess={() => setIsBiometricVerified(true)}
        language={language}
        driverPlate={driverPlate}
      />

      <ShareSafetyModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        language={language}
        driverPlate={driverPlate}
        driverName={driverStats.driverName}
        safeKm={driverStats.safeKilometers}
        karmaPoints={driverStats.karmaPoints}
      />

    </div>
  );
}
