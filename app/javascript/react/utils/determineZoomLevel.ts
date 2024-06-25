const determineZoomLevel = (results: google.maps.GeocoderResult[]) => {
  const locationTypes = results[0].types;
  const primaryType = locationTypes[0];

  // Based on: https://developers.google.com/maps/documentation/places/web-service/supported_types
  switch (primaryType) {
    // Very detailed zoom for specific addresses and rooms
    case "street_address":
    case "premise":
    case "subpremise":
    case "street_number":
    case "room":
      return 18;

    // Detailed zoom for routes and intersections
    case "route":
    case "intersection":
      return 17;

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
      return 15;

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
      return 14;

    // City level zoom
    case "locality":
    case "postal_code":
    case "postal_code_prefix":
    case "postal_code_suffix":
      return 11;

    // Regional level zoom
    case "administrative_area_level_3":
    case "administrative_area_level_4":
    case "administrative_area_level_5":
    case "administrative_area_level_6":
    case "administrative_area_level_7":
      return 12;

    // County level zoom
    case "administrative_area_level_2":
      return 11;

    // State level zoom
    case "administrative_area_level_1":
      return 10;

    // Place code level zoom
    case "place_code":
      return 8;

    // Country level zoom
    case "country":
      return 6;

    // Very broad level zoom
    case "archipelago":
    case "colloquial_area":
    case "continent":
      return 5;

    // Default zoom level if type is unknown
    default:
      return 10;
  }
};

export { determineZoomLevel };
