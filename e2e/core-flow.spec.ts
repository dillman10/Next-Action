import { test, expect } from "@playwright/test";

const E2E_TEST_EMAIL = "test@example.com";
const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET ?? "e2e-secret";

test("core flow: get AI suggestion → add to tasks or skip → request next", async ({
  page,
}) => {
  test.setTimeout(60_000);

  // Sign in (Credentials provider, E2E only)
  await page.goto("/api/auth/signin?callbackUrl=/dashboard");
  const credsForm = page.locator("form").filter({
    has: page.locator('input[type="password"]'),
  });
  await credsForm.getByLabel(/email/i).fill(E2E_TEST_EMAIL);
  await credsForm.locator('input[name="password"]').fill(E2E_TEST_SECRET);
  await credsForm.getByRole("button", { name: /sign in with credentials/i }).click();
  // May land on onboarding (first sign-in) or dashboard
  await expect(page).toHaveURL(/\/(dashboard|onboarding\/interests)/, { timeout: 15_000 });
  if (page.url().includes("/onboarding/interests")) {
    await page.getByRole("button", { name: /skip for now|continue/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  }
  await expect(
    page.getByRole("button", { name: /get recommendation/i }),
  ).toBeVisible({ timeout: 10_000 });

  // Request suggestion (always generated-only: new unique task or fallback)
  await page.getByRole("button", { name: /get recommendation/i }).click();
  // Generated card (Add to my tasks) or fallback / daily limit (no existing-task path)
  await expect(
    page.getByRole("button", { name: /add to my tasks/i }).or(
      page.getByText(/AI is unavailable|short idea you can try|truly new idea|5 AI suggestions for today/i),
    ),
  ).toBeVisible({ timeout: 30_000 });

  const addButton = page.getByRole("button", { name: /add to my tasks/i });
  if (await addButton.isVisible()) {
    await addButton.click();
    await expect(
      page.getByText(/added\. it's in your tasks list/i),
    ).toBeVisible({ timeout: 10_000 });
  }

  // Request next suggestion (generated-only)
  await page.getByRole("button", { name: /get recommendation/i }).click();
  await expect(
    page.getByRole("button", { name: /add to my tasks/i }).or(
      page.getByText(/AI is unavailable|short idea|truly new idea|5 AI suggestions for today/i),
    ),
  ).toBeVisible({ timeout: 30_000 });
});
