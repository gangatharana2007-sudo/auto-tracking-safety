import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  MapPin, 
  Compass, 
  Radio, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Layers, 
  Volume2, 
  VolumeX, 
  Navigation, 
  Car,
  Wifi,
  ChevronRight
} from 'lucide-react';
import { GeoPoint, RouteCorridor, LanguageCode, MeshNodePeer } from '../types';
import { POPULAR_ROUTES, evaluateRouteDeviation, RouteDeviationEvaluation, haversineDistanceMeters } from '../utils/geofencing';
import { TRANSLATIONS } from '../utils/translations';
import { triggerHaptic } from '../utils/haptics';
import { playAlertSound } from '../utils/audioAlert';
import { encodeMeshPacket, PacketTypeEnum } from '../utils/meshProtocol';
import { meshBroadcaster } from '../utils/meshBroadcaster';

interface MeshLiveMapProps {
  language: LanguageCode;
  highContrast: boolean;
  onTriggerSOSModal: () => void;
  driverPlate: string;
}

export const MeshLiveMap: React.FC<MeshLiveMapProps> = ({
  language,
  highContrast,
  onTriggerSOSModal,
  driverPlate
}) => {
  const t = TRANSLATIONS[language];
  const [selectedRoute, setSelectedRoute] = useState<RouteCorridor>(POPULAR_ROUTES[0]);
  const [currentPosition, setCurrentPosition] = useState<GeoPoint>(POPULAR_ROUTES[0].waypoints[0]);
  const [currentBearing, setCurrentBearing] = useState<number>(145);
  const [currentSpeed, setCurrentSpeed] = useState<number>(32);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simMode, setSimMode] = useState<'normal' | 'deviating' | 'danger'>('normal');
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [breadcrumbs, setBreadcrumbs] = useState<GeoPoint[]>([POPULAR_ROUTES[0].waypoints[0]]);
  const [lastRelayEvent, setLastRelayEvent] = useState<string | null>(null);

  // Animation step tracker
  const waypointIndexRef = useRef<number>(0);
  const progressRatioRef = useRef<number>(0);
  const deviationOffsetRef = useRef<number>(0);

  // Compute live deviation telemetry
  const deviationEval: RouteDeviationEvaluation = evaluateRouteDeviation(
    currentPosition,
    currentBearing,
    selectedRoute
  );

  // Subscribe to mesh broadcast events for peer live updates
  useEffect(() => {
    const unsubscribe = meshBroadcaster.subscribe((event) => {
      if (event.type === 'PACKET_RELAYED' || event.type === 'PACKET_TRANSMITTED') {
        setLastRelayEvent(`${event.decoded.relayedByNode || event.senderNodeId} relayed pkt #${event.decoded.sequenceId}`);
        setTimeout(() => setLastRelayEvent(null), 4000);
      }
    });
    return unsubscribe;
  }, []);

  // Simulation tick loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const waypoints = selectedRoute.waypoints;
      if (waypoints.length < 2) return;

      const idx = waypointIndexRef.current;
      const nextIdx = Math.min(waypoints.length - 1, idx + 1);

      const p1 = waypoints[idx];
      const p2 = waypoints[nextIdx];

      // Advance progress
      progressRatioRef.current += 0.04;
      if (progressRatioRef.current >= 1) {
        progressRatioRef.current = 0;
        waypointIndexRef.current = (idx + 1) % (waypoints.length - 1);
      }

      // Linear interpolation between waypoints
      const r = progressRatioRef.current;
      let targetLat = p1.lat + (p2.lat - p1.lat) * r;
      let targetLng = p1.lng + (p2.lng - p1.lng) * r;

      // Handle deviation / off-route turn
      if (simMode === 'deviating') {
        deviationOffsetRef.current = Math.min(0.0022, deviationOffsetRef.current + 0.00015);
        // Push latitude and longitude off corridor by ~150-200 meters
        targetLat += deviationOffsetRef.current;
        targetLng -= deviationOffsetRef.current * 0.8;
      } else if (simMode === 'danger') {
        // Move towards the designated danger zone
        const dangerCenter = selectedRoute.dangerZones[0]?.center || p1;
        targetLat = dangerCenter.lat + 0.0004;
        targetLng = dangerCenter.lng + 0.0004;
      } else {
        // Normal mode
        if (deviationOffsetRef.current > 0) {
          deviationOffsetRef.current = Math.max(0, deviationOffsetRef.current - 0.0002);
        }
      }

      const newPos: GeoPoint = { lat: Number(targetLat.toFixed(6)), lng: Number(targetLng.toFixed(6)) };
      setCurrentPosition(newPos);
      setBreadcrumbs((prev) => [...prev.slice(-25), newPos]);

      // Calculate bearing
      const deltaLat = p2.lat - p1.lat;
      const deltaLng = p2.lng - p1.lng;
      let heading = (Math.atan2(deltaLng, deltaLat) * 180) / Math.PI;
      if (simMode === 'deviating') heading = (heading + 75) % 360;
      setCurrentBearing(Math.round((heading + 360) % 360));

      // Fluctuating speed
      setCurrentSpeed(Math.round(28 + Math.sin(Date.now() / 1000) * 8));
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating, simMode, selectedRoute]);

  // Audio and Haptic warnings on critical deviation
  useEffect(() => {
    if (deviationEval.isCriticalDeviation && !audioMuted) {
      playAlertSound('deviation');
      triggerHaptic('deviation');
    }
  }, [deviationEval.isCriticalDeviation, audioMuted]);

  // Switch route handler
  const handleRouteChange = (routeId: string) => {
    const route = POPULAR_ROUTES.find((r) => r.id === routeId) || POPULAR_ROUTES[0];
    setSelectedRoute(route);
    setCurrentPosition(route.waypoints[0]);
    waypointIndexRef.current = 0;
    progressRatioRef.current = 0;
    deviationOffsetRef.current = 0;
    setSimMode('normal');
    setBreadcrumbs([route.waypoints[0]]);
    triggerHaptic('tap');
  };

  // Convert GPS Coordinates to SVG Canvas Coordinates
  const getSvgCoordinates = (point: GeoPoint) => {
    const waypoints = selectedRoute.waypoints;
    const lats = waypoints.map((w) => w.lat);
    const lngs = waypoints.map((w) => w.lng);

    const minLat = Math.min(...lats) - 0.005;
    const maxLat = Math.max(...lats) + 0.005;
    const minLng = Math.min(...lngs) - 0.005;
    const maxLng = Math.max(...lngs) + 0.005;

    // SVG viewBox: 0 0 800 600
    const x = ((point.lng - minLng) / (maxLng - minLng)) * 740 + 30;
    // Invert Y because latitude increases northward
    const y = 570 - ((point.lat - minLat) / (maxLat - minLat)) * 540;

    return { x, y };
  };

  const autoSvgPos = getSvgCoordinates(currentPosition);

  // Corridor polyline points
  const routePointsSvg = selectedRoute.waypoints.map(getSvgCoordinates);
  const routePathD = routePointsSvg.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  return (
    <div className="space-y-4">
      
      {/* Top Route Selector & Quick Status Ribbon */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        highContrast 
          ? 'bg-black border-amber-400 text-yellow-300' 
          : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              {t.selectRoute}
            </label>
            <select
              value={selectedRoute.id}
              onChange={(e) => handleRouteChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              {POPULAR_ROUTES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.cityName}: {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:block h-8 w-[1px] bg-slate-800" />

          {/* Real-time Status Badge */}
          <div className="flex items-center gap-2">
            {deviationEval.isCriticalDeviation ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>{t.corridorStatusDeviated} ({deviationEval.minCrossTrackErrorMeters}m off corridor)</span>
              </div>
            ) : deviationEval.insideDangerZone ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{t.corridorStatusDanger}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t.corridorStatusSafe} ({deviationEval.minCrossTrackErrorMeters}m from center)</span>
              </div>
            )}
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              triggerHaptic('tap');
              setSimMode('normal');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              simMode === 'normal'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {t.simulateNormal}
          </button>

          <button
            onClick={() => {
              triggerHaptic('deviation');
              setSimMode('deviating');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              simMode === 'deviating'
                ? 'bg-red-600 text-white border-red-500 shadow-sm animate-pulse'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t.simulateDeviation}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('tap');
              setIsSimulating(!isSimulating);
            }}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            title={isSimulating ? 'Pause Movement' : 'Resume Movement'}
            aria-label="Toggle Movement Simulation"
          >
            {isSimulating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            title={audioMuted ? 'Unmute Audio Warning' : 'Mute Audio Warning'}
            aria-label="Toggle Audio Warning"
          >
            {audioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Main Map Viewport & Peer Mesh Overlay */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl min-h-[440px] sm:min-h-[520px]">
        
        {/* SVG Graphic Map Canvas */}
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full min-h-[440px] sm:min-h-[520px] select-none"
        >
          {/* Subtle Grid Lines simulating urban street grid */}
          <defs>
            <pattern id="streetGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            {/* Safe Corridor Glow Filter */}
            <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Mesh wave radar gradient */}
            <radialGradient id="meshWaveGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sosWaveGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#ef4444" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="800" height="600" fill="#0b0f19" />
          <rect width="800" height="600" fill="url(#streetGrid)" />

          {/* Secondary Arterial Connecting Roads (Atmospheric) */}
          <path
            d="M 20 180 Q 220 240 400 160 T 780 220"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
            strokeDasharray="4 6"
          />
          <path
            d="M 60 520 C 260 480 500 560 760 440"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
            strokeDasharray="4 6"
          />

          {/* Safe Corridor Buffer Polygon / Ribbon (Wide Stroke) */}
          <path
            d={routePathD}
            fill="none"
            stroke="rgba(16, 185, 129, 0.15)"
            strokeWidth="50"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Inner Safe Corridor Baseline */}
          <path
            d={routePathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            className="opacity-80"
          />

          {/* Designated Danger Zone */}
          {selectedRoute.dangerZones.map((zone, zIdx) => {
            const dangerPos = getSvgCoordinates(zone.center);
            return (
              <g key={zIdx}>
                <circle
                  cx={dangerPos.x}
                  cy={dangerPos.y}
                  r="65"
                  fill="rgba(239, 68, 68, 0.15)"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <circle cx={dangerPos.x} cy={dangerPos.y} r="6" fill="#ef4444" />
                <text
                  x={dangerPos.x}
                  y={dangerPos.y - 12}
                  fill="#f87171"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  ⚠ {zone.name}
                </text>
              </g>
            );
          })}

          {/* Waypoint Markers */}
          {selectedRoute.waypoints.map((wp, wIdx) => {
            const pt = getSvgCoordinates(wp);
            const isStart = wIdx === 0;
            const isEnd = wIdx === selectedRoute.waypoints.length - 1;
            return (
              <g key={wIdx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isStart || isEnd ? 6 : 4}
                  fill={isStart ? '#10b981' : isEnd ? '#f59e0b' : '#64748b'}
                />
                {(isStart || isEnd) && (
                  <text
                    x={pt.x}
                    y={pt.y + 16}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {wp.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Vehicle Breadcrumbs */}
          {breadcrumbs.map((b, bIdx) => {
            const bPt = getSvgCoordinates(b);
            const opacity = (bIdx / breadcrumbs.length) * 0.7;
            return (
              <circle
                key={bIdx}
                cx={bPt.x}
                cy={bPt.y}
                r="2.5"
                fill={deviationEval.isCriticalDeviation ? '#ef4444' : '#f59e0b'}
                opacity={opacity}
              />
            );
          })}

          {/* Peer Auto-Rickshaws in Mesh Vicinity */}
          {meshBroadcaster.peerNodes.map((peer, pIdx) => {
            const peerPos = getSvgCoordinates({ lat: peer.lat, lng: peer.lng });
            return (
              <g key={peer.id} className="transition-all duration-500">
                {/* Peer radio link to current auto */}
                <line
                  x1={autoSvgPos.x}
                  y1={autoSvgPos.y}
                  x2={peerPos.x}
                  y2={peerPos.y}
                  stroke="rgba(245, 158, 11, 0.25)"
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                />
                
                {/* Peer Node Marker */}
                <circle
                  cx={peerPos.x}
                  cy={peerPos.y}
                  r="8"
                  fill="#1e293b"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
                <circle
                  cx={peerPos.x}
                  cy={peerPos.y}
                  r="3.5"
                  fill="#f59e0b"
                />
                
                {/* Peer Plate and RSSI Label */}
                <text
                  x={peerPos.x}
                  y={peerPos.y - 12}
                  fill="#cbd5e1"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {peer.vehiclePlate} ({peer.rssiDb}dBm)
                </text>
              </g>
            );
          })}

          {/* BLE Mesh Coverage Waves from Current Vehicle */}
          <circle
            cx={autoSvgPos.x}
            cy={autoSvgPos.y}
            r="120"
            fill={deviationEval.isCriticalDeviation ? 'url(#sosWaveGrad)' : 'url(#meshWaveGrad)'}
            stroke={deviationEval.isCriticalDeviation ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)'}
            strokeWidth="1"
            className="animate-pulse"
          />

          {/* Main Auto-Rickshaw Vehicle Node */}
          <g transform={`translate(${autoSvgPos.x}, ${autoSvgPos.y}) rotate(${currentBearing})`}>
            {/* Auto Vehicle Body Shape */}
            <rect
              x="-12"
              y="-18"
              width="24"
              height="36"
              rx="6"
              fill={deviationEval.isCriticalDeviation ? '#dc2626' : '#f59e0b'}
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Rickshaw front windshield */}
            <rect x="-8" y="-14" width="16" height="8" rx="2" fill="#0f172a" />
            {/* Rickshaw headlights */}
            <circle cx="-7" cy="-17" r="2" fill="#fef08a" />
            <circle cx="7" cy="-17" r="2" fill="#fef08a" />
          </g>

          {/* Current Vehicle Label */}
          <text
            x={autoSvgPos.x}
            y={autoSvgPos.y + 28}
            fill="#ffffff"
            fontSize="11"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="bold"
            textAnchor="middle"
          >
            Auto {driverPlate}
          </text>
        </svg>

        {/* Floating Relay Notification Toast inside Map */}
        {lastRelayEvent && (
          <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-md p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 backdrop-blur-md shadow-xl text-xs font-mono text-amber-300 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
            <span className="truncate">{lastRelayEvent}</span>
          </div>
        )}

        {/* Bottom Telemetry HUD */}
        <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block">{t.crossTrackError}</span>
            <span className={`text-sm font-bold tabular-nums ${
              deviationEval.isCriticalDeviation ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {deviationEval.minCrossTrackErrorMeters} m
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">{t.headingDelta}</span>
            <span className="text-sm font-bold text-slate-200 tabular-nums">
              {deviationEval.headingDeltaDeg}°
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">Speed & Heading</span>
            <span className="text-sm font-bold text-slate-200 tabular-nums">
              {currentSpeed} km/h · {currentBearing}°
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">{t.peersInRange}</span>
            <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5 tabular-nums">
              <Wifi className="w-3.5 h-3.5" />
              <span>4 Rickshaws</span>
            </span>
          </div>
        </div>

      </div>

      {/* Corridor Deviation Algorithm Context Box */}
      <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
        highContrast ? 'bg-black border-slate-700 text-slate-200' : 'bg-slate-900/60 border-slate-800 text-slate-300'
      }`}>
        <div className="font-bold text-slate-100 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-amber-400" />
          <span>Real-Time Deviation Logic: Spherical Cross-Track Error (XTD)</span>
        </div>
        <p className="text-slate-400">
          Evaluated via Great-Circle projection: <code className="text-yellow-300 font-mono">XTD = arcsin(sin(δ_AP) · sin(θ_AP - θ_AB)) · R</code>. 
          Corridor tolerance is set to <span className="font-semibold text-slate-200">{selectedRoute.toleranceMeters}m</span>. 
          If Cross-Track Error exceeds 2.5× tolerance (<span className="font-semibold text-slate-200">{selectedRoute.toleranceMeters * 2.5}m</span>) 
          or enters an unlit zone, KavachMesh initiates an autonomous 28-byte BLE emergency beacon without requiring mobile internet.
        </p>
      </div>

    </div>
  );
};
