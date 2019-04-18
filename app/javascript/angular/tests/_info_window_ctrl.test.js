import test from "blue-tape";
import { InfoWindowCtrl } from "../code/controllers/_info_window_ctrl";
import sinon from "sinon";

test("zoomIn calls map.zoomToSelectedCluster", t => {
  const zoomToSelectedCluster = sinon.spy();
  const map = { zoomToSelectedCluster };
  const scope = {};
  const service = InfoWindowCtrl(scope, null, null, map);

  scope.zoomIn();

  sinon.assert.called(zoomToSelectedCluster);

  t.end();
});
