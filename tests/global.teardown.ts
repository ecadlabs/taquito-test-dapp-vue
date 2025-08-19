import { test as teardown } from "@playwright/test";
import { cleanupSharedContext } from "./shared-context";

teardown("cleanup shared context", async () => {
  await cleanupSharedContext();
});
