import {
  Algorithm,
  AlgorithmInput,
  AlgorithmOutput,
  Cluster,
  Marker,
} from "@googlemaps/markerclusterer";

const TILE_SIZE = 256;
const MINIMUM_CLUSTER_SIZE = 2;
const INITIAL_ZOOM = 7;

export class CustomAlgorithm implements Algorithm {
  private lastZoom: number | null = null;
  private cachedClusters: AlgorithmOutput | null = null;
  private hasInitialized: boolean = false;

  public calculate({ markers, map }: AlgorithmInput): AlgorithmOutput {
    const zoom = Math.round(map.getZoom() || INITIAL_ZOOM);
    this.lastZoom = zoom;

    // Get current viewport bounds
    const bounds = map.getBounds();
    if (!bounds) {
      return { clusters: this.clusterMarkers(markers, zoom) };
    }

    // Split markers into visible and non-visible
    const { visibleMarkers, nonVisibleMarkers } = this.splitMarkersByVisibility(
      markers,
      bounds
    );

    // Cluster visible markers with normal grid size
    const visibleClusters = this.clusterMarkers(visibleMarkers, zoom);

    // Cluster non-visible markers with larger grid size for better performance
    const nonVisibleClusters = this.clusterMarkers(
      nonVisibleMarkers,
      zoom,
      true
    );

    // Combine clusters
    const clusters = [...visibleClusters, ...nonVisibleClusters];
    this.cachedClusters = { clusters };
    return this.cachedClusters;
  }

  private splitMarkersByVisibility(
    markers: Marker[],
    bounds: google.maps.LatLngBounds
  ): { visibleMarkers: Marker[]; nonVisibleMarkers: Marker[] } {
    const visibleMarkers: Marker[] = [];
    const nonVisibleMarkers: Marker[] = [];

    markers.forEach((marker) => {
      const position = this.getMarkerPosition(marker);
      const latLng = new google.maps.LatLng(position.lat, position.lng);

      if (bounds.contains(latLng)) {
        visibleMarkers.push(marker);
      } else {
        nonVisibleMarkers.push(marker);
      }
    });

    return { visibleMarkers, nonVisibleMarkers };
  }

  private clusterMarkers(
    markers: Marker[],
    zoom: number,
    isOffscreen: boolean = false
  ): Cluster[] {
    const grid: { [key: string]: Marker[] } = {};
    // Use larger grid size for off-screen markers
    const gridSize = this.calculateGridSize(zoom, isOffscreen);

    markers.forEach((marker) => {
      const position = this.getMarkerPosition(marker);
      const point = this.projectPoint(position.lat, position.lng, zoom);
      const cellX = Math.floor(point.x / gridSize);
      const cellY = Math.floor(point.y / gridSize);
      const cellKey = `${cellX}_${cellY}`;

      if (!grid[cellKey]) {
        grid[cellKey] = [];
      }
      grid[cellKey].push(marker);
    });

    const clusters = Object.values(grid).flatMap((cellMarkers) => {
      if (cellMarkers.length >= MINIMUM_CLUSTER_SIZE) {
        return [this.createCluster(cellMarkers)];
      } else {
        // For off-screen markers, always cluster them
        if (isOffscreen && cellMarkers.length > 0) {
          return [this.createCluster(cellMarkers)];
        }
        return cellMarkers.map((marker) => this.createCluster([marker]));
      }
    });

    return clusters.sort((a, b) => b.markers!.length - a.markers!.length);
  }

  /**
   * Projects geographic coordinates to pixel coordinates using Web Mercator projection
   * This is used to convert lat/lng points to x/y coordinates for clustering on the map
   *
   * @param lat - Latitude in degrees (-90 to 90)
   * @param lng - Longitude in degrees (-180 to 180)
   * @param zoom - Map zoom level (0 to 21)
   * @returns {Object} - Projected coordinates { x: number, y: number } in pixels
   */
  private projectPoint(lat: number, lng: number, zoom: number) {
    // Calculate scale factor based on zoom level
    // Each zoom level doubles the scale: 2^zoom
    const scale = Math.pow(2, zoom);

    // Convert longitude to x coordinate
    const x = ((lng + 180) / 360) * TILE_SIZE * scale;

    // Convert latitude to radians for trigonometric calculations
    const latRad = (lat * Math.PI) / 180;

    // Convert latitude to y coordinate using Web Mercator projection
    // The formula preserves angles (conformal projection)
    const y =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      TILE_SIZE *
      scale;

    // Return projected coordinates in pixels
    return { x, y };
  }

  private calculateGridSize(
    zoom: number,
    isOffscreen: boolean = false
  ): number {
    const baseSize = 25;
    if (isOffscreen) {
      // Use larger grid size for off-screen markers
      return baseSize * 2;
    }

    if (zoom <= 7) return baseSize;

    const reductionRate = zoom >= 12 ? 3.0 : 1.3;
    const zoomOffset = zoom >= 12 ? 5 : 8;
    const exponent = Math.max(0, zoom - zoomOffset);
    return Math.max(baseSize / Math.pow(reductionRate, exponent), 5);
  }

  private createCluster(markers: Marker[]): Cluster {
    const positions = markers.map(this.getMarkerPosition);
    const lat =
      positions.reduce((sum, pos) => sum + pos.lat, 0) / markers.length;
    const lng =
      positions.reduce((sum, pos) => sum + pos.lng, 0) / markers.length;
    return new Cluster({ position: new google.maps.LatLng(lat, lng), markers });
  }

  private getMarkerPosition(marker: Marker): google.maps.LatLngLiteral {
    if (marker instanceof google.maps.Marker) {
      const position = marker.getPosition();
      return position ? position.toJSON() : { lat: 0, lng: 0 };
    } else {
      if (!marker.position) return { lat: 0, lng: 0 };

      return {
        lat:
          typeof marker.position.lat === "function"
            ? marker.position.lat()
            : marker.position.lat,
        lng:
          typeof marker.position.lng === "function"
            ? marker.position.lng()
            : marker.position.lng,
      };
    }
  }

  public clearCache(): void {
    this.lastZoom = null;
    this.cachedClusters = null;
    this.hasInitialized = false;
  }
}
