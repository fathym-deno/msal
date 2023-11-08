import { assertEquals, describe } from "./test.deps.ts";
import { add } from "../src/utils.ts";

describe("Utils Tests", () => {
  describe("Add Test", () => {
    const added = add(1, 1);

    assertEquals(added, 2);
  });
});
