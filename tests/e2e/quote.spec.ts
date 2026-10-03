import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import sharp from "sharp";

const dataDir = path.join(process.cwd(), ".data/e2e");

test.beforeAll(() => fs.rmSync(dataDir, { recursive: true, force: true }));

test("a mobile visitor submits a complete Marketplace pickup with stairs, a fragile item, an extra stop and a photo", async ({ page }, testInfo) => {
  const photo = testInfo.outputPath("sofa.jpg");
  await sharp({ create: { width: 640, height: 480, channels: 3, background: "#7a4b2a" } }).jpeg().toFile(photo);

  await page.goto("/services");
  await page.getByRole("link", { name: /request a quote for marketplace/i }).click();
  await expect(page.getByLabel("What do you need?")).toHaveValue("marketplace-pickup");

  // Step 1: try to continue empty to see inline errors
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/Please check the \d+ highlighted fields/)).toBeVisible();
  await expect(page.getByText("Enter the street address.").first()).toBeVisible();

  await page.getByLabel("Individual").check();
  const pickup = page.getByRole("group", { name: "Pickup address" });
  await pickup.getByLabel("Street address").fill("100 Main St");
  await pickup.getByLabel("City").fill("Denver");
  await pickup.getByLabel("State").selectOption("CO");
  await pickup.getByLabel("ZIP code").fill("80202");
  await page.getByRole("button", { name: "Add another stop" }).click();
  const stop = page.getByRole("group", { name: "Extra stop 1" });
  await stop.getByLabel("Drop-off").check();
  await stop.getByLabel("Street address").fill("5 Oak Ave");
  await stop.getByLabel("City").fill("Lakewood");
  await stop.getByLabel("State").selectOption("CO");
  await stop.getByLabel("ZIP code").fill("80226");
  const dropoff = page.getByRole("group", { name: "Drop-off address" });
  await dropoff.getByLabel("Street address").fill("200 Elm St");
  await dropoff.getByLabel("Apt / unit").fill("Apt 3B");
  await dropoff.getByLabel("City").fill("Aurora");
  await dropoff.getByLabel("State").selectOption("CO");
  await dropoff.getByLabel("ZIP code").fill("80010");
  await page.getByLabel("As soon as possible").check();
  await page.getByLabel("Flexible").check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2
  await expect(page.getByRole("heading", { name: /Items and access/ })).toBeVisible();
  await page.getByLabel("What is it?").fill("Glass display cabinet");
  await page.getByLabel("Fragile").check();
  await page.getByRole("button", { name: "Add another item" }).click();
  await page.getByRole("group", { name: "Item 2" }).getByLabel("What is it?").fill("Sofa");
  await page.getByRole("group", { name: "Vehicle preference" }).getByLabel("Not sure").check();
  await page.getByRole("group", { name: /help loading/ }).getByLabel("Not sure").check();
  const pa = page.getByRole("group", { name: "Access at pickup" });
  await pa.getByLabel("Yes, stairs").check();
  await pa.getByLabel("Floor number").fill("3");
  await pa.getByLabel("No elevator").check();
  const da = page.getByRole("group", { name: "Access at drop-off" });
  await da.getByLabel("Not sure").first().check();
  await da.getByRole("group", { name: "Elevator access" }).getByLabel("Not sure").check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: photo
  await expect(page.getByRole("heading", { name: /Photos/ })).toBeVisible();
  await page.locator("#f-photos").setInputFiles(photo);
  await expect(page.getByText("Added")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("step3-photos.png"), fullPage: true });
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4
  await page.getByLabel("Your name").fill("Test Customer");
  await page.getByRole("textbox", { name: "Phone" }).fill("720-555-0100");
  await page.getByRole("textbox", { name: "Email" }).fill("customer@example.com");
  await expect(page.getByText("Glass display cabinet, fragile")).toBeVisible();
  await page.getByRole("button", { name: "Send quote request" }).click();
  await expect(page.getByText("Please confirm you understand")).toBeVisible();
  await page.getByRole("checkbox", { name: /I understand this is a quote request/ }).check();
  await page.screenshot({ path: testInfo.outputPath("step4-review.png"), fullPage: true });

  // Double-click submit: must still produce exactly one request.
  await page.getByRole("button", { name: "Send quote request" }).dblclick();
  await expect(page).toHaveURL(/\/request-received\?ref=JMT-/);
  const ref = new URL(page.url()).searchParams.get("ref")!;
  await expect(page.getByText(ref)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your quote request has been received");
  expect(page.url()).not.toContain("customer");
  await page.screenshot({ path: testInfo.outputPath("received.png"), fullPage: true });

  const db = JSON.parse(fs.readFileSync(path.join(dataDir, "dev-db.json"), "utf8"));
  expect(db.requests).toHaveLength(1);
  expect(db.requests[0].reference).toBe(ref);
  expect(db.attachments.filter((a: { quoteRequestId: string }) => a.quoteRequestId === db.requests[0].id)).toHaveLength(1);

  // The immediate send runs after the response; the cron worker is the guarantee.
  await expect
    .poll(async () => {
      const res = await page.request.get("/api/cron/notifications", { headers: { authorization: "Bearer e2e-cron" } });
      expect(res.ok()).toBe(true);
      const current = JSON.parse(fs.readFileSync(path.join(dataDir, "dev-db.json"), "utf8"));
      return current.jobs.filter((j: { status: string }) => j.status === "sent").length;
    })
    .toBe(2);
});

