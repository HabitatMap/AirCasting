describe('sensors', function() {
  var sensors,params, $httpBackend;

  beforeEach(module('aircasting'));
  beforeEach(
    inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.when('GET', '/api/sensors').respond(MockData.sensors, {});
      params = $injector.get('params');
      sensors = $injector.get('sensors');
    })
  );

  describe('with grabbed sensors data', function() {
    beforeEach(function() {
      $httpBackend.flush();
    });
    it('should not be empty', function() {
      expect(sensors.isEmpty()).toBeFalsy();
    });
    it('should get sensors array', function() {
      expect(sensors.get()).toEqual(sensors.sensors);
    });
    it('should not be empty', function() {
      expect(_(sensors.get()).size()).toEqual(6);
    });

    describe('and required sensor choosing', function() {
      beforeEach(function() {
        sensors.defaultSensor = null;
        sensors.shouldInitSelected = true;
        sensors.initSelected();
      });
      it('should have sensor with highest session_coount selected in params', function() {
        expect(params.get("data").sensorId).toEqual("Sound Level-Phone Microphone (dB)");
      });
      it('should have selected sensor', function() {
        expect(sensors.selected().id).toEqual(params.get("data").sensorId);
      });
      it('should have selected sensor Id', function() {
        expect(sensors.selectedId()).toEqual(params.get("data").sensorId);
      });
    });
  });


});


