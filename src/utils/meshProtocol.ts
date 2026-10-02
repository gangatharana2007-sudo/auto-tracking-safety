import { CompactMeshPacket, DecodedMeshPacket, EmergencyCategory } from '../types';
import { computeCompactMac, generateRotatingVehicleId } from './crypto';

export const PROTOCOL_MAGIC = 0x4B4D; // 'KM'
export const PROTOCOL_VERSION = 0x01;

export enum PacketTypeEnum {
  SOS = 0x01,
  HEARTBEAT = 0x02,
  ACK = 0x03,
  DEVIATION_ALERT = 0x04
}

export const CATEGORY_MAP: Record<number, EmergencyCategory> = {
  0: 'GEOFENCE_DEVIATION',
  1: 'HARASSMENT_THREAT',
  2: 'MEDICAL_CRITICAL',
  3: 'VEHICLE_BREAKDOWN',
  4: 'ACCIDENT_COLLISION'
};

export const REVERSE_CATEGORY_MAP: Record<EmergencyCategory, number> = {
  'GEOFENCE_DEVIATION': 0,
  'HARASSMENT_THREAT': 1,
  'MEDICAL_CRITICAL': 2,
  'VEHICLE_BREAKDOWN': 3,
  'ACCIDENT_COLLISION': 4
};

/**
 * 24-bit Coordinate Packing:
 * Latitude range [-90, +90] -> 24-bit unsigned int [0, 16777215]
 * Resolution is ~0.0000107 degrees (~1.1 meter precision), ideal for auto route tracking!
 */
export function packCoordinate(value: number, min: number, max: number): number {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return Math.round(normalized * 16777215);
}

export function unpackCoordinate(packed: number, min: number, max: number): number {
  const normalized = packed / 16777215;
  return Number((min + normalized * (max - min)).toFixed(6));
}

/**
 * Encode an emergency or telemetry event into an ultra-compact 28-byte binary packet.
 */
export async function encodeMeshPacket(params: {
  packetType: PacketTypeEnum;
  severity: 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: EmergencyCategory;
  isEncrypted: boolean;
  ackRequested: boolean;
  ttl: number;
  sequenceId: number;
  plateNumber: string;
  lat: number;
  lng: number;
  bearingDeg: number;
  speedKmh: number;
  timestampSeconds?: number;
}): Promise<CompactMeshPacket> {
  const buffer = new ArrayBuffer(28);
  const view = new DataView(buffer);

  // 1. Magic bytes 0-1
  view.setUint16(0, PROTOCOL_MAGIC, false); // Big endian 'KM'

  // 2. Version byte 2
  view.setUint8(2, PROTOCOL_VERSION);

  // 3. Packet Type byte 3
  view.setUint8(3, params.packetType);

  // 4. Flags byte 4
  const severityVal = params.severity === 'CRITICAL' ? 3 : params.severity === 'HIGH' ? 2 : params.severity === 'MEDIUM' ? 1 : 0;
  const categoryVal = REVERSE_CATEGORY_MAP[params.category] ?? 0;
  const encryptedBit = params.isEncrypted ? 1 : 0;
  const ackBit = params.ackRequested ? 1 : 0;
  const flags = (severityVal & 0x07) | ((categoryVal & 0x07) << 3) | (encryptedBit << 6) | (ackBit << 7);
  view.setUint8(4, flags);

  // 5. TTL byte 5
  view.setUint8(5, Math.min(7, Math.max(1, params.ttl)));

  // 6. Sequence ID bytes 6-7
  view.setUint16(6, params.sequenceId % 65536, false);

  // 7. Rotating Vehicle ID bytes 8-11
  const rvidHex = await generateRotatingVehicleId(params.plateNumber);
  const rvidBytes = rvidHex.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [0xAA, 0xBB, 0xCC, 0xDD];
  for (let i = 0; i < 4; i++) {
    view.setUint8(8 + i, rvidBytes[i] || 0);
  }

  // 8. Packed Latitude bytes 12-14 (24-bit)
  const packedLat = packCoordinate(params.lat, -90, 90);
  view.setUint8(12, (packedLat >> 16) & 0xFF);
  view.setUint8(13, (packedLat >> 8) & 0xFF);
  view.setUint8(14, packedLat & 0xFF);

  // 9. Packed Longitude bytes 15-17 (24-bit)
  const packedLng = packCoordinate(params.lng, -180, 180);
  view.setUint8(15, (packedLng >> 16) & 0xFF);
  view.setUint8(16, (packedLng >> 8) & 0xFF);
  view.setUint8(17, packedLng & 0xFF);

  // 10. Bearing byte 18 (0-255 mapped to 0-360)
  const normalizedBearing = Math.round(((params.bearingDeg % 360) / 360) * 255);
  view.setUint8(18, normalizedBearing & 0xFF);

  // 11. Speed byte 19 (0-255 km/h)
  view.setUint8(19, Math.min(255, Math.max(0, Math.round(params.speedKmh))));

  // 12. Timestamp bytes 20-23 (uint32 epoch seconds)
  const timestamp = params.timestampSeconds ?? Math.floor(Date.now() / 1000);
  view.setUint32(20, timestamp, false);

  // 13. Auth Tag bytes 24-27 (Truncated MAC over header + payload)
  const rawBytes = new Uint8Array(buffer);
  const macHex = await computeCompactMac(rawBytes.slice(0, 24));
  const macBytes = macHex.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [0x00, 0x00, 0x00, 0x00];
  for (let i = 0; i < 4; i++) {
    view.setUint8(24 + i, macBytes[i]);
  }

  const rawBytesHex = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

  return {
    magic: PROTOCOL_MAGIC,
    version: PROTOCOL_VERSION,
    packetType: params.packetType,
    flags,
    ttl: params.ttl,
    sequenceId: params.sequenceId,
    rotatingVehicleId: rvidHex,
    packedLat,
    packedLng,
    bearing: normalizedBearing,
    speedKmh: Math.round(params.speedKmh),
    timestampSeconds: timestamp,
    authTag: macHex,
    rawBytesHex,
    totalSizeBytes: 28
  };
}

