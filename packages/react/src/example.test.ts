import { expect, test } from "bun:test"
import { SDK_VERSION } from "@uranium/sdk"
import { REACT_SDK_VERSION } from "./index"

test("React SDK version is defined", () => {
  expect(REACT_SDK_VERSION).toBe("0.1.0")
})

test("Can import from workspace dependency", () => {
  // This tests that workspace:* dependencies work correctly
  expect(SDK_VERSION).toBe("0.1.0")
})
