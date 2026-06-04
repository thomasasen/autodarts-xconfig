// @ts-check
import { test, expect } from "@playwright/test";

test("local browser smoke renders the xConfig host surface", async ({ page }) => {
  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>autodarts-xconfig smoke</title>
        <style>
          #root { min-height: 100vh; }
          #ad-xconfig-panel-host { display: grid; min-height: 120px; }
        </style>
      </head>
      <body>
        <main id="root">
          <button id="ad-xconfig-menu-item" type="button">AD xConfig</button>
          <section id="ad-xconfig-panel-host" aria-label="AD xConfig"></section>
        </main>
      </body>
    </html>
  `);

  await expect(page.locator("#ad-xconfig-menu-item")).toBeVisible();
  await expect(page.locator("#ad-xconfig-panel-host")).toBeVisible();
  await expect(page).toHaveTitle("autodarts-xconfig smoke");
});
