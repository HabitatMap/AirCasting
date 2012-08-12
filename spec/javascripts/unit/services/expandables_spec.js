describe('expandables', function() {
  var expandables;

  beforeEach(module('aircasting'));
  beforeEach(
    inject(function($injector) {
      expandables = $injector.get('expandables');
      expandables.sections = {location: "expanded"};
    })
  );

  it('should show section', function() {
    expandables.show("time");
    expect(expandables.visible("time")).toBeTruthy();
  });

  it('should toggle section', function() {
    expect(expandables.visible("location")).toBeTruthy();
    expandables.toggle("location");
    expect(expandables.visible("location")).toBeFalsy();
  });

  it('should get expanded class for visible', function() {
    expandables.show("time");
    expect(expandables.css("time")).toEqual("expanded");
  });
});


