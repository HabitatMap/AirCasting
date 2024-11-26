import {
  Algorithm,
  AlgorithmInput,
  AlgorithmOutput,
  Cluster,
  Marker,
} from "@googlemaps/markerclusterer";

function getMarkerPosition(marker: Marker): google.maps.LatLngLiteral {
  if (marker instanceof google.maps.Marker) {
    const position = marker.getPosition();
    if (position) {
      return position.toJSON();
    } else {
      throw new Error("Marker position is undefined.");
    }
  } else {
    // Assuming FeatureMarker has a 'position' property of type LatLngLiteral
    if (!marker.position) {
      throw new Error("Marker position is undefined.");
    }
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

export class CustomAlgorithm implements Algorithm {
  private baseCellSize: number;
  private minimumClusterSize: number;
  private lastZoomLevel: number | null = null;
  private cachedClusters: AlgorithmOutput | null = null;
  private hasInitialized: boolean = false;
  private markerCount: number = 0;
  private hadProjection: boolean = false;
  private lastBounds: google.maps.LatLngBounds | null = null;
  private lastCalculationTime: number = 0;
  private calculationThrottle: number = 50; // ms

  constructor({
    baseCellSize = 100,
    minimumClusterSize = 2,
  }: {
    baseCellSize?: number;
    minimumClusterSize?: number;
  } = {}) {
    console.log("CustomAlgorithm instantiated", {
      baseCellSize,
      minimumClusterSize,
    });

    this.baseCellSize = baseCellSize;
    this.minimumClusterSize = minimumClusterSize;
    this.clearCache();
  }

  public calculate({
    markers,
    map,
    mapCanvasProjection,
  }: AlgorithmInput): AlgorithmOutput {
    const now = Date.now();

    // Throttle calculations
    if (
      this.cachedClusters &&
      now - this.lastCalculationTime < this.calculationThrottle
    ) {
      return this.cachedClusters;
    }

    this.lastCalculationTime = now;

    const currentZoom = map.getZoom() || 0;
    const hasProjection = !!mapCanvasProjection;
    const currentBounds = map.getBounds();

    console.log("Algorithm calculate called", {
      markerCount: markers.length,
      previousMarkerCount: this.markerCount,
      zoom: currentZoom,
      hasProjection,
      hasBounds: !!currentBounds,
      hasCachedClusters: !!this.cachedClusters,
      hasInitialized: this.hasInitialized,
      hadProjection: this.hadProjection,
    });

    // Only recalculate if necessary
    const shouldRecalculate =
      !this.hasInitialized ||
      markers.length !== this.markerCount ||
      (hasProjection && !this.hadProjection) ||
      this.lastZoomLevel !== currentZoom;

    if (!shouldRecalculate && this.cachedClusters) {
      return this.cachedClusters;
    }

    this.hadProjection = hasProjection;
    this.markerCount = markers.length;
    this.lastZoomLevel = currentZoom;

    // If no markers, return empty clusters
    if (markers.length === 0) {
      console.log("No markers, returning empty clusters");
      return { clusters: [] };
    }

    // If map is not ready yet, create basic clustering based on coordinates
    if (!mapCanvasProjection || !currentBounds) {
      console.log("Map not ready, using basic clustering");
      const clusters = this.performBasicClustering(markers);
      this.cachedClusters = { clusters };
      this.hasInitialized = true;
      return { clusters };
    }

    console.log("Performing regular clustering");
    const clusters = this.performRegularClustering(
      markers,
      currentZoom,
      mapCanvasProjection
    );

    this.cachedClusters = { clusters };
    this.hasInitialized = true;

    return { clusters };
  }

  public clearCache() {
    console.log("Clearing algorithm cache and initialization state");
    this.lastZoomLevel = null;
    this.cachedClusters = null;
    this.hasInitialized = false;
    this.markerCount = 0;
    this.hadProjection = false;
  }

  private performBasicClustering(markers: Marker[]): Cluster[] {
    const clusters: Cluster[] = [];
    const markersByRegion = new Map<string, Marker[]>();

    markers.forEach((marker) => {
      const position = getMarkerPosition(marker);
      const cellX = Math.floor(position.lat * 10);
      const cellY = Math.floor(position.lng * 10);
      const cellKey = `${cellX}_${cellY}`;

      if (!markersByRegion.has(cellKey)) {
        markersByRegion.set(cellKey, []);
      }
      markersByRegion.get(cellKey)!.push(marker);
    });

    markersByRegion.forEach((cellMarkers) => {
      if (cellMarkers.length < this.minimumClusterSize) {
        cellMarkers.forEach((marker) => {
          clusters.push(
            new Cluster({
              markers: [marker],
              position: new google.maps.LatLng(getMarkerPosition(marker)),
            })
          );
        });
      } else {
        const centroid = this.calculateCentroid(cellMarkers);
        clusters.push(
          new Cluster({
            markers: cellMarkers,
            position: centroid,
          })
        );
      }
    });

    console.log("Basic clustering complete", {
      resultingClusters: clusters.length,
      markersInRegions: markersByRegion.size,
    });

    return clusters;
  }

  private performRegularClustering(
    markers: Marker[],
    currentZoom: number,
    mapCanvasProjection: google.maps.MapCanvasProjection
  ): Cluster[] {
    const clusters: Cluster[] = [];
    const grid = new Map<string, Marker[]>();
    const gridSize = this.determineGridCellSize(currentZoom);

    // Batch process markers
    for (let i = 0; i < markers.length; i += 100) {
      const batch = markers.slice(i, i + 100);
      batch.forEach((marker) => {
        const position = getMarkerPosition(marker);
        const point = mapCanvasProjection.fromLatLngToContainerPixel(
          new google.maps.LatLng(position)
        );

        if (!point) return;

        const cellKey = `${Math.floor(point.x / gridSize)}_${Math.floor(
          point.y / gridSize
        )}`;

        if (!grid.has(cellKey)) {
          grid.set(cellKey, []);
        }
        grid.get(cellKey)!.push(marker);
      });
    }

    grid.forEach((cellMarkers) => {
      if (cellMarkers.length < this.minimumClusterSize) {
        cellMarkers.forEach((marker) => {
          clusters.push(
            new Cluster({
              markers: [marker],
              position: new google.maps.LatLng(getMarkerPosition(marker)),
            })
          );
        });
      } else {
        const centroid = this.calculateCentroid(cellMarkers);
        clusters.push(
          new Cluster({
            markers: cellMarkers,
            position: centroid,
          })
        );
      }
    });

    console.log("Regular clustering complete", {
      resultingClusters: clusters.length,
      markersInCells: grid.size,
      gridCellSize: gridSize,
    });

    return clusters;
  }

  private determineGridCellSize(zoomLevel: number): number {
    const adjustedBaseCellSize = 25;
    let cellSize;
    if (zoomLevel >= 12) {
      cellSize = adjustedBaseCellSize / Math.pow(3, Math.max(0, zoomLevel - 5));
    } else {
      cellSize =
        adjustedBaseCellSize / Math.pow(1.3, Math.max(0, zoomLevel - 8));
    }

    const minimumCellSize = 5;
    return Math.max(cellSize, minimumCellSize);
  }

  private calculateCentroid(markers: Marker[]): google.maps.LatLng {
    let sumLat = 0;
    let sumLng = 0;

    markers.forEach((marker) => {
      const position = getMarkerPosition(marker);
      sumLat += position.lat;
      sumLng += position.lng;
    });

    const centroidLat = sumLat / markers.length;
    const centroidLng = sumLng / markers.length;

    return new google.maps.LatLng(centroidLat, centroidLng);
  }

  // Add method to force recalculation
  public forceRecalculate(): void {
    this.lastZoomLevel = null;
    this.cachedClusters = null;
  }
}
