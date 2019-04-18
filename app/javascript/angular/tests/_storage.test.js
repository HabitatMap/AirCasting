import test from "blue-tape";
import { mock } from "./helpers";
import { storage } from "../code/services/_storage";
import sinon from "sinon";

const _storage = ({ params }) => {
  const $rootScope = { $new: () => ({ $watch: () => {} }) };
  const utils = {
    merge: (obj1, obj2) => ({ ...obj1, ...obj2 })
  };
  return storage(params, $rootScope, utils);
};
