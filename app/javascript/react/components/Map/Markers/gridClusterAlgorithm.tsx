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
const ZOOM_THRESHOLD = 12; // Threshold for when to start viewport-focused clustering

// Simple mobile detection function
const isMobileDevice = () => {
  return (
    typeof window !== "undefined" &&
    (window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ))
  );
};

export class CustomAlgorithm implements Algorithm {
  private lastZoom: number | null = null;
  private cachedClusters: AlgorithmOutput | null = null;
  private hasInitialized: boolean = false;
  private isMobile: boolean;

  constructor() {
    this.isMobile = isMobileDevice();
  }

  public calculate({ markers, map }: AlgorithmInput): AlgorithmOutput {
    const zoom = Math.round(map.getZoom() || INITIAL_ZOOM);
    this.lastZoom = zoom;

    // Get current viewport bounds
    const bounds = map.getBounds();
    if (!bounds) {
      return { clusters: this.clusterMarkers(markers, zoom) };
    }

    // When zoomed in beyond threshold, use viewport-focused clustering
    if (zoom >= ZOOM_THRESHOLD) {
      const { visibleMarkers, nonVisibleMarkers } =
        this.splitMarkersByVisibility(markers, bounds);

      // For visible markers, use individual markers or small clusters based on density
      const visibleClusters = this.clusterMarkersInViewport(
        visibleMarkers,
        zoom,
        bounds
      );

      // For non-visible markers, always cluster with large grid size
      const nonVisibleClusters = this.clusterMarkers(
        nonVisibleMarkers,
        zoom,
        true
      );

      const clusters = [...visibleClusters, ...nonVisibleClusters];
      this.cachedClusters = { clusters };
      return this.cachedClusters;
    }

    // For lower zoom levels, use normal clustering
    const clusters = this.clusterMarkers(markers, zoom);
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

  private clusterMarkersInViewport(
    markers: Marker[],
    zoom: number,
    bounds: google.maps.LatLngBounds
  ): Cluster[] {
    if (markers.length === 0) return [];

    // Calculate viewport dimensions in pixels
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const nePoint = this.projectPoint(ne.lat(), ne.lng(), zoom);
    const swPoint = this.projectPoint(sw.lat(), sw.lng(), zoom);

    // Calculate viewport width and height in pixels
    const viewportWidth = Math.abs(nePoint.x - swPoint.x);
    const viewportHeight = Math.abs(nePoint.y - swPoint.y);

    // Adjust grid size based on viewport size and marker density
    const markerDensity = markers.length / (viewportWidth * viewportHeight);
    const dynamicGridSize = this.calculateDynamicGridSize(zoom, markerDensity);

    const grid: { [key: string]: Marker[] } = {};

    markers.forEach((marker) => {
      const position = this.getMarkerPosition(marker);
      const point = this.projectPoint(position.lat, position.lng, zoom);
      const cellX = Math.floor(point.x / dynamicGridSize);
      const cellY = Math.floor(point.y / dynamicGridSize);
      const cellKey = `${cellX}_${cellY}`;

      if (!grid[cellKey]) {
        grid[cellKey] = [];
      }
      grid[cellKey].push(marker);
    });

    // Create clusters or individual markers based on density
    return Object.values(grid).flatMap((cellMarkers) => {
      const DENSITY_THRESHOLD = 3; // Adjust this value to control when to create clusters

      if (cellMarkers.length >= DENSITY_THRESHOLD) {
        return [this.createCluster(cellMarkers)];
      } else {
        return cellMarkers.map((marker) => this.createCluster([marker]));
      }
    });
  }

  private calculateDynamicGridSize(
    zoom: number,
    markerDensity: number
  ): number {
    // Adjust base size for mobile
    const mobileMultiplier = this.isMobile ? 1.5 : 1;
    const baseSize = Math.max(
      (30 * mobileMultiplier) /
        Math.pow(1.5, Math.max(0, zoom - ZOOM_THRESHOLD)),
      this.isMobile ? 15 : 10
    );

    // Reduce density factor impact on mobile
    const densityFactor = this.isMobile
      ? Math.min(Math.max(markerDensity * 500, 0.75), 1.5)
      : Math.min(Math.max(markerDensity * 1000, 0.5), 2);

    return baseSize * densityFactor;
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

    // Use larger grid size for mobile devices
    const mobileMultiplier = this.isMobile ? 1.5 : 1;

    if (isOffscreen) {
      // Use even larger grid size for off-screen markers on mobile
      return baseSize * (this.isMobile ? 3 : 2);
    }

    if (zoom <= 7) return baseSize * mobileMultiplier;

    const reductionRate = zoom >= 12 ? 3.0 : 1.3;
    const zoomOffset = zoom >= 12 ? 5 : 8;

    const exponent = Math.max(0, zoom - zoomOffset);
    return Math.max(
      (baseSize * mobileMultiplier) / Math.pow(reductionRate, exponent),
      this.isMobile ? 8 : 5
    );
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
