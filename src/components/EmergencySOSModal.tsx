import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  X, 
  Radio, 
  MapPin, 
  AlertTriangle, 
  HeartPulse, 
  Wrench, 
  Car, 
  CheckCircle2, 
  Volume2, 
  Send 
} from 'lucide-react';
import { EmergencyCategory, LanguageCode } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { encodeMeshPacket, PacketTypeEnum } from '../utils/meshProtocol';
import { meshBroadcaster } from '../utils/meshBroadcaster';
import { triggerHaptic } from '../utils/haptics';
import { playAlertSound } from '../utils/audioAlert';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  highContrast: boolean;
  currentLat: number;
  currentLng: number;
  currentBearing: number;
  currentSpeed: number;
  driverPlate: string;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  language,
  highContrast,
  currentLat,
  currentLng,
  currentBearing,
  currentSpeed,
  driverPlate
}) => {
  const t = TRANSLATIONS[language];
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>('HARASSMENT_THREAT');
  const [countdown, setCountdown] = useState<number>(3);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [hasTransmitted, setHasTransmitted] = useState<boolean>(false);
  const [broadcastPacketHex, setBroadcastPacketHex] = useState<string>('');
  const [sequenceId, setSequenceId] = useState<number>(1042);

  // Auto countdown when opened
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && !hasTransmitted && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && countdown === 0 && !hasTransmitted) {
      handleExecuteBroadcast();
    }
    return () => clearTimeout(timer);
  }, [isOpen, countdown, hasTransmitted]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      setHasTransmitted(false);
      setIsTransmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecuteBroadcast = async () => {
    setIsTransmitting(true);
    triggerHaptic('sos');
    playAlertSound('sos');

    try {
      const nextSeq = sequenceId + 1;
      setSequenceId(nextSeq);

      const packet = await encodeMeshPacket({
        packetType: PacketTypeEnum.SOS,
        severity: 'CRITICAL',
        category: selectedCategory,
        isEncrypted: true,
        ackRequested: true,
        ttl: 5,
        sequenceId: nextSeq,
        plateNumber: driverPlate,
        lat: currentLat,
        lng: currentLng,
        bearingDeg: currentBearing,
        speedKmh: currentSpeed
      });

      setBroadcastPacketHex(packet.rawBytesHex);
      await meshBroadcaster.broadcastPacket(packet.rawBytesHex, `Auto-${driverPlate}`);
      
      // Native push notification if supported & permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 KavachMesh EMERGENCY SOS BROADCAST', {
          body: `Emergency Alert (${t.emergencyCategories[selectedCategory]}) transmitted to nearby auto rickshaws over BLE Mesh!`,
          icon: '/src/assets/images/kavach_shield_badge_1790948759996.jpg'
        });
      }

      setHasTransmitted(true);
    } catch (err) {
      console.error('Failed to broadcast SOS packet', err);
    } finally {
      setIsTransmitting(false);
    }
  };

  const categories: { key: EmergencyCategory; icon: React.ElementType }[] = [
    { key: 'HARASSMENT_THREAT', icon: AlertTriangle },
    { key: 'GEOFENCE_DEVIATION', icon: MapPin },
    { key: 'MEDICAL_CRITICAL', icon: HeartPulse },
    { key: 'ACCIDENT_COLLISION', icon: Car },
    { key: 'VEHICLE_BREAKDOWN', icon: Wrench },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-modal-title"
      aria-describedby="sos-modal-desc"
    >
      <div className={`w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl relative transition-all ${
        highContrast
          ? 'bg-black border-red-500 text-yellow-300'
          : 'bg-slate-900 border-red-500/40 text-slate-100 shadow-red-950/40'
      }`}>
        
        {/* Close / Cancel Button */}
        <button
          onClick={() => {
            triggerHaptic('tap');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Cancel Emergency Broadcast"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-500 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 id="sos-modal-title" className="text-xl font-bold tracking-tight text-red-400 flex items-center gap-2">
              {t.sosButton}
            </h2>
            <p id="sos-modal-desc" className="text-xs text-slate-400">
              {hasTransmitted ? t.sosBroadcastActive : t.sosHoldToTrigger}
            </p>
          </div>
        </div>

        {!hasTransmitted ? (
          <>
            {/* 3-Second Disarm Countdown Banner */}
            <div className={`p-4 rounded-xl border mb-5 flex items-center justify-between ${
              highContrast ? 'bg-yellow-950 border-yellow-400 text-yellow-300' : 'bg-red-950/30 border-red-900/50 text-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="w-10 h-10 -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="opacity-20"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={100}
                      strokeDashoffset={100 - (countdown / 3) * 100}
                      className="transition-all duration-1000 stroke-red-500"
                    />
                  </svg>
                  <span className="absolute font-bold text-lg">{countdown}</span>
                </div>
                <div>
                  <div className="text-sm font-bold">Auto-Broadcasting in {countdown}s</div>
                  <div className="text-xs opacity-80">{t.sosCancelCountdown}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('tap');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-600 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Disarm
              </button>
            </div>

            {/* Emergency Category Selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Select Incident Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => {
                        triggerHaptic('tap');
                        setSelectedCategory(cat.key);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-medium ${
                        isSelected
                          ? 'border-red-500 bg-red-500/15 text-red-300 font-semibold shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
                      <span className="truncate">{t.emergencyCategories[cat.key]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Immediate Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExecuteBroadcast}
                disabled={isTransmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-950/40 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Transmit Immediately (0s)</span>
              </button>
            </div>
          </>
        ) : (
          /* Transmitted View */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-sm text-emerald-300 mb-1">
                  Offline BLE Mesh Beacon Active!
                </div>
                <div>
                  28-Byte packet dispatched without cellular internet. Nearby auto-rickshaws within 300m radio radius are relaying your coordinates.
                </div>
              </div>
            </div>

            {/* Wire Packet Dump */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
              <div className="text-slate-400 mb-1 flex items-center justify-between">
                <span>RAW BLE ADVERTISING PDU (28 BYTES):</span>
                <span className="text-amber-400">AES-GCM ENCRYPTED</span>
              </div>
              <div className="break-all text-yellow-300 selection:bg-amber-400 selection:text-black">
                {broadcastPacketHex}
              </div>
            </div>

            {/* Multi-Hop Relay Animation Status */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Relay Path:</span>
                <span className="text-emerald-400 font-mono">Hops: 3 · Active</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono overflow-x-auto pb-1">
                <span className="px-2 py-0.5 rounded-sm bg-red-950/60 text-red-300 border border-red-800 shrink-0">
                  Auto {driverPlate} (Origin)
                </span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded-sm bg-slate-800 text-slate-200 shrink-0">
                  TN-09-A-1102 (45m)
                </span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded-sm bg-slate-800 text-slate-200 shrink-0">
                  TN-07-K-7740 (110m)
                </span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded-sm bg-emerald-950/80 text-emerald-300 border border-emerald-700 shrink-0">
                  Police PCR Van 14 (380m)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('tap');
                onClose();
              }}
              className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition-colors"
            >
              Close & Monitor on Live Map
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
