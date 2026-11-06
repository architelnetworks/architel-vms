/** Shareable live group selection and browser history regressions. */
import { test, expect } from "../fixtures/frigate-test";

test.beforeEach(async ({ frigateApp }) => {
  await frigateApp.installDefaults({
    config: {
      camera_groups: {
        Side_Entry: { cameras: ["front_door"], icon: "LuDoorOpen", order: 1 },
        Car_Park: { cameras: ["garage"], icon: "LuCar", order: 2 },
      },
    },
  });
});

test("group links survive reload and browser history @high @mobile", async ({
  frigateApp,
}) => {
  await frigateApp.goto("/?group=Side_Entry");
  await expect(frigateApp.page).toHaveTitle(/Side Entry/);
  await frigateApp.page.reload();
  await expect(frigateApp.page).toHaveURL(/group=Side_Entry/);
  await expect(frigateApp.page).toHaveTitle(/Side Entry/);
  await frigateApp.goto("/?group=Car_Park");
  await expect(frigateApp.page).toHaveTitle(/Car Park/);
  await frigateApp.page.goBack();
  await expect(frigateApp.page).toHaveTitle(/Side Entry/);
  await expect(frigateApp.page).toHaveURL(/group=Side_Entry/);
  await frigateApp.page.goForward();
  await expect(frigateApp.page).toHaveTitle(/Car Park/);
});

test("sidebar selection updates group links and retains history @high", async ({
  frigateApp,
}) => {
  test.skip(frigateApp.isMobile, "Desktop sidebar labels");
  await frigateApp.goto("/");
  await frigateApp.page
    .getByRole("button", { name: "Side Entry", exact: true })
    .click();
  await expect(frigateApp.page).toHaveURL(/group=Side_Entry/);
  await frigateApp.page
    .getByRole("button", { name: "Car Park", exact: true })
    .click();
  await expect(frigateApp.page).toHaveURL(/group=Car_Park/);
  await frigateApp.page.goBack();
  await expect(frigateApp.page).toHaveURL(/group=Side_Entry/);
  await expect(frigateApp.page).toHaveTitle(/Side Entry/);
  await frigateApp.page.goForward();
  await expect(frigateApp.page).toHaveTitle(/Car Park/);
  await frigateApp.page
    .getByRole("button", { name: "All Cameras", exact: true })
    .click();
  await expect(frigateApp.page).toHaveURL(/group=default/);
  await frigateApp.page.goBack();
  await expect(frigateApp.page).toHaveURL(/group=Car_Park/);
});

test("opening a camera keeps the group in its link @high", async ({
  frigateApp,
}) => {
  await frigateApp.goto("/?group=Side_Entry");
  await frigateApp.page.locator("[data-camera='front_door']").first().click();
  await expect(frigateApp.page).toHaveURL(/\?group=Side_Entry#front_door$/);
  await frigateApp.page.goBack();
  await expect(frigateApp.page).toHaveURL(/\?group=Side_Entry$/);
  await expect(frigateApp.page).toHaveTitle(/Side Entry/);
});

test("unknown groups fall back to all cameras @high", async ({
  frigateApp,
}) => {
  await frigateApp.goto("/?group=deleted_group");
  await expect(frigateApp.page).toHaveURL(/group=default/);
  await expect(
    frigateApp.page.locator("[data-camera='front_door']"),
  ).toBeVisible();
});
