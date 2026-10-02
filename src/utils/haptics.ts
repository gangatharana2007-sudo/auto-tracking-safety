/**
 * Haptic feedback utility for mobile drivers and passengers.
 * Provides distinct physical vibration patterns for critical alerts, route deviation, and packet relays.
 */
export function triggerHaptic(type: 'sos' | 'deviation' | 'relay' | 'tap' | 'success') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'sos':
        // SOS urgent Morse rhythm: ... --- ...
        navigator.vibrate([150, 80, 150, 80, 300, 100, 300, 80, 150]);
        break;
      case 'deviation':
        // Urgent double pulse
        navigator.vibrate([180, 90, 180]);
        break;
      case 'relay':
        // Subtle micro tick for peer packet relay
        navigator.vibrate([35]);
        break;
      case 'success':
        // Melodic confirmation pulse
        navigator.vibrate([50, 40, 90]);
        break;
      case 'tap':
      default:
        navigator.vibrate([20]);
        break;
    }
  } catch (e) {
    // Some browsers restrict vibrate if not initiated by a user gesture
  }
}
