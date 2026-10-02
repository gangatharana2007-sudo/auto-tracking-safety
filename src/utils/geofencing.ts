import { GeoPoint, RouteCorridor } from '../types';

const EARTH_RADIUS_METERS = 6371000;

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Haversine formula for great-circle distance between two GPS coordinates in meters.
 */
export function haversineDistanceMeters(p1: GeoPoint, p2: GeoPoint): number {
  const dLat = toRadians(p2.lat - p1.lat);
  const dLng = toRadians(p2.lng - p1.lng);
  const lat1 = toRadians(p1.lat);
  const lat2 = toRadians(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Great-circle initial bearing from point A to point B in degrees [0, 360).
 */
export function calculateBearing(start: GeoPoint, end: GeoPoint): number {
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const dLng = toRadians(end.lng - start.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}

/**
 * Calculate Cross-Track Distance (XTD):
 * Distance in meters of point P perpendicular to route segment A -> B.
 * Negative value indicates left of path, positive indicates right of path.
 */
export function crossTrackDistanceMeters(point: GeoPoint, segmentStart: GeoPoint, segmentEnd: GeoPoint): number {
  const d13 = haversineDistanceMeters(segmentStart, point) / EARTH_RADIUS_METERS; // angular distance
  const theta13 = toRadians(calculateBearing(segmentStart, point));
  const theta12 = toRadians(calculateBearing(segmentStart, segmentEnd));

  const xtd = Math.asin(Math.sin(d13) * Math.sin(theta13 - theta12)) * EARTH_RADIUS_METERS;
  return xtd;
}

/**
 * Along-Track Distance (ATD) in meters from segmentStart along the segment vector to projection of point.
 */
export function alongTrackDistanceMeters(point: GeoPoint, segmentStart: GeoPoint, segmentEnd: GeoPoint): number {
  const d13 = haversineDistanceMeters(segmentStart, point) / EARTH_RADIUS_METERS;
  const xtd = Math.abs(crossTrackDistanceMeters(point, segmentStart, segmentEnd)) / EARTH_RADIUS_METERS;

  const atd = Math.acos(Math.cos(d13) / Math.cos(xtd)) * EARTH_RADIUS_METERS;
  return isNaN(atd) ? 0 : atd;
}

export interface RouteDeviationEvaluation {
  minCrossTrackErrorMeters: number;
  nearestSegmentIndex: number;
  isDeviated: boolean;
  isCriticalDeviation: boolean;
  expectedHeadingDeg: number;
  headingDeltaDeg: number;
  insideDangerZone: boolean;
  dangerZoneAlert?: string;
  recommendedAction: string;
}

/**
 * Evaluate if an auto-rickshaw current GPS point has deviated from the safe corridor polyline.
 */
export function evaluateRouteDeviation(
  currentPos: GeoPoint,
  currentBearing: number,
  corridor: RouteCorridor
): RouteDeviationEvaluation {
  const waypoints = corridor.waypoints;
  if (waypoints.length < 2) {
    return {
      minCrossTrackErrorMeters: 0,
      nearestSegmentIndex: 0,
      isDeviated: false,
      isCriticalDeviation: false,
      expectedHeadingDeg: 0,
      headingDeltaDeg: 0,
      insideDangerZone: false,
      recommendedAction: 'Normal route monitoring'
    };
  }

  let minDistance = Infinity;
  let nearestSegmentIndex = 0;
  let expectedHeading = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const pA = waypoints[i];
    const pB = waypoints[i + 1];

    const segmentLength = haversineDistanceMeters(pA, pB);
    const atd = alongTrackDistanceMeters(currentPos, pA, pB);
    const xtd = Math.abs(crossTrackDistanceMeters(currentPos, pA, pB));

    let effectiveDistance: number;
    // If projection lies within segment bounds
    if (atd >= 0 && atd <= segmentLength) {
      effectiveDistance = xtd;
    } else {
      // Clamped to endpoints
      effectiveDistance = Math.min(
        haversineDistanceMeters(currentPos, pA),
        haversineDistanceMeters(currentPos, pB)
      );
    }

    if (effectiveDistance < minDistance) {
      minDistance = effectiveDistance;
      nearestSegmentIndex = i;
      expectedHeading = calculateBearing(pA, pB);
    }
  }

  // Heading drift
  let headingDelta = Math.abs(currentBearing - expectedHeading);
  if (headingDelta > 180) headingDelta = 360 - headingDelta;

  // Danger zone check
  let insideDangerZone = false;
  let dangerZoneAlert: string | undefined = undefined;

  for (const zone of corridor.dangerZones) {
    const distToDanger = haversineDistanceMeters(currentPos, zone.center);
    if (distToDanger <= zone.radiusMeters) {
      insideDangerZone = true;
      dangerZoneAlert = `Alert: Entered high-risk zone '${zone.name}' (${zone.reason})`;
      break;
    }
  }

  const isDeviated = minDistance > corridor.toleranceMeters || insideDangerZone;
  const isCriticalDeviation = minDistance > corridor.toleranceMeters * 2.5 || (insideDangerZone && minDistance > corridor.toleranceMeters);

  let recommendedAction = 'Optimal corridor maintained';
  if (isCriticalDeviation) {
    recommendedAction = 'CRITICAL: Triggering autonomous BLE Mesh SOS broadcast to peer auto-rickshaws!';
  } else if (isDeviated) {
    recommendedAction = 'WARNING: Auto strayed from designated route. Requesting driver route confirmation.';
  }

  return {
    minCrossTrackErrorMeters: Math.round(minDistance),
    nearestSegmentIndex,
    isDeviated,
    isCriticalDeviation,
    expectedHeadingDeg: Math.round(expectedHeading),
    headingDeltaDeg: Math.round(headingDelta),
    insideDangerZone,
    dangerZoneAlert,
    recommendedAction
  };
}

/**
 * Pre-configured realistic metropolitan routes in India
 */
export const POPULAR_ROUTES: RouteCorridor[] = [
  {
    id: 'chennai-central-to-tnagar',
    cityName: 'Chennai',
    name: 'Anna Nagar West to T. Nagar (Panagal Park)',
    startPoint: { lat: 13.0850, lng: 80.2101, name: 'Anna Nagar West Depot' },
    endPoint: { lat: 13.0405, lng: 80.2337, name: 'Panagal Park, T. Nagar' },
    toleranceMeters: 80,
    waypoints: [
      { lat: 13.0850, lng: 80.2101, name: 'Anna Nagar Depot' },
      { lat: 13.0805, lng: 80.2145, name: 'Roundtana Junction' },
      { lat: 13.0732, lng: 80.2180, name: 'Shenoy Nagar Metro' },
      { lat: 13.0645, lng: 80.2195, name: 'Aminjikarai Market' },
      { lat: 13.0560, lng: 80.2240, name: 'Valluvar Kottam High Rd' },
      { lat: 13.0480, lng: 80.2300, name: 'Pondy Bazaar Junction' },
      { lat: 13.0405, lng: 80.2337, name: 'Panagal Park' }
    ],
    dangerZones: [
      {
        name: 'Cooum Canal Isolated Culvert',
        center: { lat: 13.0680, lng: 80.2080 },
        radiusMeters: 180,
        reason: 'Unlit dead-end bypass without street cameras'
      }
    ]
  },
  {
    id: 'bangalore-indiranagar-koramangala',
    cityName: 'Bengaluru',
    name: 'Indiranagar 100ft Rd to Koramangala Sony Signal',
    startPoint: { lat: 12.9784, lng: 77.6408, name: 'Indiranagar 12th Main' },
    endPoint: { lat: 12.9352, lng: 77.6245, name: 'Sony World Signal, Koramangala' },
    toleranceMeters: 75,
    waypoints: [
      { lat: 12.9784, lng: 77.6408, name: 'Indiranagar 100ft Rd' },
      { lat: 12.9698, lng: 77.6420, name: 'Doopanahalli Junction' },
      { lat: 12.9602, lng: 77.6445, name: 'Domlur Flyover' },
      { lat: 12.9515, lng: 77.6390, name: 'Intermediate Ring Rd (EGL)' },
      { lat: 12.9430, lng: 77.6320, name: 'Ejipura Signal' },
      { lat: 12.9352, lng: 77.6245, name: 'Sony World Koramangala' }
    ],
    dangerZones: [
      {
        name: 'Ejipura Unpaved Marsh Drain',
        center: { lat: 12.9480, lng: 77.6220 },
        radiusMeters: 200,
        reason: 'Poor mobile network coverage & isolated construction yard'
      }
    ]
  },
  {
    id: 'delhi-cp-to-gurgaon',
    cityName: 'Delhi NCR',
    name: 'Connaught Place to Dhaula Kuan Arterial',
    startPoint: { lat: 28.6315, lng: 77.2167, name: 'CP Outer Circle' },
    endPoint: { lat: 28.5921, lng: 77.1610, name: 'Dhaula Kuan Metro Interchange' },
    toleranceMeters: 90,
    waypoints: [
      { lat: 28.6315, lng: 77.2167, name: 'Connaught Place' },
      { lat: 28.6220, lng: 77.2025, name: 'Shivaji Stadium' },
      { lat: 28.6110, lng: 77.1850, name: 'Talkatora Stadium Rd' },
      { lat: 28.6015, lng: 77.1720, name: 'Willingdon Crescent' },
      { lat: 28.5921, lng: 77.1610, name: 'Dhaula Kuan' }
    ],
    dangerZones: [
      {
        name: 'Southern Ridge Forest Cutoff',
        center: { lat: 28.6080, lng: 77.1650 },
        radiusMeters: 250,
        reason: 'Unlit dense forest track prohibited after 21:00'
      }
    ]
  }
];
