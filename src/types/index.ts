export type LanguageCode = 'en' | 'ta' | 'es' | 'fr';

export type UserRole = 'passenger' | 'driver';

export type EmergencyCategory = 
  | 'GEOFENCE_DEVIATION'
  | 'HARASSMENT_THREAT'
  | 'MEDICAL_CRITICAL'
  | 'VEHICLE_BREAKDOWN'
  | 'ACCIDENT_COLLISION';

export interface GeoPoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteCorridor {
  id: string;
  cityName: string;
  name: string;
  startPoint: GeoPoint;
  endPoint: GeoPoint;
  waypoints: GeoPoint[];
  toleranceMeters: number; // e.g. 75 meters
  dangerZones: {
    name: string;
    center: GeoPoint;
    radiusMeters: number;
    reason: string;
  }[];
}

export interface CompactMeshPacket {
  magic: number;          // 0x4B4D ('KM' = KavachMesh) - 2 bytes
  version: number;        // 0x01 - 1 byte
  packetType: number;     // 1=SOS, 2=HEARTBEAT, 3=ACK, 4=DEVIATION - 1 byte
  flags: number;          // Bitpacked (bit 0-2: severity, bit 3-5: category, bit 6: encrypted, bit 7: ack_req) - 1 byte
  ttl: number;            // Time to Live / Remaining hops (e.g. 5) - 1 byte
  sequenceId: number;     // Monotonic counter - 2 bytes uint16
  rotatingVehicleId: string; // 4 bytes hex (HMAC truncated R-VID)
  packedLat: number;      // 3-byte fixed point micro-degree
  packedLng: number;      // 3-byte fixed point micro-degree
  bearing: number;        // 1 byte (0-255 mapped to 0-360 deg)
  speedKmh: number;       // 1 byte (0-255 km/h)
  timestampSeconds: number; // 4 bytes uint32
  authTag: string;        // 4 bytes AES-GCM MAC / truncated signature
  rawBytesHex: string;
  totalSizeBytes: number; // Target 28 bytes
}

export interface DecodedMeshPacket {
  id: string;
  receivedAt: number;
  magicValid: boolean;
  version: number;
  type: 'SOS' | 'HEARTBEAT' | 'ACK' | 'DEVIATION_ALERT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  category: EmergencyCategory;
  isEncrypted: boolean;
  ackRequested: boolean;
  ttlRemaining: number;
  hopCount: number;
  sequenceId: number;
  rotatingVehicleId: string;
  latitude: number;
  longitude: number;
  bearingDeg: number;
  speedKmh: number;
  timestamp: Date;
  authTagValid: boolean;
  crossTrackDistanceMeters?: number;
  rssiDb: number;
  relayedByNode?: string;
  payloadNote?: string;
}

export interface MeshNodePeer {
  id: string;
  vehiclePlate: string;
  driverName: string;
  avatarUrl?: string;
  distanceMeters: number;
  rssiDb: number;
  batteryPercent: number;
  lastSeenMs: number;
  hopsAway: number;
  status: 'ACTIVE' | 'RELAYING' | 'OFFLINE';
  lat: number;
  lng: number;
}

export interface OfflineQueueRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  packetHex: string;
  cipherTextBase64: string;
  ivHex: string;
  status: 'QUEUED_LOCAL' | 'RELAYED_BLE_MESH' | 'ACK_RECEIVED' | 'SYNCED_CLOUD';
  retryCount: number;
  nextRetryMs: number;
  category: EmergencyCategory;
  payloadSummary: string;
}

export interface DriverSafetyStats {
  driverName: string;
  autoRegNumber: string;
  badgeTitle: string;
  karmaPoints: number;
  safeKilometers: number;
  safeTripsStreak: number;
  meshRelaysAssisted: number;
  nodeUptimeHours: number;
  emergencyResponseCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  driverName: string;
  autoRegNumber: string;
  location: string;
  karmaPoints: number;
  safeKm: number;
  sosRelayed: number;
  badge: string;
}
