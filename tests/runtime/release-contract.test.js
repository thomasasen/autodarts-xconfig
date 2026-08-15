import test from "node:test";
import assert from "node:assert/strict";
import {
  RAW_META_URL,
  RAW_USER_URL,
  RELEASE_ASSET_NAMES,
  RELEASE_META_URL,
  RELEASE_USER_URL,
  resolveExpectedDownloadUrl,
  validateReleaseContract,
} from "../../scripts/check-release-contract.mjs";

test("release contract validates the checked-in stable build and workflow", () => {
  const result = validateReleaseContract();

  assert.deepEqual(result.errors, []);
  assert.deepEqual(RELEASE_ASSET_NAMES, [
    "autodarts-xconfig.user.js",
    "autodarts-xconfig.meta.js",
  ]);
});

test("release contract rejects tag and package version drift", () => {
  const result = validateReleaseContract({ tag: "v99.0.0" });

  assert.ok(result.errors.some((error) => /does not match package version/.test(error)));
});

test("release channel endpoints remain explicit and non-overlapping", () => {
  assert.equal(
    RAW_META_URL,
    "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js"
  );
  assert.equal(
    RAW_USER_URL,
    "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js"
  );
  assert.equal(
    RELEASE_META_URL,
    "https://github.com/thomasasen/autodarts-xconfig/releases/latest/download/autodarts-xconfig.meta.js"
  );
  assert.equal(
    RELEASE_USER_URL,
    "https://github.com/thomasasen/autodarts-xconfig/releases/latest/download/autodarts-xconfig.user.js"
  );
  assert.notEqual(RELEASE_USER_URL, RELEASE_META_URL);
  assert.equal(resolveExpectedDownloadUrl("2.9.1"), RAW_USER_URL);
  assert.equal(resolveExpectedDownloadUrl("2.9.2"), RELEASE_USER_URL);
  assert.equal(resolveExpectedDownloadUrl("3.4.2"), RELEASE_USER_URL);
});
