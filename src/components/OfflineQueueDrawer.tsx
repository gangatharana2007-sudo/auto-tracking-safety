import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Lock, 
  RefreshCw, 
  Radio, 
  Cloud, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Plus, 
  ExternalLink 
} from 'lucide-react';
import { OfflineQueueRecord, LanguageCode } from '../types';
import { localQueueDb } from '../utils/indexedDbQueue';
import { TRANSLATIONS } from '../utils/translations';
import { triggerHaptic } from '../utils/haptics';
import { encryptPayload, decryptPayload } from '../utils/crypto';
import { encodeMeshPacket, PacketTypeEnum } from '../utils/meshProtocol';
import { meshBroadcaster } from '../utils/meshBroadcaster';

interface OfflineQueueDrawerProps {
  language: LanguageCode;
  highContrast: boolean;
  driverPlate: string;
}

export const OfflineQueueDrawer: React.FC<OfflineQueueDrawerProps> = ({
  language,
  highContrast,
  driverPlate
}) => {
  const t = TRANSLATIONS[language];
  const [records, setRecords] = useState<OfflineQueueRecord[]>([]);
  const [decryptedPayloads, setDecryptedPayloads] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const all = await localQueueDb.getAll();
      setRecords(all);

      // Decrypt any AES-GCM payloads for inspection
      const decMap: Record<string, string> = {};
      for (const rec of all.slice(0, 5)) {
        if (rec.cipherTextBase64 && rec.ivHex) {
          decMap[rec.id] = await decryptPayload(rec.cipherTextBase64, rec.ivHex);
        }
      }
      setDecryptedPayloads(decMap);
    } catch (err) {
      console.error('Failed to load local queue records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleSimulateCloudSync = async () => {
    triggerHaptic('tap');
    setSyncStatus('Connecting to State Transit Emergency Server via 4G/5G...');

    setTimeout(async () => {
      for (const r of records) {
        if (r.status !== 'SYNCED_CLOUD') {
          await localQueueDb.updateStatus(r.id, 'SYNCED_CLOUD');
        }
      }
      await loadRecords();
      setSyncStatus('All offline records securely synced to Central Police & Fleet Database!');
      triggerHaptic('success');
      setTimeout(() => setSyncStatus(null), 4000);
    }, 1200);
  };

  const handleCreateSyntheticPacket = async () => {
    triggerHaptic('tap');
    const seq = Math.floor(Math.random() * 9000) + 1000;
    const packet = await encodeMeshPacket({
      packetType: PacketTypeEnum.DEVIATION_ALERT,
      severity: 'HIGH',
      category: 'GEOFENCE_DEVIATION',
      isEncrypted: true,
      ackRequested: true,
      ttl: 5,
      sequenceId: seq,
      plateNumber: driverPlate,
      lat: 13.0850,
      lng: 80.2101,
      bearingDeg: 145,
      speedKmh: 36
    });

    const encrypted = await encryptPayload(JSON.stringify({
      event: 'GEOFENCE_DEVIATION_AUTO_TEST',
      plate: driverPlate,
      seq,
      timestamp: Date.now()
    }));

    await localQueueDb.enqueue({
      packetHex: packet.rawBytesHex,
      cipherTextBase64: encrypted.cipherTextBase64,
      ivHex: encrypted.ivHex,
      status: 'QUEUED_LOCAL',
      category: 'GEOFENCE_DEVIATION',
      payloadSummary: `[Synthetic Deviation Alert] Seq:${seq} Lat:13.0850 Lng:80.2101`
    });

    await loadRecords();
  };

  const handleClearAll = async () => {
    if (confirm('Clear all stored local queue records?')) {
      triggerHaptic('tap');
      await localQueueDb.clearAll();
      await loadRecords();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        highContrast ? 'bg-black border-amber-400 text-yellow-300' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold tracking-tight">
                {t.offlineQueueTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              When auto-rickshaws enter cellular dead-zones, basements, or tunnels, all emergency SOS beacons and route deviation 
              telemetry are queued locally into an encrypted SQLite / IndexedDB database with exponential backoff retry schedules.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCreateSyntheticPacket}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Queue Test Packet</span>
            </button>

            <button
              onClick={handleSimulateCloudSync}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-slate-950 flex items-center gap-1.5 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Simulate Cloud Sync</span>
            </button>

            <button
              onClick={handleClearAll}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
              title="Clear Local Queue"
              aria-label="Clear Local Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>{syncStatus}</span>
          </div>
        )}
      </div>

      {/* Queue Records List */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Stored Queue Records ({records.length})
          </span>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            <span>AES-256-GCM Encrypted at Rest</span>
          </span>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            No queued messages. Click &quot;Queue Test Packet&quot; or trigger an Emergency SOS to observe local offline persistence!
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec) => {
              let statusBadge = 'bg-slate-800 text-slate-300 border-slate-700';
              if (rec.status === 'RELAYED_BLE_MESH') statusBadge = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
              if (rec.status === 'ACK_RECEIVED') statusBadge = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
              if (rec.status === 'SYNCED_CLOUD') statusBadge = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400">{rec.id}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        {new Date(rec.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${statusBadge}`}>
                        {rec.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Retries: {rec.retryCount}
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-200 font-medium">
                    {rec.payloadSummary}
                  </div>

                  {/* Wire Hex Preview */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-yellow-300 break-all">
                    <span className="text-slate-500 block mb-0.5">Wire Bytes (28B):</span>
                    {rec.packetHex}
                  </div>

                  {/* Encrypted Base64 & Local Decryption verification */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="truncate max-w-sm">
                      AES-GCM Ciphertext: <code className="text-slate-300">{rec.cipherTextBase64.substring(0, 24)}...</code>
                    </span>

                    {decryptedPayloads[rec.id] && (
                      <span className="text-emerald-400 font-mono text-[10px]">
                        Decrypted: {decryptedPayloads[rec.id].substring(0, 35)}...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
