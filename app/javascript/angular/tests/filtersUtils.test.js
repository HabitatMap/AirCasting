import test from "blue-tape";
import sinon from "sinon";
import { goToLocation, clearLocation } from "../../javascript/filtersUtils";

test("goToLocation asks google maps to pan to the given location", t => {
  const goToAddress = sinon.spy();
  const map = { goToAddress };
  const params = { update: () => {} };
  const location = "krakow";

  goToLocation({ location, params, map });

  sinon.assert.calledWith(goToAddress, location);

  t.end();
});

test("goToLocation adds the new location to the params", t => {
  const update = sinon.spy();
  const map = { goToAddress: () => {} };
  const params = { update };

  goToLocation({ location: "krakow", params, map });

  sinon.assert.calledWith(update, { data: { location: "krakow" } });

  t.end();
});

test("clearLocation informs elm that location field should be cleared", t => {
  const params = { update: () => {} };
  const callback = sinon.spy();

  clearLocation(callback, params);

  sinon.assert.called(callback);

  t.end();
});

test("clearLocation changes location in the params to empty string", t => {
  const update = sinon.spy();
  const params = { update };
  const callback = () => {};

  clearLocation(callback, params);

  sinon.assert.calledWith(update, { data: { location: "" } });

  t.end();
});
