MockData = {};
MockData.sensors = [{"sensor_name":"HIH4030","measurement_type":"Humidity","threshold_very_low":0,"threshold_low":25,"unit_symbol":"%","threshold_medium":50,"threshold_high":75,"threshold_very_high":100,"session_count":2},{"sensor_name":"LM335A-C","measurement_type":"Temperature","threshold_very_low":0,"threshold_low":10,"unit_symbol":"C","threshold_medium":15,"threshold_high":20,"threshold_very_high":25,"session_count":2},{"sensor_name":"LM335A-F","measurement_type":"Temperature","threshold_very_low":100,"threshold_low":200,"unit_symbol":"F","threshold_medium":300,"threshold_high":400,"threshold_very_high":500,"session_count":2},{"sensor_name":"LM335A-K","measurement_type":"Temperature","threshold_very_low":277,"threshold_low":300,"unit_symbol":"K","threshold_medium":400,"threshold_high":500,"threshold_very_high":600,"session_count":2},{"sensor_name":"Phone Microphone","measurement_type":"Sound Level","threshold_very_low":20,"threshold_low":60,"unit_symbol":"dB","threshold_medium":70,"threshold_high":80,"threshold_very_high":100,"session_count":196},{"sensor_name":"TGS2442","measurement_type":"CO Gas","threshold_very_low":0,"threshold_low":10,"unit_symbol":"ppm","threshold_medium":20,"threshold_high":30,"threshold_very_high":40,"session_count":2}];

MockData.googleCore = function() {
  return {
    geocoder: function() {
      return {};
    }
  };
}


