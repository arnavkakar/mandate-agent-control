import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const apiBase =
  process.env.MANDATE_API_URL ??
  "https://mandate-agent-control-production.up.railway.app";
const password = "MandateQA2026Secure";

async function createWorkspace(request: APIRequestContext) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `qa-e2e-${stamp}@example.com`;
  const response = await request.post(`${apiBase}/v1/auth/signup`, {
    data: {
      name: "Mandate QA",
      organizationName: `Mandate QA ${stamp}`,
      email,
      password,
    },
  });
  expect(response.status()).toBe(201);
  const session = await response.json();
  return { email, session };
}

async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

test("approval resolution is immediately removed and error state does not leak", async ({
  page,
  request,
}) => {
  const { email, session } = await createWorkspace(request);
  const seeded = await request.post(`${apiBase}/v1/demo-seed`, {
    headers: { Authorization: `Bearer ${session.token}` },
    data: {},
  });
  expect(seeded.status()).toBe(201);
  await signIn(page, email);

  await page.getByRole("button", { name: /Approvals 1/ }).click();
  await page.getByRole("button", { name: "Approve once" }).click();
  await page.getByRole("button", { name: "Confirm approval" }).click();

  await expect(page.getByRole("heading", { name: "Queue clear" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Approvals 0/ })).toBeVisible();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("mandate interpretation returns editable deterministic policy", async ({
  page,
  request,
}) => {
  const { email, session } = await createWorkspace(request);
  await request.post(`${apiBase}/v1/demo-seed`, {
    headers: { Authorization: `Bearer ${session.token}` },
    data: {},
  });
  await signIn(page, email);

  await page.getByRole("button", { name: "New mandate" }).click();
  await page.getByRole("button", { name: "Structure policy" }).click();

  await expect(
    page.getByRole("spinbutton", { name: "Monthly budget (USD)" }),
  ).toHaveValue("2000");
  await expect(
    page.getByRole("button", { name: "Review activation" }),
  ).toBeEnabled();
  await expect(page.getByText(/Mandate interpretation failed/)).toHaveCount(0);
});

test("simulator persists a request and exposes stored decision evidence", async ({
  page,
  request,
}) => {
  const { email, session } = await createWorkspace(request);
  await request.post(`${apiBase}/v1/demo-seed`, {
    headers: { Authorization: `Bearer ${session.token}` },
    data: {},
  });
  await signIn(page, email);

  await page.getByRole("button", { name: "Simulator", exact: true }).click();
  await page.getByRole("textbox", { name: "Merchant" }).fill("GitHub");
  await page.getByRole("spinbutton", { name: /Amount/ }).fill("96");
  await page
    .getByRole("combobox", { name: "Category" })
    .selectOption({ label: "Software" });
  await page.getByRole("button", { name: "Evaluate on Railway" }).click();
  await expect(page.getByText("Authorization decision")).toBeVisible();
  await page.getByRole("button", { name: "Why this decision?" }).click();
  await expect(
    page.getByRole("dialog", { name: /Why was this request/ }),
  ).toBeVisible();
  await expect(
    page.getByText("AI was not used to authorize this request."),
  ).toBeVisible();
});
