import React, { useState } from 'react';
import { Share2, Copy, Check, X, Shield, Award, QrCode } from 'lucide-react';
import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { triggerHaptic } from '../utils/haptics';

interface ShareSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  driverPlate: string;
  driverName: string;
  safeKm: number;
  karmaPoints: number;
}

export const ShareSafetyModal: React.FC<ShareSafetyModalProps> = ({
  isOpen,
  onClose,
  language,
  driverPlate,
  driverName,
  safeKm,
  karmaPoints
}) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `🛡️ KavachMesh Safe Transit Verification\nDriver: ${driverName} (${driverPlate})\nVerified Safe Kilometers: ${safeKm} km\nSafety Karma: ${karmaPoints} pts\nActive Offline P2P Mesh Emergency Coverage. Track safe corridor: ${window.location.href}`;

  const handleShare = async () => {
    triggerHaptic('tap');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KavachMesh Verified Safe Auto Ride',
          text: shareText,
          url: window.location.href
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl relative space-y-4">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
          aria-label="Close Share Dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 id="share-modal-title" className="text-base font-bold text-slate-100">
              {t.shareTrip}
            </h3>
            <p className="text-xs text-slate-400">
              Share real-time corridor tracking & verified guardian status with loved ones.
            </p>
          </div>
        </div>

        {/* Preview Badge Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400">
                GOVT CERTIFIED KAVACH GUARDIAN
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">TAMIL NADU TRANSIT</span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-900 pt-2">
            <div>
              <div className="text-sm font-bold text-slate-100">{driverName}</div>
              <div className="text-xs font-mono text-amber-400">{driverPlate}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-slate-300">{safeKm} Safe Km</div>
              <div className="text-[11px] font-mono text-emerald-400">{karmaPoints} Karma Pts</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 italic">
            &quot;Protected by offline peer-to-peer BLE and Wi-Fi mesh emergency dispatch.&quot;
          </div>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-slate-950" />
              <span>Link Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share via WhatsApp / Messages</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
