// CustomOverlay.tsx
import { useEffect, useRef } from "react";

interface ClusterOverlayProps {
  position: google.maps.LatLng;
  map: google.maps.Map;
  onPositionChange: (position: { top: number; left: number }) => void;
}

const ClusterOverlay: React.FC<ClusterOverlayProps> = ({
  position,
  map,
  onPositionChange,
}) => {
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  useEffect(() => {
    const overlay = new google.maps.OverlayView();
    overlay.onAdd = () => {};
    overlay.draw = () => {
      const projection = overlay.getProjection();
      if (projection) {
        const posPixel = projection.fromLatLngToDivPixel(position);
        if (posPixel) {
          onPositionChange({ top: posPixel.y, left: posPixel.x });
        }
      }
    };
    overlay.onRemove = () => {};
    overlay.setMap(map);

    overlayRef.current = overlay;

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
    };
  }, [position, map, onPositionChange]);

  return null;
};

export default ClusterOverlay;
