import { DecodedMeshPacket, MeshNodePeer, OfflineQueueRecord } from '../types';
import { decodeMeshPacket, PacketTypeEnum } from './meshProtocol';
import { localQueueDb } from './indexedDbQueue';
import { triggerHaptic } from './haptics';

export interface MeshBroadcastEvent {
  type: 'PACKET_TRANSMITTED' | 'PACKET_RELAYED' | 'PACKET_ACKED' | 'PEER_DISCOVERED';
  rawHex: string;
  decoded: DecodedMeshPacket;
  senderNodeId: string;
  hopPath: string[];
}

type MeshListener = (event: MeshBroadcastEvent) => void;

class MeshBroadcasterService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<MeshListener> = new Set();
  private processedPacketIds: Set<string> = new Set();

  public peerNodes: MeshNodePeer[] = [
    {
      id: 'node-auto-01',
      vehiclePlate: 'TN-09-A-1102',
      driverName: 'Murugan K. (Anna Nagar Stand)',
      distanceMeters: 45,
      rssiDb: -58,
      batteryPercent: 88,
      lastSeenMs: Date.now(),
      hopsAway: 1,
      status: 'ACTIVE',
      lat: 13.0838,
      lng: 80.2115
    },
    {
      id: 'node-auto-02',
      vehiclePlate: 'TN-07-K-7740',
      driverName: 'Suresh Babu (Shenoy Stand)',
      distanceMeters: 110,
      rssiDb: -72,
      batteryPercent: 74,
      lastSeenMs: Date.now() - 5000,
      hopsAway: 1,
      status: 'ACTIVE',
      lat: 13.0815,
      lng: 80.2138
    },
    {
      id: 'node-auto-03',
      vehiclePlate: 'TN-02-C-5519',
      driverName: 'Selvam R. (Koyambedu Stand)',
      distanceMeters: 210,
      rssiDb: -84,
      batteryPercent: 62,
      lastSeenMs: Date.now() - 14000,
      hopsAway: 2,
      status: 'ACTIVE',
      lat: 13.0780,
      lng: 80.2160
    },
    {
      id: 'node-gateway-01',
      vehiclePlate: 'TN-POLICE-PCR-14',
      driverName: 'Chennai Transit Police Mesh Repeater',
      distanceMeters: 380,
      rssiDb: -89,
      batteryPercent: 100,
      lastSeenMs: Date.now() - 2000,
      hopsAway: 3,
      status: 'ACTIVE',
      lat: 13.0720,
      lng: 80.2195
    }
  ];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('kavach_mesh_radio_layer');
      this.channel.onmessage = (ev) => {
        if (ev.data && ev.data.rawHex) {
          this.handleIncomingRawPacket(ev.data.rawHex, ev.data.senderNodeId || 'Remote Auto Tab', ev.data.hopPath || []);
        }
      };
    }
  }

  subscribe(listener: MeshListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: MeshBroadcastEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error notifying mesh listener', e);
      }
    });
  }

  /**
   * Broadcast a raw packet to all peer nodes within simulated BLE 30m-100m radio coverage.
   */
  async broadcastPacket(rawHex: string, localNodeId: string = 'Current Node'): Promise<void> {
    const decoded = decodeMeshPacket(rawHex, { rssiDb: -42, relayedBy: localNodeId });
    const packetKey = `${decoded.sequenceId}-${decoded.rotatingVehicleId}`;
    this.processedPacketIds.add(packetKey);

    // Save to local offline queue
    await localQueueDb.enqueue({
      packetHex: rawHex,
      cipherTextBase64: btoa(rawHex),
      ivHex: 'local-iv-001',
      status: 'RELAYED_BLE_MESH',
      category: decoded.category,
      payloadSummary: `[${decoded.type}] Lat:${decoded.latitude} Lng:${decoded.longitude} Seq:${decoded.sequenceId}`
    });

    // Notify local UI
    this.notify({
      type: 'PACKET_TRANSMITTED',
      rawHex,
      decoded,
      senderNodeId: localNodeId,
      hopPath: [localNodeId]
    });

    triggerHaptic('sos');

    // Broadcast across browser tabs
    if (this.channel) {
      this.channel.postMessage({
        rawHex,
        senderNodeId: localNodeId,
        hopPath: [localNodeId]
      });
    }

    // Simulate multi-hop mesh propagation among nearby auto rickshaws
    this.simulateMeshPropagationWave(rawHex, decoded, localNodeId);
  }

  /**
   * Simulated multi-hop relay wave across peer rickshaws
   */
  private simulateMeshPropagationWave(rawHex: string, decoded: DecodedMeshPacket, originId: string) {
    const sortedPeers = [...this.peerNodes].sort((a, b) => a.distanceMeters - b.distanceMeters);

    let hopDelay = 400;
    const currentHopPath = [originId];

    sortedPeers.forEach((peer, idx) => {
      setTimeout(() => {
        currentHopPath.push(peer.vehiclePlate);
        const relayedDecoded = {
          ...decoded,
          hopCount: idx + 1,
          ttlRemaining: Math.max(0, 5 - (idx + 1)),
          rssiDb: peer.rssiDb,
          relayedByNode: `${peer.driverName} (${peer.vehiclePlate})`
        };

        this.notify({
          type: 'PACKET_RELAYED',
          rawHex,
          decoded: relayedDecoded,
          senderNodeId: peer.id,
          hopPath: [...currentHopPath]
        });

        triggerHaptic('relay');

        // If reached police repeater gateway, simulate Cloud ACK
        if (peer.id === 'node-gateway-01') {
          setTimeout(() => {
            this.notify({
              type: 'PACKET_ACKED',
              rawHex,
              decoded: {
                ...relayedDecoded,
                type: 'ACK',
                payloadNote: 'Emergency Dispatch Station & PCR Van 14 acknowledged coordinates. Assistance en route!'
              },
              senderNodeId: peer.id,
              hopPath: [...currentHopPath, 'Transit Command HQ']
            });
            triggerHaptic('sos');
          }, 800);
        }
      }, hopDelay);

      hopDelay += 650;
    });
  }

  /**
   * Handle an incoming raw packet over radio / WebRTC / BroadcastChannel
   */
  private handleIncomingRawPacket(rawHex: string, senderNodeId: string, hopPath: string[]) {
    try {
      const decoded = decodeMeshPacket(rawHex, { rssiDb: -65, relayedBy: senderNodeId });
      const packetKey = `${decoded.sequenceId}-${decoded.rotatingVehicleId}`;

      // Loop avoidance
      if (this.processedPacketIds.has(packetKey)) {
        return;
      }
      this.processedPacketIds.add(packetKey);

      this.notify({
        type: 'PACKET_RELAYED',
        rawHex,
        decoded,
        senderNodeId,
        hopPath: [...hopPath, 'This Device']
      });

      if (decoded.severity === 'CRITICAL') {
        triggerHaptic('sos');
      } else {
        triggerHaptic('relay');
      }
    } catch (err) {
      console.warn('Failed to parse mesh packet', err);
    }
  }
}

export const meshBroadcaster = new MeshBroadcasterService();