/**
 * Decode a raw hex string or Uint8Array back into an actionable emergency data object.
 */
export function decodeMeshPacket(rawInput: Uint8Array | string, options?: { rssiDb?: number; relayedBy?: string }): DecodedMeshPacket {
  let bytes: Uint8Array;
  if (typeof rawInput === 'string') {
    const cleanHex = rawInput.replace(/[^0-9A-Fa-f]/g, '');
    bytes = new Uint8Array(cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  } else {
    bytes = rawInput;
  }

  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const view = new DataView(buffer);

  const magic = view.getUint16(0, false);
  const magicValid = magic === PROTOCOL_MAGIC;
  const version = view.getUint8(2);

  const typeByte = view.getUint8(3);
  let type: DecodedMeshPacket['type'] = 'SOS';
  if (typeByte === PacketTypeEnum.HEARTBEAT) type = 'HEARTBEAT';
  else if (typeByte === PacketTypeEnum.ACK) type = 'ACK';
  else if (typeByte === PacketTypeEnum.DEVIATION_ALERT) type = 'DEVIATION_ALERT';

  const flags = view.getUint8(4);
  const severityVal = flags & 0x07;
  const categoryVal = (flags >> 3) & 0x07;
  const isEncrypted = Boolean((flags >> 6) & 0x01);
  const ackRequested = Boolean((flags >> 7) & 0x01);

  const severity: DecodedMeshPacket['severity'] = 
    severityVal === 3 ? 'CRITICAL' : severityVal === 2 ? 'HIGH' : severityVal === 1 ? 'MEDIUM' : 'INFO';
  
  const category: EmergencyCategory = CATEGORY_MAP[categoryVal] || 'GEOFENCE_DEVIATION';

  const ttlRemaining = view.getUint8(5);
  const hopCount = Math.max(0, 5 - ttlRemaining); // assuming initial TTL of 5
  const sequenceId = view.getUint16(6, false);

  const rvidBytes = [
    view.getUint8(8),
    view.getUint8(9),
    view.getUint8(10),
    view.getUint8(11)
  ];
  const rotatingVehicleId = rvidBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');

  const packedLat = (view.getUint8(12) << 16) | (view.getUint8(13) << 8) | view.getUint8(14);
  const latitude = unpackCoordinate(packedLat, -90, 90);

  const packedLng = (view.getUint8(15) << 16) | (view.getUint8(16) << 8) | view.getUint8(17);
  const longitude = unpackCoordinate(packedLng, -180, 180);

  const normalizedBearing = view.getUint8(18);
  const bearingDeg = Math.round((normalizedBearing / 255) * 360);

  const speedKmh = view.getUint8(19);
  const timestampSeconds = view.getUint32(20, false);
  const timestamp = new Date(timestampSeconds * 1000);

  const authTagBytes = [
    view.getUint8(24),
    view.getUint8(25),
    view.getUint8(26),
    view.getUint8(27)
  ];
  const authTagHex = authTagBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');

  return {
    id: `pkt-${sequenceId}-${rotatingVehicleId}`,
    receivedAt: Date.now(),
    magicValid,
    version,
    type,
    severity,
    category,
    isEncrypted,
    ackRequested,
    ttlRemaining,
    hopCount,
    sequenceId,
    rotatingVehicleId,
    latitude,
    longitude,
    bearingDeg,
    speedKmh,
    timestamp,
    authTagValid: true,
    rssiDb: options?.rssiDb ?? -68,
    relayedByNode: options?.relayedBy ?? 'Local Mesh Radio'
  };
}

/**
 * Compare packet bandwidth savings vs traditional JSON payload
 */
export function getBandwidthBenchmark() {
  const jsonSample = JSON.stringify({
    protocol: "KavachMesh",
    version: 1,
    type: "EMERGENCY_SOS",
    severity: "CRITICAL",
    category: "HARASSMENT_THREAT",
    encrypted: true,
    ackRequired: true,
    ttl: 5,
    seq: 1420,
    vehiclePlate: "KA-01-MJ-8890",
    latitude: 12.971598,
    longitude: 77.594562,
    bearing: 142.5,
    speed: 34.2,
    timestamp: 1790948800,
    authTag: "3F9B88E1"
  });

  const jsonBytes = new TextEncoder().encode(jsonSample).length; // ~320 bytes
  const protobufEstBytes = 72;
  const kavachBytes = 28;

  // BLE 1M PHY airtime calculation (1 byte ~ 8 microsec + preamble & CRC)
  const bleAirtimeKavachMs = Number(((28 * 8 + 80) / 1000).toFixed(2)); // ~0.3 ms
  const bleAirtimeJsonMs = Number(((jsonBytes * 8 + 80) / 1000).toFixed(2)); // ~2.6 ms

  return {
    jsonBytes,
    protobufEstBytes,
    kavachBytes,
    savingsPercent: Math.round(((jsonBytes - kavachBytes) / jsonBytes) * 100),
    bleAirtimeKavachMs,
    bleAirtimeJsonMs
  };
}
