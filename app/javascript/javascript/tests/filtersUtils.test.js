import test from "blue-tape";
import sinon from "sinon";
import { clearLocation } from "../filtersUtils";

test("clearLocation informs elm that location field should be cleared", (t) => {
  const params = { update: () => {} };
  const callback = sinon.spy();

  clearLocation(callback, params);

  sinon.assert.called(callback);

  t.end();
});

test("clearLocation changes location in the params to empty string", (t) => {
  const update = sinon.spy();
  const params = { update };
  const callback = () => {};

  clearLocation(callback, params);

  sinon.assert.calledWith(update, { data: { location: "" } });

  t.end();
});
