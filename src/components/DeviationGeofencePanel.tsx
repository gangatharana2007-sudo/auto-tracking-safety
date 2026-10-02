import React, { useState } from 'react';
import { 
  Compass, 
  Code2, 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Navigation, 
  Sliders, 
  Copy, 
  Check 
} from 'lucide-react';
import { RouteCorridor, LanguageCode } from '../types';
import { POPULAR_ROUTES, evaluateRouteDeviation, crossTrackDistanceMeters, calculateBearing } from '../utils/geofencing';
import { TRANSLATIONS } from '../utils/translations';
import { triggerHaptic } from '../utils/haptics';

interface DeviationGeofencePanelProps {
  language: LanguageCode;
  highContrast: boolean;
}

export const DeviationGeofencePanel: React.FC<DeviationGeofencePanelProps> = ({
  language,
  highContrast
}) => {
  const t = TRANSLATIONS[language];
  const [selectedRoute, setSelectedRoute] = useState<RouteCorridor>(POPULAR_ROUTES[0]);
  const [testTolerance, setTestTolerance] = useState<number>(selectedRoute.toleranceMeters);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Simulated test point
  const [testOffsetMeters, setTestOffsetMeters] = useState<number>(45);
  const [testBearingOffset, setTestBearingOffset] = useState<number>(15);

  const baseWaypoint = selectedRoute.waypoints[1];
  // Calculate synthetic test point offset
  const testLat = baseWaypoint.lat + (testOffsetMeters / 111320);
  const testLng = baseWaypoint.lng;
  const expectedHeading = calculateBearing(selectedRoute.waypoints[1], selectedRoute.waypoints[2]);
  const testHeading = (expectedHeading + testBearingOffset) % 360;

  const evaluation = evaluateRouteDeviation(
    { lat: testLat, lng: testLng },
    testHeading,
    { ...selectedRoute, toleranceMeters: testTolerance }
  );

  const productionCodeSnippet = `/**
 * KavachMesh Edge Geofencing & Cross-Track Error (XTD) Implementation
 * Runs offline inside SQLite spatial extension or native TypeScript edge daemon.
 */
export function calculateCrossTrackError(
  point: { lat: number; lng: number },
  segStart: { lat: number; lng: number },
  segEnd: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  // Angular distance from segment start to current position
  const d13 = haversineDistance(segStart, point) / R;
  
  // Great-circle bearings
  const theta13 = toRad(calculateBearing(segStart, point));
  const theta12 = toRad(calculateBearing(segStart, segEnd));

  // Cross-Track Distance via spherical trigonometry
  const xtd = Math.asin(Math.sin(d13) * Math.sin(theta13 - theta12)) * R;
  return Math.abs(xtd);
}

export function evaluateDeviationThreshold(
  xtdMeters: number, 
  corridorTolerance: number = 75,
  dangerZoneHit: boolean = false
): 'SAFE' | 'WARNING' | 'EMERGENCY_SOS' {
  if (dangerZoneHit || xtdMeters > corridorTolerance * 2.5) {
    return 'EMERGENCY_SOS'; // Broadcast 28B BLE Mesh Beacon
  }
  if (xtdMeters > corridorTolerance) {
    return 'WARNING'; // Request driver confirmation
  }
  return 'SAFE';
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(productionCodeSnippet);
    setCopiedCode(true);
    triggerHaptic('tap');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        highContrast ? 'bg-black border-amber-400 text-yellow-300' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Compass className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold tracking-tight">
            {t.navGeofence}: Corridor Deviation & Unsafe Zone Algorithms
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Public transport safety requires sub-second offline detection when an auto turns off the designated transit corridor 
          or enters unlit, high-crime areas. KavachMesh employs continuous Great-Circle Cross-Track Error (XTD) monitoring 
          with heading delta filtering to prevent false positives at traffic roundabouts.
        </p>
      </div>

      {/* Interactive Geofence Calibration Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Parametric Sliders */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Corridor Tolerance Calibration</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">{selectedRoute.cityName}</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Safe Corridor Buffer Radius:</span>
                <span className="font-mono text-amber-400 font-bold">{testTolerance} meters</span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                step="5"
                value={testTolerance}
                onChange={(e) => setTestTolerance(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-slate-500">
                Recommended: 60-80m for dense metropolitan arterial roads (Chennai / Bengaluru).
              </span>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Simulated Auto Distance From Centerline:</span>
                <span className="font-mono text-slate-200 font-bold">{testOffsetMeters} meters</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={testOffsetMeters}
                onChange={(e) => setTestOffsetMeters(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Heading Drift Angle (Bearing Delta):</span>
                <span className="font-mono text-slate-200 font-bold">{testBearingOffset}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="5"
                value={testBearingOffset}
                onChange={(e) => setTestBearingOffset(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Real-Time Evaluation Outcome */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>Edge Engine Verdict</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Offline Daemon Output</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Status:</span>
                {evaluation.isCriticalDeviation ? (
                  <span className="px-2.5 py-1 rounded-md bg-red-950/80 border border-red-500 text-red-300 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>AUTONOMOUS SOS TRIGGERED</span>
                  </span>
                ) : evaluation.isDeviated ? (
                  <span className="px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-500 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>CORRIDOR DEVIATION WARNING</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>NORMAL ROUTE FOLLOWING</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">Cross-Track Error</span>
                  <span className="text-slate-100 font-bold">{evaluation.minCrossTrackErrorMeters} meters</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Allowed Tolerance</span>
                  <span className="text-slate-100 font-bold">{testTolerance} meters</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800 leading-snug">
                <strong>Protocol Action:</strong> {evaluation.recommendedAction}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
            Rule 1: Cross-Track Error &gt; 2.5× Tolerance triggers SOS.<br />
            Rule 2: Heading Delta &gt; 70° sustained for 15s triggers Route Check.<br />
            Rule 3: Encroachment into Unlit Danger Zone triggers zero-delay P2P beacon.
          </div>
        </div>

      </div>

      {/* Production-Grade TypeScript Blueprint */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>Production Edge Daemon Implementation</span>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto text-[11px] font-mono text-emerald-300 leading-relaxed max-h-80">
          <code>{productionCodeSnippet}</code>
        </pre>
      </div>

    </div>
  );
};
