/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
  lng: number;
}

/**
 * Asynchronously retrieves geographical coordinates for a given address using geocoding.
 *
 * @param address The address to geocode.
 * @returns A promise that resolves to a Location object containing latitude and longitude.
 */
export async function getGeolocation(address: string): Promise<Location> {
  // TODO: Implement this by calling an API.

  return {
    lat: 34.052235,
    lng: -118.243683,
  };
}
