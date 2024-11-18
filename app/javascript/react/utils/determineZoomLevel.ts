interface ZoomAndBounds {
  zoom: number;
  bounds?: google.maps.LatLngBounds;
}

const determineZoomLevel = (
  results: google.maps.GeocoderResult[]
): ZoomAndBounds => {
  const locationTypes = results[0].types;
  const primaryType = locationTypes[0];
  const viewport = results[0].geometry.viewport;

  // Helper function to get bounds for specific countries
  const getCountryBounds = (
    countryCode: string
  ): google.maps.LatLngBounds | undefined => {
    switch (countryCode) {
      case "US":
        return new google.maps.LatLngBounds(
          { lat: 25.82, lng: -124.39 }, // SW corner
          { lat: 49.38, lng: -66.94 } // NE corner
        );
      case "RU":
        return new google.maps.LatLngBounds(
          { lat: 41.18, lng: 19.64 },
          { lat: 81.85, lng: 180.0 }
        );
      case "CA":
        return new google.maps.LatLngBounds(
          { lat: 45.0, lng: -125.0 }, // Adjusted SW corner
          { lat: 70.0, lng: -60.0 }
        );
      // Add more countries as needed
      default:
        return viewport;
    }
  };

  // Helper function to get bounds for large US states
  const getStateBounds = (
    state: string
  ): google.maps.LatLngBounds | undefined => {
    switch (state) {
      case "AK":
        return new google.maps.LatLngBounds(
          { lat: 51.17, lng: -179.15 },
          { lat: 71.44, lng: -129.99 }
        );
      case "TX":
        return new google.maps.LatLngBounds(
          { lat: 25.84, lng: -106.65 },
          { lat: 36.5, lng: -93.51 }
        );
      case "CA":
        return new google.maps.LatLngBounds(
          { lat: 32.53, lng: -124.48 },
          { lat: 42.01, lng: -114.13 }
        );
      default:
        return viewport;
    }
  };

  switch (primaryType) {
    // Very detailed zoom for specific addresses and rooms
    case "street_address":
    case "premise":
    case "subpremise":
    case "street_number":
    case "room":
      return {
        zoom: 18,
        bounds: viewport,
      };

    // Detailed zoom for routes and intersections
    case "route":
    case "intersection":
      return {
        zoom: 17,
        bounds: viewport,
      };

    // Detailed zoom for various businesses and points of interest
    case "accounting":
    case "atm":
    case "bakery":
    case "bank":
    case "bar":
    case "beauty_salon":
    case "bicycle_store":
    case "book_store":
    case "bowling_alley":
    case "bus_station":
    case "cafe":
    case "campground":
    case "car_dealer":
    case "car_rental":
    case "car_repair":
    case "car_wash":
    case "casino":
    case "cemetery":
    case "church":
    case "city_hall":
    case "clothing_store":
    case "convenience_store":
    case "courthouse":
    case "dentist":
    case "department_store":
    case "doctor":
    case "drugstore":
    case "electrician":
    case "electronics_store":
    case "embassy":
    case "fire_station":
    case "florist":
    case "funeral_home":
    case "furniture_store":
    case "gas_station":
    case "gym":
    case "hair_care":
    case "hardware_store":
    case "hindu_temple":
    case "home_goods_store":
    case "hospital":
    case "insurance_agency":
    case "jewelry_store":
    case "laundry":
    case "lawyer":
    case "library":
    case "light_rail_station":
    case "liquor_store":
    case "local_government_office":
    case "locksmith":
    case "lodging":
    case "meal_delivery":
    case "meal_takeaway":
    case "mosque":
    case "movie_rental":
    case "movie_theater":
    case "moving_company":
    case "museum":
    case "neighborhood":
    case "night_club":
    case "painter":
    case "parking":
    case "pet_store":
    case "pharmacy":
    case "physiotherapist":
    case "plumber":
    case "police":
    case "political":
    case "post_office":
    case "primary_school":
    case "real_estate_agency":
    case "restaurant":
    case "roofing_contractor":
    case "rv_park":
    case "school":
    case "secondary_school":
    case "shoe_store":
    case "shopping_mall":
    case "spa":
    case "storage":
    case "store":
    case "sublocality":
    case "sublocality_level_1":
    case "sublocality_level_2":
    case "sublocality_level_3":
    case "sublocality_level_4":
    case "sublocality_level_5":
    case "subway_station":
    case "supermarket":
    case "synagogue":
    case "taxi_stand":
    case "train_station":
    case "transit_station":
    case "travel_agency":
    case "university":
    case "veterinary_care":
    case "zoo":
    case "town_square":
      return {
        zoom: 15,
        bounds: viewport,
      };

    // Less detailed zoom for larger areas and general places
    case "airport":
    case "amusement_park":
    case "aquarium":
    case "art_gallery":
    case "establishment":
    case "finance":
    case "floor":
    case "food":
    case "general_contractor":
    case "geocode":
    case "health":
    case "landmark":
    case "natural_feature":
    case "place_of_worship":
    case "stadium":
    case "tourist_attraction":
    case "park":
    case "point_of_interest":
    case "post_box":
    case "postal_town":
      return {
        zoom: 14,
        bounds: viewport,
      };

    // City level zoom
    case "locality":
    case "postal_code":
    case "postal_code_prefix":
    case "postal_code_suffix":
      return {
        zoom: 11,
        bounds: viewport,
      };

    // Regional level zoom
    case "administrative_area_level_3":
    case "administrative_area_level_4":
    case "administrative_area_level_5":
    case "administrative_area_level_6":
    case "administrative_area_level_7":
      return {
        zoom: 12,
        bounds: viewport,
      };

    // County level zoom
    case "administrative_area_level_2":
      return {
        zoom: 11,
        bounds: viewport,
      };

    // State level zoom
    case "administrative_area_level_1":
      const country = results[0].address_components.find((component) =>
        component.types.includes("country")
      )?.short_name;

      if (country === "US") {
        const state = results[0].address_components.find((component) =>
          component.types.includes("administrative_area_level_1")
        )?.short_name;

        switch (state) {
          case "AK":
          case "TX":
          case "CA":
            return {
              zoom: 6,
              bounds: getStateBounds(state),
            };
          case "MT":
          case "NM":
          case "AZ":
          case "NV":
            return {
              zoom: 7,
              bounds: viewport,
            };
          default:
            return {
              zoom: 7,
              bounds: viewport,
            };
        }
      }
      return {
        zoom: 7,
        bounds: viewport,
      };

    // Country level zoom - adjusted based on country size
    case "country":
      const countryCode = results[0].address_components.find((component) =>
        component.types.includes("country")
      )?.short_name;

      switch (countryCode) {
        case "RU":
        case "CA":
          return {
            zoom: 4,
            bounds: getCountryBounds(countryCode),
          };
        case "US":
        case "CN":
        case "BR":
        case "AU":
          return {
            zoom: 5,
            bounds: getCountryBounds(countryCode),
          };
        case "IN":
        case "AR":
          return {
            zoom: 6,
            bounds: getCountryBounds(countryCode),
          };
        default:
          return {
            zoom: 6,
            bounds: viewport,
          };
      }

    // Very broad level zoom - adjusted
    case "archipelago":
    case "colloquial_area":
    case "continent":
      return {
        zoom: 3,
        bounds: viewport,
      };

    // Place code level zoom
    case "place_code":
      return {
        zoom: 8,
        bounds: viewport,
      };

    // Default zoom level if type is unknown
    default:
      return {
        zoom: 10,
        bounds: viewport,
      };
  }
};

export { determineZoomLevel };
