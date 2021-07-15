import test from "blue-tape";
import { keysToLowerCase } from "../utils";

test("keysToLowerCase changes object keys to lower case", (t) => {
  const value = 1;
  const object = { Aa: value };

  const actual = keysToLowerCase(object);

  const expected = { aa: value };
  t.deepEqual(actual, expected);

  t.end();
});
