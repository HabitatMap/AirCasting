enum DateFormat {
  default = "YYYY-MM-DD",
  default_with_time = "YYYY-MM-DD HH:mm",
  us = "MM/DD/YYYY",
  us_with_time = "MM/DD/YYYY HH:mm",
  us_with_time_seconds = "MM/DD/YYYY HH:mm:ss",
  us_without_year = "MM/DD",
  time_with_seconds = "HH:mm:ss",
  time = "HH:mm A",
  us_timestamp = "YYYYMMDDHH:mm:ssZ",
  us_with_time_seconds_utc = "YYYY-MM-DD HH:mm:ss UTC",
}

export { DateFormat };
