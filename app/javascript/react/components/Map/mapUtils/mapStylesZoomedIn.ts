import {
  administrativeRegionTextColor,
  buildingStrokeColor,
  internationalBorderFillColor,
  landscapeColor,
  provinceStrokeColor,
  reservationFillColor,
  roadColor,
  strokeColor,
  textColor,
  waterColor,
} from "../../../assets/styles/colors";

export default [
  {
    featureType: "administrative",
    elementType: "geometry.fill",
    stylers: [
      {
        color: reservationFillColor,
      },
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: administrativeRegionTextColor,
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: textColor,
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: strokeColor,
      },
    ],
  },
  {
    featureType: "administrative.country",
    elementType: "labels",
    stylers: [
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: administrativeRegionTextColor,
      },
    ],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: internationalBorderFillColor,
      },
    ],
  },
  {
    featureType: "administrative.locality",
    stylers: [
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: textColor,
      },
    ],
  },

  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: provinceStrokeColor }],
  },
  {
    featureType: "landscape",
    stylers: [
      {
        color: landscapeColor,
      },
    ],
  },
  {
    featureType: "landscape.man_made",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: buildingStrokeColor,
      },
      {
        lightness: -20,
      },
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "landscape.man_made",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: textColor,
      },
      {
        visibility: "on",
      },
    ],
  },

  {
    featureType: "landscape.natural",
    stylers: [
      {
        visibility: "simplified",
      },
    ],
  },
  {
    featureType: "landscape.natural.landcover",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "landscape.natural.terrain",
    stylers: [
      {
        visibility: "simplified",
      },
    ],
  },
  {
    featureType: "poi",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },

  {
    featureType: "poi.attraction",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.business",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.park",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "road",
    stylers: [
      {
        color: roadColor,
      },
      {
        saturation: -100,
      },
      {
        lightness: 45,
      },
      {
        visibility: "simplified",
      },
    ],
  },
  {
    featureType: "road.arterial",
    stylers: [
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: textColor,
      },
    ],
  },

  {
    featureType: "road.highway",
    stylers: [
      {
        visibility: "simplified",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [
      {
        color: roadColor,
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels",
    stylers: [
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: textColor,
      },
    ],
  },
  {
    featureType: "transit",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "water",
    stylers: [
      {
        color: waterColor,
      },
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
];