test("public visitors cannot reach stored data or the worker", async ({ request }) => {
  expect((await request.get("/api/cron/notifications")).status()).toBe(401);
  expect((await request.get("/api/dev-storage?key=photos/x.jpg&expires=9999999999&sig=bad")).status()).toBe(403);
  expect((await request.post("/api/webhooks/resend", { data: { type: "email.delivered" } })).status()).toBe(401);
  expect((await request.get("/request-received")).headers()["x-robots-tag"] ?? "").toBe("");
  const html = await (await request.get("/request-received")).text();
  expect(html).toContain('name="robots" content="noindex, nofollow"');
});

for (const p of ["/", "/services", "/service-areas", "/about", "/faqs", "/request-a-quote", "/contact", "/privacy-policy", "/service-terms"]) {
  test(`page ${p} renders with consistent contact details`, async ({ page }, testInfo) => {
    await page.goto(p);
    await expect(page.locator('a[href="tel:+17209834400"]').first()).toBeAttached();
    const phones = (await page.locator("body").innerText()).match(/\b\d{3}-\d{3}-\d{4}\b/g) ?? [];
    expect(phones.length).toBeGreaterThan(0);
    expect(new Set(phones)).toEqual(new Set(["720-983-4400"]));
    const name = p === "/" ? "home" : p.slice(1);
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
  });
}

test("an expired form session recovers on submit, and Edit returns to the review", async ({ page }) => {
  const address = (city: string) => ({ street: "1 Test St", unit: "", city, state: "CO", zip: "80202" });
  const access = { stairs: "none", floor: "", elevator: "", parkingNotes: "" };
  const saved = {
    step: 3,
    // Looks fresh to the browser but the server rejects it, as an expired session would be.
    token: `00000000-0000-4000-8000-000000000000.${Date.now()}.not-a-valid-signature`,
    idem: crypto.randomUUID(),
    photos: [],
    form: {
      serviceType: "furniture-appliance", customerType: "individual", companyName: "",
      pickup: address("Denver"), dropoff: address("Aurora"), extraStops: [],
      dateMode: "asap", requestedDate: "", timeWindow: "flexible",
      items: [{ uid: "a", description: "Dresser", quantity: "1", sizeKnown: "not-sure", length: "", width: "", height: "", dimensionUnit: "in", weight: "", weightUnit: "lb", fragile: false, oversized: false }],
      vehicle: "not-sure", loadingHelp: "no", pickupAccess: access, dropoffAccess: access, dropoffSameAccess: true,
      specialInstructions: "", photoNotes: "", name: "Sam Rivera", phone: "303-555-0142", email: "sam@example.com",
      preferredContact: "either", acknowledged: false,
    },
  };
  await page.addInitScript((v) => {
    if (!sessionStorage.getItem("seeded")) {
      sessionStorage.setItem("jmt-quote-draft-v1", v);
      sessionStorage.setItem("seeded", "1");
    }
  }, JSON.stringify(saved));
  await page.goto("/request-a-quote");
  await expect(page.getByRole("heading", { name: /Contact and review/ })).toBeVisible();

  // Edit a section from the review and come straight back.
  await page.getByRole("button", { name: "Edit items and access" }).click();
  await expect(page.getByRole("heading", { name: /Items and access/ })).toBeVisible();
  // No stairs at ground level: the elevator question is not asked.
  await expect(page.getByRole("group", { name: "Elevator access" })).toHaveCount(0);
  await page.getByRole("button", { name: /Save and return to review/ }).click();
  await expect(page.getByRole("heading", { name: /Contact and review/ })).toBeVisible();

  await page.getByRole("checkbox", { name: /I understand this is a quote request/ }).check();
  await page.getByRole("button", { name: "Send quote request" }).click();
  await expect(page).toHaveURL(/\/request-received\?ref=JMT-/);
});

test("the mobile menu closes with Escape and returns focus to its button", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await expect(page.locator("#mobile-nav a").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-nav")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});

test("pages send security headers and the quote form is in the server HTML", async ({ request }) => {
  const res = await request.get("/request-a-quote");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["x-powered-by"]).toBeUndefined();
  const html = await res.text();
  expect(html).toContain("What do you need?");
  expect(html).not.toContain("Loading the form");
});
