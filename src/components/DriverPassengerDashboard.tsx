import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  MapPin, 
  Radio, 
  Share2, 
  Bell, 
  UserCheck, 
  Car, 
  CheckCircle2, 
  Clock, 
  Flame, 
  TrendingUp, 
  QrCode, 
  ShieldAlert 
} from 'lucide-react';
import { DriverSafetyStats, LeaderboardEntry, UserRole, LanguageCode } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { triggerHaptic } from '../utils/haptics';
import { AnalyticsCharts } from './AnalyticsCharts';

interface DriverPassengerDashboardProps {
  language: LanguageCode;
  highContrast: boolean;
  userRole: UserRole;
  onToggleRole: () => void;
  driverStats: DriverSafetyStats;
  onOpenShareModal: () => void;
  onOpenBiometricModal: () => void;
  isBiometricVerified: boolean;
  onTriggerSOS: () => void;
}

export const DriverPassengerDashboard: React.FC<DriverPassengerDashboardProps> = ({
  language,
  highContrast,
  userRole,
  onToggleRole,
  driverStats,
  onOpenShareModal,
  onOpenBiometricModal,
  isBiometricVerified,
  onTriggerSOS
}) => {
  const t = TRANSLATIONS[language];
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, driverName: 'Murugan K.', autoRegNumber: 'TN-09-A-1102', location: 'Anna Nagar West', karmaPoints: 1240, safeKm: 2840, sosRelayed: 18, badge: 'Grand Guardian' },
    { rank: 2, driverName: 'Suresh Babu', autoRegNumber: 'TN-07-K-7740', location: 'Shenoy Nagar Stand', karmaPoints: 1110, safeKm: 2420, sosRelayed: 14, badge: 'Mesh Anchor Tier 1' },
    { rank: 3, driverName: 'Karthik Raja (You)', autoRegNumber: driverStats.autoRegNumber, location: 'T. Nagar Stand', karmaPoints: driverStats.karmaPoints, safeKm: driverStats.safeKilometers, sosRelayed: driverStats.meshRelaysAssisted, badge: driverStats.badgeTitle },
    { rank: 4, driverName: 'Selvam R.', autoRegNumber: 'TN-02-C-5519', location: 'Koyambedu Hub', karmaPoints: 920, safeKm: 1980, sosRelayed: 9, badge: 'Rapid Responder' },
    { rank: 5, driverName: 'Arun Kumar', autoRegNumber: 'TN-01-V-3310', location: 'Central Railway Stand', karmaPoints: 860, safeKm: 1720, sosRelayed: 7, badge: 'Shield Patrol' }
  ];

  const handleRequestNotification = async () => {
    triggerHaptic('tap');
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      setNotificationStatus(res);
      if (res === 'granted') {
        new Notification('🔔 KavachMesh Push Alerts Enabled', {
          body: 'You will receive real-time mesh route deviation and SOS proximity alerts even with your phone locked.',
          icon: '/src/assets/images/kavach_shield_badge_1790948759996.jpg'
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Persona Header & Verified Status Banner */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        highContrast ? 'bg-black border-amber-400 text-yellow-300' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-amber-500/40 shrink-0 bg-slate-950">
              <img
                src="/src/assets/images/kavach_shield_badge_1790948759996.jpg"
                alt="KavachMesh Emblem"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {userRole === 'driver' ? driverStats.driverName : 'Passenger: Priya S.'}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                  {isBiometricVerified ? 'Verified Active' : 'Biometric Required'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {userRole === 'driver' ? `Auto: ${driverStats.autoRegNumber} · Permit #TN-CHN-2024` : 'Trip ID: #PAS-9921 · Anna Nagar → T. Nagar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenShareModal}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>{t.shareTrip}</span>
            </button>

            <button
              onClick={onToggleRole}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              {userRole === 'driver' ? <UserCheck className="w-4 h-4" /> : <Car className="w-4 h-4" />}
              <span>Switch to {userRole === 'driver' ? t.passengerRole : t.driverRole}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Driver/Passenger Quick Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">{t.safeKmCount}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {driverStats.safeKilometers} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">100% Corridor Adherence</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Safe Trip Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {driverStats.safeTripsStreak} <span className="text-xs font-normal text-slate-400">trips</span>
          </div>
          <div className="text-[10px] text-amber-400 mt-1">Zero deviation incidents</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">{t.relaysAssisted}</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {driverStats.meshRelaysAssisted} <span className="text-xs font-normal text-slate-400">packets</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">Autonomous BLE relays</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">{t.karmaPoints}</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums">
            {driverStats.karmaPoints} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{driverStats.badgeTitle}</div>
        </div>

      </div>

      {/* Push Notification Setup & Driver Verification Controls */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200">
              {t.pushNotifications}
            </div>
            <div className="text-xs text-slate-400">
              {notificationStatus === 'granted' 
                ? 'Push service active for offline SOS proximity & route deviation alerts' 
                : 'Enable push alerts to be notified even when browser tab is backgrounded'}
            </div>
          </div>
        </div>

        {notificationStatus !== 'granted' ? (
          <button
            onClick={handleRequestNotification}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm shrink-0"
          >
            {t.enableNotifications}
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.notificationsEnabled}</span>
          </div>
        )}
      </div>

      {/* Analytics Visualizations */}
      <AnalyticsCharts language={language} highContrast={highContrast} />

      {/* Community Safety Leaderboard */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              {t.leaderboardTitle}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Chennai Metropolitan Zone</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Driver & Auto Plate</th>
                <th className="pb-3">Stand Hub</th>
                <th className="pb-3 text-right">Safe Km</th>
                <th className="pb-3 text-right">SOS Relayed</th>
                <th className="pb-3 text-right pr-2">Safety Karma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono">
              {leaderboard.map((entry) => {
                const isUser = entry.rank === 3;
                return (
                  <tr
                    key={entry.rank}
                    className={`transition-colors ${
                      isUser ? 'bg-amber-500/10 text-amber-300 font-semibold' : 'text-slate-300 hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-3 pl-2">
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                        entry.rank === 2 ? 'bg-slate-700 text-slate-200' :
                        entry.rank === 3 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-500'
                      }`}>
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-sans font-semibold text-slate-200">{entry.driverName}</div>
                      <div className="text-[10px] text-slate-500">{entry.autoRegNumber} · {entry.badge}</div>
                    </td>
                    <td className="py-3 text-slate-400">{entry.location}</td>
                    <td className="py-3 text-right tabular-nums">{entry.safeKm} km</td>
                    <td className="py-3 text-right text-cyan-400 tabular-nums">{entry.sosRelayed} pkts</td>
                    <td className="py-3 text-right pr-2 font-bold text-amber-400 tabular-nums">
                      {entry.karmaPoints} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
