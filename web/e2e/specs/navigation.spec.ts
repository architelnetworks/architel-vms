/**
 * Navigation tests -- CRITICAL tier.
 *
 * Covers sidebar (desktop) / bottombar (mobile) link set, conditional
 * nav items (faces, chat, classification), settings menu navigation,
 * unknown-route redirect to /, and mobile-specific nav behaviors.
 */

import { test, expect } from "../fixtures/frigate-test";
import { BasePage } from "../pages/base.page";

const PRIMARY_ROUTES = ["/review", "/explore", "/export"] as const;

test.describe("Architel sidebar", () => {
  test("group and footer labels align with navigation and collapse", async ({
    frigateApp,
  }) => {
    test.skip(frigateApp.isMobile, "Desktop sidebar");
    await frigateApp.goto("/");
    const sidebar = frigateApp.page.getByRole("complementary", {
      name: "Main navigation",
    });
    const liveLabel = sidebar
      .getByRole("link", { name: "Live", exact: true })
      .getByText("Live", { exact: true });
    const liveBounds = await liveLabel.boundingBox();
    for (const name of [
      "All Cameras",
      "Edit Camera Groups",
      "Settings",
      "Account",
    ]) {
      const button = sidebar.getByRole("button", { name, exact: true });
      const label = button.getByText(name, { exact: true });
      await expect(label).toBeVisible();
      const bounds = await label.boundingBox();
      expect(Math.abs(bounds!.x - liveBounds!.x)).toBeLessThan(2);
    }
    await sidebar
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await expect(
      frigateApp.page.getByLabel("Health and Metrics", { exact: true }),
    ).toBeVisible();
    await frigateApp.page.keyboard.press("Escape");
    await sidebar.getByRole("button", { name: "Account", exact: true }).click();
    await expect(
      frigateApp.page.getByText(/Current User: admin/),
    ).toBeVisible();
    await frigateApp.page.keyboard.press("Escape");
    await sidebar.getByRole("button", { name: "Collapse sidebar" }).click();
    for (const name of [
      "All Cameras",
      "Edit Camera Groups",
      "Settings",
      "Account",
    ]) {
      await expect(
        sidebar
          .getByRole("button", { name, exact: true })
          .getByText(name, { exact: true }),
      ).toHaveCount(0);
    }
  });

  test("labels preserve icon buttons and collapse persists", async ({
    frigateApp,
  }) => {
    test.skip(frigateApp.isMobile, "Desktop sidebar");
    await frigateApp.goto("/review");
    const sidebar = frigateApp.page.getByRole("complementary", {
      name: "Main navigation",
    });
    const review = sidebar.getByRole("link", { name: "Review", exact: true });
    await expect(review.getByText("Review", { exact: true })).toBeVisible();
    await expect(review).toHaveAttribute("aria-current", "page");
    const icon = review.locator("span").first();
    await expect(icon).toHaveCSS("width", "32px");
    await expect(icon).toHaveCSS("height", "32px");
    const iconBounds = await icon.boundingBox();
    const labelBounds = await review
      .getByText("Review", { exact: true })
      .boundingBox();
    expect(labelBounds!.x).toBeGreaterThan(iconBounds!.x + iconBounds!.width);
    expect(
      Math.abs(
        labelBounds!.y +
          labelBounds!.height / 2 -
          iconBounds!.y -
          iconBounds!.height / 2,
      ),
    ).toBeLessThan(2);
    await expect(sidebar).toHaveCSS("width", "192px");
    await expect(frigateApp.page.locator("#pageRoot")).toHaveCSS(
      "left",
      "192px",
    );
    await sidebar.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(sidebar).toHaveCSS("width", "52px");
    await expect(review.getByText("Review", { exact: true })).toHaveCount(0);
    await expect(icon).toHaveCSS("width", "32px");
    await review.hover();
    await expect(frigateApp.page.getByRole("tooltip")).toContainText("Review");
    // Wait for IndexedDB persistence, then verify a new page load restores it.
    await expect
      .poll(() =>
        frigateApp.page.evaluate(async () => {
          const request = indexedDB.open("keyval-store");
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          const transaction = db.transaction("keyval", "readonly");
          const values = transaction
            .objectStore("keyval")
            .get("architel-sidebar-collapsed:admin");
          return new Promise<boolean>((resolve, reject) => {
            values.onsuccess = () => {
              db.close();
              resolve(values.result === true);
            };
            values.onerror = () => {
              db.close();
              reject(values.error);
            };
          });
        }),
      )
      .toBe(true);
    await frigateApp.page.reload();
    await expect(
      sidebar.getByRole("button", { name: "Expand sidebar" }),
    ).toBeEnabled();
    await expect(sidebar).toHaveCSS("width", "52px");
    await expect(frigateApp.page.locator("#pageRoot")).toHaveCSS(
      "left",
      "52px",
    );
    await sidebar.getByRole("button", { name: "Expand sidebar" }).click();
    await expect(sidebar).toHaveCSS("width", "192px");
    await expect(review.getByText("Review", { exact: true })).toBeVisible();
  });

  test("application metadata and assets are available @mobile", async ({
    frigateApp,
  }) => {
    await frigateApp.goto("/");
    await expect(frigateApp.page).toHaveTitle(/Architel VMS/);
    const manifest = await frigateApp.page.request.get("/site.webmanifest");
    expect(manifest.ok()).toBe(true);
    const metadata = await manifest.json();
    expect(metadata.name).toBe("Architel VMS");
    for (const icon of metadata.icons) {
      const response = await frigateApp.page.request.get(
        new URL(icon.src, manifest.url()).href,
      );
      expect(response.ok()).toBe(true);
    }
    const favicon = await frigateApp.page.request.get(
      "/images/branding/favicon.svg",
    );
    expect(favicon.ok()).toBe(true);
  });
});

