// CustomAlgorithm.ts
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
  private gridSize: number;
  private minimumClusterSize: number;
  private lastZoomLevel: number | null = null;
  private cachedClusters: AlgorithmOutput | null = null;

  constructor({
    gridSize = 40,
    minimumClusterSize = 2,
  }: {
    gridSize?: number;
    minimumClusterSize?: number;
  } = {}) {
    this.gridSize = gridSize;
    this.minimumClusterSize = minimumClusterSize;
  }

  public calculate({
    markers,
    map,
    mapCanvasProjection,
  }: AlgorithmInput): AlgorithmOutput {
    const currentZoom = map.getZoom() || 0;

    // Return cached clusters if zoom hasn't changed
    if (this.lastZoomLevel === currentZoom && this.cachedClusters) {
      return this.cachedClusters;
    }

    if (!mapCanvasProjection) {
      const singleMarkerClusters = {
        clusters: markers.map(
          (marker) =>
            new Cluster({
              markers: [marker],
              position: new google.maps.LatLng(getMarkerPosition(marker)),
            })
        ),
      };
      this.cachedClusters = singleMarkerClusters;
      this.lastZoomLevel = currentZoom;
      return singleMarkerClusters;
    }

    const clusters: Cluster[] = [];
    const markersByCell = new Map<string, Marker[]>();
    const gridCellSize = this.determineGridCellSize(currentZoom);

    // Calculate viewport bounds
    const bounds = map.getBounds();
    if (!bounds) {
      this.cachedClusters = { clusters: [] };
      return { clusters: [] };
    }

    markers.forEach((marker) => {
      const position = getMarkerPosition(marker);
      const point = mapCanvasProjection.fromLatLngToContainerPixel(
        new google.maps.LatLng(position)
      );

      if (!point) {
        return;
      }

      const cellX = Math.floor(point.x / gridCellSize);
      const cellY = Math.floor(point.y / gridCellSize);
      const cellKey = `${cellX}_${cellY}`;

      if (!markersByCell.has(cellKey)) {
        markersByCell.set(cellKey, []);
      }

      markersByCell.get(cellKey)!.push(marker);
    });

    markersByCell.forEach((cellMarkers) => {
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

    // Cache the results
    this.cachedClusters = { clusters };
    this.lastZoomLevel = currentZoom;

    return { clusters };
  }

  // Reset cache when markers change
  public clearCache() {
    this.lastZoomLevel = null;
    this.cachedClusters = null;
  }

  private determineGridCellSize(zoomLevel: number): number {
    const baseCellSize = 100; // Starting size in pixels

    let cellSize;
    if (zoomLevel >= 12) {
      console.log("zoom level if", zoomLevel);
      cellSize = baseCellSize / Math.pow(3, Math.max(0, zoomLevel - 1.2));
    } else {
      console.log("zoom level else", zoomLevel);
      cellSize = baseCellSize / Math.pow(1.2, Math.max(0, zoomLevel - 8));
    }
    // Smaller minimum cell size to allow more individual markers
    const minimumCellSize = 20; // Reduced from 40
    return Math.max(cellSize, minimumCellSize);
  }

  // private determineGridCellSize(zoomLevel: number): number {
  //   const baseCellSize = 100; // Adjust this value as needed
  //   const cellSize = baseCellSize / Math.pow(2, zoomLevel / 2);
  //   const minimumCellSize = 20; // Minimum size in pixels
  //   return Math.max(cellSize, minimumCellSize);
  // }

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
}
