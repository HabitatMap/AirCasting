import test from 'blue-tape';
import sinon from 'sinon';
import { findLocation, clearLocation, toggleIndoor } from '../code/filtersUtils';

test("findLocation asks google maps to pan to the given location", t => {
  const goToAddress = sinon.spy();
  const map = { goToAddress };
  const params = { update: () => {}};
  const location = "krakow";

  findLocation(location, params, map);

  sinon.assert.calledWith(goToAddress, location);

  t.end();
});

test("findLocation adds the new location to the params", t => {
  const update = sinon.spy();
  const map = { goToAddress: () => {}};
  const params = { update };

  findLocation("krakow", params, map);

  sinon.assert.calledWith(update, { data: { location: "krakow" }});

  t.end();
});


test("clearLocation informs elm that location field should be cleared", t => {
  const send = sinon.spy();
  const params = { update: () => {}};
  const elmApp = { send };

  clearLocation(elmApp, params);

  sinon.assert.called(send);

  t.end();
});

test("clearLocation changes location in the params to empty string", t => {
  const update = sinon.spy();
  const params = { update };
  const elmAction = { send: () => {}};

  clearLocation(elmAction, params);

  sinon.assert.calledWith(update, { data: { location: "" }});

  t.end();
});

test("toggleIndoor sets the indoor parameter to the passed boolean value", t => {
  const update = sinon.spy();
  const params = { update };

  toggleIndoor(true, params);

  sinon.assert.calledWith(update, { data: { indoor: true }});

  t.end();
});