test.describe("Navigation — primary links @critical", () => {
  test("every primary link is visible and navigates", async ({
    frigateApp,
  }) => {
    await frigateApp.goto("/");
    for (const route of PRIMARY_ROUTES) {
      await expect(
        frigateApp.page.locator(`a[href="${route}"]`).first(),
      ).toBeVisible();
    }
    const base = new BasePage(frigateApp.page, !frigateApp.isMobile);
    for (const route of PRIMARY_ROUTES) {
      await base.navigateTo(route);
      await expect(frigateApp.page).toHaveURL(new RegExp(route));
      await expect(frigateApp.page.locator("#pageRoot")).toBeVisible();
    }
  });

  test("logo links home on desktop", async ({ frigateApp }) => {
    test.skip(frigateApp.isMobile, "Sidebar logo is desktop-only");
    await frigateApp.goto("/review");
    await frigateApp.page.locator("aside a[href='/']").first().click();
    await expect(frigateApp.page).toHaveURL(/\/$/);
  });

  test("unknown route redirects to /", async ({ frigateApp }) => {
    await frigateApp.page.goto("/nonexistent-route");
    await frigateApp.page.waitForSelector("#pageRoot", { timeout: 10_000 });
    await expect(frigateApp.page).toHaveURL(/\/$/);
    await expect(
      frigateApp.page.locator("[data-camera='front_door']"),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Navigation — conditional items @critical", () => {
  test("/faces is hidden when face_recognition.enabled is false", async ({
    frigateApp,
  }) => {
    await frigateApp.goto("/");
    await expect(
      frigateApp.page.locator('a[href="/faces"]').first(),
    ).toHaveCount(0);
  });

  test("/faces is visible when face_recognition.enabled is true (desktop)", async ({
    frigateApp,
  }) => {
    test.skip(frigateApp.isMobile, "Desktop sidebar");
    await frigateApp.installDefaults({
      config: { face_recognition: { enabled: true } },
    });
    await frigateApp.goto("/");
    await expect(
      frigateApp.page.locator('a[href="/faces"]').first(),
    ).toBeVisible();
  });

  test("/chat is hidden when no agent has the chat role (desktop)", async ({
    frigateApp,
  }) => {
    test.skip(frigateApp.isMobile, "Desktop sidebar");
    await frigateApp.installDefaults({
      config: {
        genai: {
          descriptions_only: {
            provider: "ollama",
            model: "llava",
            roles: ["descriptions"],
          },
        },
      },
    });
    await frigateApp.goto("/");
    await expect(
      frigateApp.page.locator('a[href="/chat"]').first(),
    ).toHaveCount(0);
  });

  test("/chat is visible when an agent has the chat role (desktop)", async ({
    frigateApp,
  }) => {
    test.skip(frigateApp.isMobile, "Desktop sidebar");
    await frigateApp.installDefaults({
      config: {
        genai: {
          chat_agent: {
            provider: "ollama",
            model: "llava",
            roles: ["chat"],
          },
        },
      },
    });
    await frigateApp.goto("/");
    await expect(
      frigateApp.page.locator('a[href="/chat"]').first(),
    ).toBeVisible();
  });

  test("/classification is visible for admin on desktop", async ({
    frigateApp,
  }) => {
    test.skip(frigateApp.isMobile, "Desktop sidebar");
    await frigateApp.goto("/");
    await expect(
      frigateApp.page.locator('a[href="/classification"]').first(),
    ).toBeVisible();
  });
});

test.describe("Navigation — settings menu (desktop) @critical", () => {
  test.skip(
    ({ frigateApp }) => frigateApp.isMobile,
    "Sidebar settings menu is desktop-only",
  );

  const TARGETS = [
    { label: "Settings", url: /\/settings/ },
    { label: "Health and Metrics", url: /\/system/ },
    { label: "Logs", url: /\/logs/ },
    { label: "Configuration Editor", url: /\/config/ },
  ];

  for (const target of TARGETS) {
    test(`menu → ${target.label} navigates`, async ({ frigateApp }) => {
      await frigateApp.goto("/");
      const gear = frigateApp.page
        .locator("aside .mb-8 div[class*='cursor-pointer']")
        .first();
      await gear.click();
      await frigateApp.page
        .getByRole("menuitem", { name: target.label, exact: true })
        .click();
      await expect(frigateApp.page).toHaveURL(target.url);
    });
  }
});

test.describe("Navigation — mobile @critical @mobile", () => {
  test("mobile bottombar visible, sidebar not rendered", async ({
    frigateApp,
  }) => {
    test.skip(!frigateApp.isMobile, "Mobile-only");
    await frigateApp.goto("/");
    await expect(frigateApp.page.locator("aside")).toHaveCount(0);
    for (const route of PRIMARY_ROUTES) {
      await expect(
        frigateApp.page.locator(`a[href="${route}"]`).first(),
      ).toBeVisible();
    }
  });

  test("mobile nav survives route change", async ({ frigateApp }) => {
    test.skip(!frigateApp.isMobile, "Mobile-only");
    await frigateApp.goto("/");
    const reviewLink = frigateApp.page.locator('a[href="/review"]').first();
    await reviewLink.click();
    await expect(frigateApp.page).toHaveURL(/\/review/);
    await expect(
      frigateApp.page.locator('a[href="/review"]').first(),
    ).toBeVisible();
  });
});
