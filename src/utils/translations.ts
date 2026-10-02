import { LanguageCode } from '../types';

export const TRANSLATIONS: Record<LanguageCode, {
  appName: string;
  tagline: string;
  navMap: string;
  navInspector: string;
  navGeofence: string;
  navQueue: string;
  navDashboard: string;
  sosButton: string;
  sosHoldToTrigger: string;
  sosCancelCountdown: string;
  sosBroadcastActive: string;
  statusOnlineMesh: string;
  statusOfflineMode: string;
  peersInRange: string;
  meshHops: string;
  encryptionBadge: string;
  corridorStatusSafe: string;
  corridorStatusDeviated: string;
  corridorStatusDanger: string;
  crossTrackError: string;
  headingDelta: string;
  selectRoute: string;
  simulateDeviation: string;
  simulateNormal: string;
  packetDesignTitle: string;
  packetByteBreakdown: string;
  bandwidthOptimization: string;
  offlineQueueTitle: string;
  driverRole: string;
  passengerRole: string;
  biometricVerify: string;
  biometricSuccess: string;
  biometricPrompt: string;
  highContrast: string;
  darkMode: string;
  language: string;
  shareTrip: string;
  leaderboardTitle: string;
  safeKmCount: string;
  relaysAssisted: string;
  karmaPoints: string;
  pushNotifications: string;
  notificationsEnabled: string;
  enableNotifications: string;
  testNotification: string;
  screenReaderAnnouncement: string;
  emergencyCategories: {
    GEOFENCE_DEVIATION: string;
    HARASSMENT_THREAT: string;
    MEDICAL_CRITICAL: string;
    VEHICLE_BREAKDOWN: string;
    ACCIDENT_COLLISION: string;
  };
}> = {
  en: {
    appName: 'KavachMesh',
    tagline: 'Offline-First Auto-Rickshaw P2P Emergency Safety Mesh',
    navMap: 'Live Corridor',
    navInspector: 'Packet Inspector',
    navGeofence: 'Deviation Engine',
    navQueue: 'Encrypted Queue',
    navDashboard: 'Guardian Dashboard',
    sosButton: 'EMERGENCY SOS',
    sosHoldToTrigger: 'Press to Broadcast Offline Mesh SOS',
    sosCancelCountdown: 'Cancel Emergency (3s window)',
    sosBroadcastActive: 'EMERGENCY BROADCAST TRANSMITTING OVER BLE MESH',
    statusOnlineMesh: 'BLE / Wi-Fi Mesh Connected',
    statusOfflineMode: 'Offline Radio Mode (0 Cellular Required)',
    peersInRange: 'Peer Autos Nearby',
    meshHops: 'Relay Hops',
    encryptionBadge: 'AES-256-GCM + Ephemeral R-VID',
    corridorStatusSafe: 'Within Safe Route Corridor',
    corridorStatusDeviated: 'Route Deviation Detected',
    corridorStatusDanger: 'Proximity to High-Risk Zone',
    crossTrackError: 'Cross-Track Distance',
    headingDelta: 'Bearing Drift',
    selectRoute: 'Select Transport Corridor',
    simulateDeviation: 'Simulate Route Deviation',
    simulateNormal: 'Resume Normal Route',
    packetDesignTitle: '28-Byte Binary Mesh Packet Architecture',
    packetByteBreakdown: 'Field-by-Field Wire Inspection',
    bandwidthOptimization: 'Bandwidth & Duty Cycle Efficiency',
    offlineQueueTitle: 'Encrypted Local Message Queue (SQLite/IndexedDB)',
    driverRole: 'Auto Driver Mode',
    passengerRole: 'Passenger Safe-Ride Mode',
    biometricVerify: 'Biometric Authenticate',
    biometricSuccess: 'Biometric Verified',
    biometricPrompt: 'Scan fingerprint or FaceID for shift verification',
    highContrast: 'High Contrast Mode',
    darkMode: 'Dark Mode',
    language: 'Language',
    shareTrip: 'Share Safe Ride',
    leaderboardTitle: 'Top Guardian Drivers Leaderboard',
    safeKmCount: 'Safe Kilometers',
    relaysAssisted: 'Emergency Relays Assisted',
    karmaPoints: 'Safety Karma Points',
    pushNotifications: 'Emergency Push Alerts',
    notificationsEnabled: 'Alerts Active',
    enableNotifications: 'Enable Push Notifications',
    testNotification: 'Trigger Test Alert',
    screenReaderAnnouncement: 'Live safety mesh telemetry updated',
    emergencyCategories: {
      GEOFENCE_DEVIATION: 'Unplanned Route Deviation',
      HARASSMENT_THREAT: 'Passenger / Driver Threat or Harassment',
      MEDICAL_CRITICAL: 'Critical Medical Emergency',
      VEHICLE_BREAKDOWN: 'Mechanical Failure in Transit',
      ACCIDENT_COLLISION: 'Vehicle Collision / Crash Impact'
    }
  },
  ta: {
    appName: 'கவசம் மெஷ்',
    tagline: 'இணையமில்லா ஆட்டோ அவசர பாதுகாப்பு மெஷ் நெட்வொர்க்',
    navMap: 'நேரலை வரைபடம்',
    navInspector: 'பாக்கெட் கட்டமைப்பு',
    navGeofence: 'விலகல் பகுப்பாய்வு',
    navQueue: 'ரகசிய வரிசை',
    navDashboard: 'பாதுகாவலர் பலகை',
    sosButton: 'அவசர உதவி (SOS)',
    sosHoldToTrigger: 'ஆட்டோக்களுக்கு அவசர தகவல் அனுப்ப அழுத்தவும்',
    sosCancelCountdown: 'ரத்து செய் (3 வினாடிகள்)',
    sosBroadcastActive: 'புளூடூத் மெஷ் மூலம் அவசர உதவி பரப்பப்படுகிறது',
    statusOnlineMesh: 'மெஷ் நெட்வொர்க் இணைக்கப்பட்டது',
    statusOfflineMode: 'இணையம் தேவையில்லை (ஆஃப்லைன் பயன்முறை)',
    peersInRange: 'அருகிலுள்ள ஆட்டோக்கள்',
    meshHops: 'மெஷ் தாவல்கள்',
    encryptionBadge: 'AES-256 பாதுகாப்பு குறியாக்கம்',
    corridorStatusSafe: 'சரியான பாதையில் செல்கிறது',
    corridorStatusDeviated: 'பாதை விலகல் கண்டறியப்பட்டது!',
    corridorStatusDanger: 'ஆபத்தான பகுதியில் நுழைகிறது',
    crossTrackError: 'பாதை விலகல் தூரம்',
    headingDelta: 'திசைமாற்ற அளவு',
    selectRoute: 'பயண வழியைத் தேர்ந்தெடுக்கவும்',
    simulateDeviation: 'பாதை விலகலை சோதித்துப் பார்',
    simulateNormal: 'சரியான பாதைக்கு திரும்பு',
    packetDesignTitle: '28-பைட் பைனரி மெஷ் பாக்கெட் வடிவமைப்பு',
    packetByteBreakdown: 'பைட் வாரியான புலங்கள்',
    bandwidthOptimization: 'குறைந்த அலைவரிசை செயல்திறன்',
    offlineQueueTitle: 'உள்ளூர் குறியாக்கப்பட்ட செய்தி வரிசை (SQLite/IndexedDB)',
    driverRole: 'ஆட்டோ ஓட்டுநர் பயன்முறை',
    passengerRole: 'பயணி பாதுகாப்பு பயன்முறை',
    biometricVerify: 'கைரேகை சரிபார்ப்பு',
    biometricSuccess: 'கைரேகை உறுதி செய்யப்பட்டது',
    biometricPrompt: 'ஓட்டுநர் சரிபார்ப்புக்கு கைரேகை வைக்கவும்',
    highContrast: 'உயர் மாறுபட்ட காட்சி',
    darkMode: 'இரவு பயன்முறை',
    language: 'மொழி',
    shareTrip: 'பயணத்தைப் பகிர்',
    leaderboardTitle: 'சிறந்த பாதுகாப்பாளர் தரவரிசை',
    safeKmCount: 'பாதுகாப்பான கி.மீ',
    relaysAssisted: 'உதவிய அவசர தகவல்கள்',
    karmaPoints: 'பாதுகாப்பு கர்ம புள்ளிகள்',
    pushNotifications: 'அவசர அறிவிப்புகள்',
    notificationsEnabled: 'அறிவிப்புகள் தயார்',
    enableNotifications: 'அறிவிப்புகளை இயக்கு',
    testNotification: 'சோதனை அறிவிப்பு',
    screenReaderAnnouncement: 'பாதுகாப்பு தகவல் புதுப்பிக்கப்பட்டது',
    emergencyCategories: {
      GEOFENCE_DEVIATION: 'திட்டமிடப்படாத பாதை விலகல்',
      HARASSMENT_THREAT: 'பயணி / ஓட்டுநர் அச்சுறுத்தல்',
      MEDICAL_CRITICAL: 'அவசர மருத்துவ உதவி',
      VEHICLE_BREAKDOWN: 'வாகனம் பழுது / செயலிழப்பு',
      ACCIDENT_COLLISION: 'வாகன விபத்து அல்லது மோதல்'
    }
  },
  es: {
    appName: 'KavachMesh',
    tagline: 'Malla P2P de Seguridad de Emergencia sin Conexión para Transporte',
    navMap: 'Corredor en Vivo',
    navInspector: 'Inspector de Paquetes',
    navGeofence: 'Motor de Desviación',
    navQueue: 'Cola Encriptada',
    navDashboard: 'Panel de Guardián',
    sosButton: 'SOS DE EMERGENCIA',
    sosHoldToTrigger: 'Presione para emitir SOS por malla BLE sin conexión',
    sosCancelCountdown: 'Cancelar emergencia (3s)',
    sosBroadcastActive: 'TRANSMISIÓN DE EMERGENCIA ACTIVA POR MALLA BLE',
    statusOnlineMesh: 'Malla BLE / Wi-Fi Conectada',
    statusOfflineMode: 'Modo Radio Desconectado (0 Datos Móviles)',
    peersInRange: 'Vehículos Cercanos en Malla',
    meshHops: 'Saltos de Malla',
    encryptionBadge: 'AES-256-GCM + ID Efímero R-VID',
    corridorStatusSafe: 'Dentro del Corredor Seguro',
    corridorStatusDeviated: 'Desviación de Ruta Detectada',
    corridorStatusDanger: 'Proximidad a Zona de Alto Riesgo',
    crossTrackError: 'Distancia Fuera de Trayecto',
    headingDelta: 'Desvío de Rumbo',
    selectRoute: 'Seleccionar Corredor de Transporte',
    simulateDeviation: 'Simular Desviación de Ruta',
    simulateNormal: 'Reanudar Ruta Normal',
    packetDesignTitle: 'Arquitectura de Paquete Binario de 28 Bytes',
    packetByteBreakdown: 'Inspección Campo por Campo',
    bandwidthOptimization: 'Optimización de Ancho de Banda',
    offlineQueueTitle: 'Cola Local Encriptada (SQLite/IndexedDB)',
    driverRole: 'Modo Conductor de Auto',
    passengerRole: 'Modo Pasajero Seguro',
    biometricVerify: 'Autenticación Biométrica',
    biometricSuccess: 'Biometría Verificada',
    biometricPrompt: 'Escanee huella o rostro para validar turno',
    highContrast: 'Modo Alto Contraste',
    darkMode: 'Modo Oscuro',
    language: 'Idioma',
    shareTrip: 'Compartir Viaje Seguro',
    leaderboardTitle: 'Tabla de Guardianes Destacados',
    safeKmCount: 'Kilómetros Seguros',
    relaysAssisted: 'Alertas SOS Retransmitidas',
    karmaPoints: 'Puntos de Karma Seguro',
    pushNotifications: 'Notificaciones de Emergencia',
    notificationsEnabled: 'Alertas Activas',
    enableNotifications: 'Activar Notificaciones Push',
    testNotification: 'Probar Notificación',
    screenReaderAnnouncement: 'Telemetría de seguridad actualizada',
    emergencyCategories: {
      GEOFENCE_DEVIATION: 'Desviación de Ruta No Planificada',
      HARASSMENT_THREAT: 'Amenaza o Acoso a Pasajero/Conductor',
      MEDICAL_CRITICAL: 'Emergencia Médica Crítica',
      VEHICLE_BREAKDOWN: 'Falla Mecánica en Ruta',
      ACCIDENT_COLLISION: 'Colisión o Impacto de Vehículo'
    }
  },
  fr: {
    appName: 'KavachMesh',
    tagline: 'Réseau Maillé P2P d\'Urgence Hors Ligne pour Transports Publics',
    navMap: 'Couloir en Direct',
    navInspector: 'Inspecteur de Paquets',
    navGeofence: 'Moteur de Déviation',
    navQueue: 'File Chiffrée',
    navDashboard: 'Tableau Gardien',
    sosButton: 'SOS D\'URGENCE',
    sosHoldToTrigger: 'Appuyez pour diffuser un SOS maillé BLE hors ligne',
    sosCancelCountdown: 'Annuler l\'urgence (3s)',
    sosBroadcastActive: 'DIFFUSION D\'URGENCE EN COURS SUR LE RÉSEAU MAILLÉ',
    statusOnlineMesh: 'Réseau Maillé BLE / Wi-Fi Connecté',
    statusOfflineMode: 'Mode Radio Hors Ligne (Aucune Donnée Requise)',
    peersInRange: 'Taxis à Proximité',
    meshHops: 'Sauts Maillés',
    encryptionBadge: 'AES-256-GCM + ID Éphémère R-VID',
    corridorStatusSafe: 'Dans le Couloir Sécurisé',
    corridorStatusDeviated: 'Déviation d\'Itinéraire Détectée',
    corridorStatusDanger: 'Proximité d\'une Zone à Risque',
    crossTrackError: 'Écart Transversal de Trajet',
    headingDelta: 'Dérive de Cap',
    selectRoute: 'Sélectionner le Couloir de Transport',
    simulateDeviation: 'Simuler une Déviation',
    simulateNormal: 'Reprendre l\'Itinéraire Normal',
    packetDesignTitle: 'Architecture de Paquet Binaire Compact de 28 Octets',
    packetByteBreakdown: 'Inspection des Octets et Champs',
    bandwidthOptimization: 'Optimisation de Bande Passante',
    offlineQueueTitle: 'File Locale Chiffrée (SQLite/IndexedDB)',
    driverRole: 'Mode Chauffeur de Taxi',
    passengerRole: 'Mode Passager Sécurisé',
    biometricVerify: 'Authentification Biométrique',
    biometricSuccess: 'Biométrie Validée',
    biometricPrompt: 'Scanner l\'empreinte pour validation de service',
    highContrast: 'Mode Contraste Élevé',
    darkMode: 'Mode Sombre',
    language: 'Langue',
    shareTrip: 'Partager le Trajet',
    leaderboardTitle: 'Classement des Chauffeurs Gardiens',
    safeKmCount: 'Kilomètres Sécurisés',
    relaysAssisted: 'Relais d\'Urgence Assistés',
    karmaPoints: 'Points de Karma Sécurité',
    pushNotifications: 'Notifications d\'Urgence',
    notificationsEnabled: 'Alertes Activées',
    enableNotifications: 'Activer les Notifications Push',
    testNotification: 'Tester la Notification',
    screenReaderAnnouncement: 'Télémétrie de sécurité mise à jour',
    emergencyCategories: {
      GEOFENCE_DEVIATION: 'Déviation d\'Itinéraire Imprévue',
      HARASSMENT_THREAT: 'Menace ou Harcèlement Passager/Chauffeur',
      MEDICAL_CRITICAL: 'Urgence Médicale Critique',
      VEHICLE_BREAKDOWN: 'Panne Mécanique en Route',
      ACCIDENT_COLLISION: 'Collision ou Accident de Véhicule'
    }
  }
};
