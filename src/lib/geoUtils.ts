/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
 * @param lat1 Latitude do primeiro ponto
 * @param lon1 Longitude do primeiro ponto
 * @param lat2 Latitude do segundo ponto
 * @param lon2 Longitude do segundo ponto
 * @returns Distância em quilômetros
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Raio da Terra em quilômetros
    const R = 6371
  
    // Converter graus para radianos
    const dLat = toRadians(lat2 - lat1)
    const dLon = toRadians(lon2 - lon1)
  
    // Fórmula de Haversine
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distância em quilômetros
  
    return distance
  }
  
  /**
   * Converte graus para radianos
   */
  function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
  
  /**
   * Verifica se a localização atual está a pelo menos uma distância mínima da localização de referência
   * @param currentLat Latitude atual
   * @param currentLon Longitude atual
   * @param referenceLat Latitude de referência
   * @param referenceLon Longitude de referência
   * @param minDistance Distância mínima em quilômetros
   * @returns Verdadeiro se a distância for maior ou igual à distância mínima
   */
  export function isMinimumDistanceAway(
    currentLat: number,
    currentLon: number,
    referenceLat: number,
    referenceLon: number,
    minDistance: number,
  ): boolean {
    const distance = calculateDistance(currentLat, currentLon, referenceLat, referenceLon)
  
    return distance >= minDistance
  }
  
  