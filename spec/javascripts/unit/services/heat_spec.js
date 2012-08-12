describe('heat', function() {
  var heat;

  beforeEach(module('aircasting'));
  beforeEach(
    inject(function($injector) {
      heat = $injector.get('heat');
    })
  );

  it('should parse heat array to object', function() {
    var data = [10, 20, 40, 60, "120"];
    expect(heat.parse(data)).toEqual({highest: 120, high: 60, mid: 40, low: 20, lowest: 10});
  });
});


