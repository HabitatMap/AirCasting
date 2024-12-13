import { MarkerClusterer } from "@googlemaps/markerclusterer";

export class CustomMarkerClusterer extends MarkerClusterer {
  public getClusters() {
    return this.clusters;
  }
}
