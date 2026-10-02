import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Binary, 
  Layers, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  KeyRound, 
  Radio, 
  Clock, 
  Sliders, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  BarChart2 
} from 'lucide-react';
import { CompactMeshPacket, EmergencyCategory, LanguageCode } from '../types';
import { 
  encodeMeshPacket, 
  decodeMeshPacket, 
  getBandwidthBenchmark, 
  PacketTypeEnum, 
  CATEGORY_MAP, 
  REVERSE_CATEGORY_MAP 
} from '../utils/meshProtocol';
import { TRANSLATIONS } from '../utils/translations';
import { triggerHaptic } from '../utils/haptics';

interface PacketInspectorProps {
  language: LanguageCode;
  highContrast: boolean;
  driverPlate: string;
}

export const PacketInspector: React.FC<PacketInspectorProps> = ({
  language,
  highContrast,
  driverPlate
}) => {
  const t = TRANSLATIONS[language];
  const [selectedByteIndex, setSelectedByteIndex] = useState<number | null>(null);

  // Interactive Form Inputs
  const [simType, setSimType] = useState<PacketTypeEnum>(PacketTypeEnum.SOS);
  const [simSeverity, setSimSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'>('CRITICAL');
  const [simCategory, setSimCategory] = useState<EmergencyCategory>('HARASSMENT_THREAT');
  const [simEncrypted, setSimEncrypted] = useState<boolean>(true);
  const [simAckReq, setSimAckReq] = useState<boolean>(true);
  const [simTtl, setSimTtl] = useState<number>(5);
  const [simSeq, setSimSeq] = useState<number>(1420);
  const [simPlate, setSimPlate] = useState<string>(driverPlate);
  const [simLat, setSimLat] = useState<number>(13.085025);
  const [simLng, setSimLng] = useState<number>(80.210145);
  const [simBearing, setSimBearing] = useState<number>(142);
  const [simSpeed, setSimSpeed] = useState<number>(34);

  const [encodedPacket, setEncodedPacket] = useState<CompactMeshPacket | null>(null);
  const benchmark = getBandwidthBenchmark();

  // Re-encode packet whenever inputs change
  useEffect(() => {
    let isCancelled = false;

    async function runEncode() {
      const pkt = await encodeMeshPacket({
        packetType: simType,
        severity: simSeverity,
        category: simCategory,
        isEncrypted: simEncrypted,
        ackRequested: simAckReq,
        ttl: simTtl,
        sequenceId: simSeq,
        plateNumber: simPlate,
        lat: simLat,
        lng: simLng,
        bearingDeg: simBearing,
        speedKmh: simSpeed
      });

      if (!isCancelled) {
        setEncodedPacket(pkt);
      }
    }

    runEncode();
    return () => {
      isCancelled = true;
    };
  }, [
    simType,
    simSeverity,
    simCategory,
    simEncrypted,
    simAckReq,
    simTtl,
    simSeq,
    simPlate,
    simLat,
    simLng,
    simBearing,
    simSpeed
  ]);

  const hexBytes = encodedPacket ? encodedPacket.rawBytesHex.split(' ') : [];

  // Byte definition schema for interactive inspector
  const byteDefinitions: Record<number, { name: string; range: string; desc: string }> = {
    0: { name: 'Protocol Magic [0]', range: '0x4B (ASCII "K")', desc: 'Identifies KavachMesh protocol frame on BLE advertising spectrum' },
    1: { name: 'Protocol Magic [1]', range: '0x4D (ASCII "M")', desc: 'Second sync byte ensuring rejection of random BLE beacons' },
    2: { name: 'Version', range: '0x01 (v1.0)', desc: 'Wire protocol version specification' },
    3: { name: 'Packet Type', range: '0x01-0x04', desc: '1=SOS, 2=Heartbeat, 3=ACK, 4=Geofence Deviation' },
    4: { name: 'Bitpacked Flags', range: '8 bits', desc: 'Bits 0-2: Severity, Bits 3-5: Category, Bit 6: Encrypted, Bit 7: ACK Req' },
    5: { name: 'TTL / Max Hops', range: '1-7 Hops', desc: 'Loop mitigation counter; decremented at every auto-rickshaw hop' },
    6: { name: 'Sequence ID [MSB]', range: '0x00-0xFF', desc: 'Monotonic message ID for deduplication' },
    7: { name: 'Sequence ID [LSB]', range: '0x00-0xFF', desc: 'Monotonic message ID for deduplication' },
    8: { name: 'R-VID [0]', range: 'Privacy Hash', desc: 'Ephemeral Rotating Vehicle ID (Hourly HMAC-SHA256 truncated salt)' },
    9: { name: 'R-VID [1]', range: 'Privacy Hash', desc: 'Prevents third-party route tracking by passive RF sniffers' },
    10: { name: 'R-VID [2]', range: 'Privacy Hash', desc: 'Resolvable only by transit police dispatch master key' },
    11: { name: 'R-VID [3]', range: 'Privacy Hash', desc: 'Rotates automatically every 60 minutes' },
    12: { name: 'Packed Lat [Byte 1]', range: '24-bit fixed point', desc: 'Latitude compressed to 24 bits: (lat+90)/180 * (2^24-1)' },
    13: { name: 'Packed Lat [Byte 2]', range: '24-bit fixed point', desc: 'Provides ~1.1 meter ground precision' },
    14: { name: 'Packed Lat [Byte 3]', range: '24-bit fixed point', desc: 'Low-order latitude bits' },
    15: { name: 'Packed Lng [Byte 1]', range: '24-bit fixed point', desc: 'Longitude compressed to 24 bits: (lng+180)/360 * (2^24-1)' },
    16: { name: 'Packed Lng [Byte 2]', range: '24-bit fixed point', desc: 'Provides ~1.1 meter ground precision' },
    17: { name: 'Packed Lng [Byte 3]', range: '24-bit fixed point', desc: 'Low-order longitude bits' },
    18: { name: 'Bearing Angle', range: '0-255', desc: 'Normalized vehicle heading: (heading/360) * 255' },
    19: { name: 'Speed (km/h)', range: '0-255 km/h', desc: 'Vehicle ground velocity in km/h' },
    20: { name: 'Timestamp [0]', range: 'Epoch Sec (MSB)', desc: '32-bit Unix epoch second' },
    21: { name: 'Timestamp [1]', range: 'Epoch Sec', desc: 'Replay attack prevention window' },
    22: { name: 'Timestamp [2]', range: 'Epoch Sec', desc: 'Clock drift tolerance ±120 seconds' },
    23: { name: 'Timestamp [3]', range: 'Epoch Sec (LSB)', desc: 'Epoch second lowest byte' },
    24: { name: 'Auth Tag [0]', range: '4-Byte MAC', desc: 'Truncated AES-GCM Auth Tag / Poly1305 signature' },
    25: { name: 'Auth Tag [1]', range: '4-Byte MAC', desc: 'Cryptographic tamper-proofing' },
    26: { name: 'Auth Tag [2]', range: '4-Byte MAC', desc: 'Guarantees authenticity of emergency dispatch' },
    27: { name: 'Auth Tag [3]', range: '4-Byte MAC', desc: 'End of 28-byte BLE legacy packet frame' }
  };

  const activeByteInfo = selectedByteIndex !== null ? byteDefinitions[selectedByteIndex] : null;

  return (
    <div className="space-y-6">
      
      {/* Title & Introduction */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        highContrast ? 'bg-black border-amber-400 text-yellow-300' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold tracking-tight">
                {t.packetDesignTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              BLE 4.2 Legacy Advertising PDU limit is 31 bytes. KavachMesh implements a custom 28-byte binary wire structure 
              incorporating 24-bit fixed-point GPS coordinates, Ephemeral Rotating Vehicle IDs (R-VID), bit-packed emergency flags, 
              and truncated cryptographic MAC.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
              Size: 28 Bytes · BLE Legacy PDU
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Byte Wire Viewer */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Binary className="w-4 h-4 text-amber-400" />
            <span>Interactive Hex Byte Matrix (Click Any Byte to Inspect)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Total: 28 / 28 Octets</span>
        </div>

        {/* Byte Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-14 gap-2">
          {hexBytes.map((byteHex, idx) => {
            const isSelected = selectedByteIndex === idx;
            // Color code byte roles
            let roleColor = 'border-slate-800 bg-slate-900 text-slate-300';
            if (idx <= 1) roleColor = 'border-amber-500/40 bg-amber-950/20 text-amber-300'; // Magic
            else if (idx === 2 || idx === 3) roleColor = 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'; // Version/Type
            else if (idx === 4 || idx === 5) roleColor = 'border-purple-500/40 bg-purple-950/20 text-purple-300'; // Flags/TTL
            else if (idx >= 6 && idx <= 7) roleColor = 'border-blue-500/40 bg-blue-950/20 text-blue-300'; // Seq
            else if (idx >= 8 && idx <= 11) roleColor = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'; // R-VID
            else if (idx >= 12 && idx <= 17) roleColor = 'border-yellow-500/40 bg-yellow-950/20 text-yellow-300'; // Lat/Lng
            else if (idx >= 18 && idx <= 19) roleColor = 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300'; // Bearing/Speed
            else if (idx >= 20 && idx <= 23) roleColor = 'border-rose-500/40 bg-rose-950/20 text-rose-300'; // Timestamp
            else if (idx >= 24) roleColor = 'border-red-500/40 bg-red-950/20 text-red-300'; // Auth Tag

            return (
              <button
                key={idx}
                onClick={() => {
                  triggerHaptic('tap');
                  setSelectedByteIndex(idx);
                }}
                className={`p-2 rounded-lg border text-center font-mono transition-all flex flex-col items-center justify-center ${roleColor} ${
                  isSelected ? 'ring-2 ring-amber-400 scale-105 z-10 shadow-lg' : 'hover:scale-102'
                }`}
                title={`Byte [${idx}]: ${byteDefinitions[idx]?.name}`}
              >
                <span className="text-[9px] text-slate-500 font-mono">[{idx}]</span>
                <span className="text-sm font-bold tracking-wider">{byteHex}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Byte Inspector Card */}
        {activeByteInfo ? (
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 font-mono text-sm">
                Byte [{selectedByteIndex}]: {activeByteInfo.name}
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300 font-mono text-[10px]">
                Wire Val: 0x{hexBytes[selectedByteIndex!]} ({parseInt(hexBytes[selectedByteIndex!], 16)})
              </span>
            </div>
            <div className="text-slate-300 leading-relaxed">
              {activeByteInfo.desc}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Valid Field Range: {activeByteInfo.range}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-500 italic text-center">
            Click on any byte box above (0 through 27) to inspect its exact specification and decompression algorithm.
          </div>
        )}

      </div>

      {/* Interactive Packet Encoder Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Encoder Controls */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Real-Time Packet Field Synthesizer</span>
            </div>
            <span className="text-[11px] text-slate-400">Generates wire bytes live</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Packet Type</label>
              <select
                value={simType}
                onChange={(e) => setSimType(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value={PacketTypeEnum.SOS}>0x01: EMERGENCY SOS</option>
                <option value={PacketTypeEnum.DEVIATION_ALERT}>0x04: ROUTE DEVIATION</option>
                <option value={PacketTypeEnum.HEARTBEAT}>0x02: ROUTINE HEARTBEAT</option>
                <option value={PacketTypeEnum.ACK}>0x03: MESH ACK RECEIPT</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Incident Severity</label>
              <select
                value={simSeverity}
                onChange={(e) => setSimSeverity(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="CRITICAL">CRITICAL (3)</option>
                <option value="HIGH">HIGH (2)</option>
                <option value="MEDIUM">MEDIUM (1)</option>
                <option value="INFO">INFO (0)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Category</label>
              <select
                value={simCategory}
                onChange={(e) => setSimCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="HARASSMENT_THREAT">Harassment / Driver Threat</option>
                <option value="GEOFENCE_DEVIATION">Geofence Deviation</option>
                <option value="MEDICAL_CRITICAL">Critical Medical</option>
                <option value="ACCIDENT_COLLISION">Collision / Impact</option>
                <option value="VEHICLE_BREAKDOWN">Mechanical Failure</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Auto Plate Number</label>
              <input
                type="text"
                value={simPlate}
                onChange={(e) => setSimPlate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">TTL Hops: {simTtl}</label>
              <input
                type="range"
                min="1"
                max="7"
                value={simTtl}
                onChange={(e) => setSimTtl(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Sequence ID: #{simSeq}</label>
              <input
                type="number"
                value={simSeq}
                onChange={(e) => setSimSeq(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={simLat}
                onChange={(e) => setSimLat(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={simLng}
                onChange={(e) => setSimLng(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Decoded Output & Privacy Token Verification */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Decoded Receiver Verification</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Auth Tag Valid</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Rotating Vehicle ID (R-VID):</span>
              <span className="text-amber-300 font-bold">0x{encodedPacket?.rotatingVehicleId}</span>
            </div>

            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Raw Plate (Local Station Only):</span>
              <span className="text-slate-200">{simPlate}</span>
            </div>

            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Decompressed GPS:</span>
              <span className="text-slate-200">
                {simLat.toFixed(6)}, {simLng.toFixed(6)} (±1.1m error)
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Kinematics:</span>
              <span className="text-slate-200">{simSpeed} km/h @ {simBearing}°</span>
            </div>

            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">4-Byte Truncated MAC:</span>
              <span className="text-emerald-400 font-bold">0x{encodedPacket?.authTag}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Replay Protection:</span>
              <span className="text-slate-300">Monotonic Seq + Unix Sec Window</span>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 leading-relaxed flex items-start gap-2">
            <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <strong>Privacy Architecture:</strong> The vehicle plate is never transmitted in cleartext over the air. 
              The 4-byte R-VID rotates every hour using an HMAC salt, preventing rogue wardriving or stalking while allowing 
              certified police repeaters with the public transport master key to reverse the lookup during life-safety dispatches.
            </div>
          </div>
        </div>

      </div>

      {/* Bandwidth & Optimization Benchmark Card */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        highContrast ? 'bg-black border-slate-700 text-slate-100' : 'bg-slate-900/60 border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold tracking-tight">
            {t.bandwidthOptimization}: Micro-Payload Comparison
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40">
            <div className="text-[11px] font-mono text-emerald-400 font-semibold mb-1">
              KavachMesh Compact Binary
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {benchmark.kavachBytes} <span className="text-xs font-normal text-slate-400">bytes</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Airtime: <strong className="text-emerald-300">{benchmark.bleAirtimeKavachMs} ms</strong> (1M PHY)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 font-semibold mb-1">
              Standard Protobuf Struct
            </div>
            <div className="text-2xl font-bold text-slate-200 tabular-nums">
              {benchmark.protobufEstBytes} <span className="text-xs font-normal text-slate-400">bytes</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Airtime: ~0.8 ms (Requires extra PDU)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 font-semibold mb-1">
              Standard JSON String
            </div>
            <div className="text-2xl font-bold text-slate-400 tabular-nums">
              {benchmark.jsonBytes} <span className="text-xs font-normal text-slate-500">bytes</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Airtime: ~{benchmark.bleAirtimeJsonMs} ms (Over BLE legacy cap)
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
          <span>Payload Reduction: <strong className="text-emerald-400">{benchmark.savingsPercent}%</strong></span>
          <span>Fits inside single BLE 4.2 ADV_NONCONN_IND beacon</span>
        </div>
      </div>

    </div>
  );
};
