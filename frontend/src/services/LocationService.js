import * as Location from 'expo-location';
import { Platform } from 'react-native';

class LocationService {
  // Request location permission
  async requestLocationPermission() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.error('Error requesting location permission:', err);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation() {
    // Request permission first
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };
    } catch (error) {
      console.error('Location error:', error);
      throw error;
    }
  }

  // Watch location (for real-time tracking)
  async watchLocation(callback, errorCallback) {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        if (errorCallback) errorCallback(new Error('Location permission denied'));
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Check every 5 seconds
        },
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('Watch location error:', error);
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // Stop watching location
  stopWatchingLocation(subscription) {
    if (subscription) {
      subscription.remove();
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Distance in km
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Format coordinates for display
  formatCoordinates(latitude, longitude) {
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lonDir = longitude >= 0 ? 'E' : 'W';

    return `${Math.abs(latitude).toFixed(4)}°${latDir}, ${Math.abs(
      longitude
    ).toFixed(4)}°${lonDir}`;
  }

  // Get location name from coordinates (reverse geocoding)
  async getLocationName(latitude, longitude) {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result && result.length > 0) {
        const address = result[0];
        return `${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.trim();
      }

      return 'Unknown Location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  // Check if location services are enabled
  async isLocationEnabled() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }
}

export default LocationService;