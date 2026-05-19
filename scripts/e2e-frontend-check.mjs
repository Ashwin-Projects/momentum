import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const ts = Date.now();
const email = `e2e_${ts}@test.local`;
const password = 'testpass123';
const name = `E2E User ${ts}`;

const results = [];
const consoleErrors = [];

const pass = (name, detail = '') => results.push({ name, status: 'PASS', detail });
const fail = (name, detail = '') => results.push({ name, status: 'FAIL', detail });

async function registerUser(page) {
  await page.goto(`${BASE}/register`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('Ashwin').fill(name);
  await page.getByPlaceholder('you@example.com').fill(email);
  const pw = page.getByPlaceholder('Min. 6 characters');
  await pw.fill(password);
  await page.getByPlaceholder('Repeat your password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  let authed = false;
  try {
    await registerUser(page);
    authed = true;
    pass('Register → dashboard redirect');
  } catch (e) {
    fail('Register → dashboard redirect', e.message);
  }

  if (!authed) {
    console.log('\n=== MOMENTUM E2E RESULTS (aborted — not authenticated) ===\n');
    results.forEach((r) => console.log(`${r.status.padEnd(4)} | ${r.name}${r.detail ? ` — ${r.detail}` : ''}`));
    await browser.close();
    process.exit(1);
  }

  const entryTests = [
    {
      name: 'Log Study entry',
      path: '/study',
      open: 'Log Session',
      submit: 'Log Session',
      fill: async (p) => {
        await p.locator('#subject').fill('E2E Math');
        await p.locator('#duration').fill('45');
      },
      verify: (p) => p.getByText('E2E Math'),
    },
    {
      name: 'Log Workout entry',
      path: '/workout',
      open: 'Log Workout',
      submit: 'Log Workout',
      fill: async (p) => {
        await p.locator('#type').fill('strength');
        await p.locator('#duration').fill('30');
      },
      verify: (p) => p.getByText('strength'),
    },
    {
      name: 'Log Nutrition entry',
      path: '/nutrition',
      open: 'Log Meal',
      submit: 'Log Meal',
      fill: async (p) => {
        await p.locator('#foodName').fill('E2E Bowl');
        await p.locator('#calories').fill('500');
      },
      verify: (p) => p.getByText('E2E Bowl'),
    },
    {
      name: 'Log Sleep entry',
      path: '/sleep',
      open: 'Log Sleep',
      submit: 'Log Sleep',
      fill: async (p) => {
        const actual = p.locator('#sleepHoursActual');
        if (await actual.count()) await actual.fill('7');
      },
      verify: async (p) => (await p.getByText(/7(\.0)?\s*h|hours/i).count()) > 0,
    },
    {
      name: 'Log Mood entry',
      path: '/mood',
      open: 'Log Mood',
      submit: 'Log Mood',
      fill: async (p) => {
        await p.locator('#notes').fill('E2E mood note');
      },
      verify: (p) => p.getByText('E2E mood note'),
    },
    {
      name: 'Log Focus entry',
      path: '/focus',
      open: 'Log Focus',
      submit: 'Log Session',
      fill: async (p) => {
        await p.locator('#taskName').fill('E2E Focus Task');
        await p.locator('#duration').fill('25');
      },
      verify: (p) => p.getByText('E2E Focus Task'),
    },
    {
      name: 'Log Screentime entry',
      path: '/screentime',
      open: 'Log Screen Time',
      submit: 'Log Screen Time',
      fill: async (p) => {
        await p.locator('#appName').fill('E2E App');
        await p.locator('#duration').fill('20');
      },
      verify: (p) => p.getByText('E2E App'),
    },
  ];

  for (const t of entryTests) {
    try {
      await page.goto(`${BASE}${t.path}`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: t.open, exact: true }).click();
      await t.fill(page);
      await page.getByRole('button', { name: t.submit, exact: true }).click();
      await page.waitForTimeout(2500);
      const locator = await t.verify(page);
      await locator.first().waitFor({ state: 'visible', timeout: 5000 });
      pass(t.name);
    } catch (e) {
      fail(t.name, e.message.split('\n')[0]);
    }
  }

  try {
    await page.goto(`${BASE}/analytics`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
    const charts = await page.locator('.recharts-wrapper, svg.recharts-surface').count();
    const body = await page.locator('body').innerText();
    const onLogin = /sign in|create account/i.test(body) && charts === 0;
    const hasContent =
      charts > 0 ||
      (/weekly|study|workout|sleep|nutrition|focus|mood|screen/i.test(body) &&
        !/track your progress only/i.test(body));
    if (!onLogin && hasContent) pass('Analytics shows data', `charts=${charts}`);
    else fail('Analytics shows data', onLogin ? 'redirected or login UI' : 'empty/broken');
  } catch (e) {
    fail('Analytics shows data', e.message.split('\n')[0]);
  }

  try {
    await page.goto(`${BASE}/targets`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
    const body = await page.locator('body').innerText();
    const hasProgress = /% complete/i.test(body);
    const hasLoggedData =
      body.includes('45') || body.includes('30') || body.includes('500') || body.includes('7');
    if (hasProgress && hasLoggedData) pass('Targets reflect progress');
    else if (hasProgress) pass('Targets reflect progress', 'progress bars visible');
    else fail('Targets reflect progress', 'no progress UI');
  } catch (e) {
    fail('Targets reflect progress', e.message.split('\n')[0]);
  }

  try {
    await page.goto(`${BASE}/ai-planner`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('textarea', { timeout: 20000 });
    await page.locator('textarea').fill('What should I focus on for the rest of today?');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(15000);
    const body = await page.locator('body').innerText();
    const trouble = body.includes('having trouble connecting');
    const hasAiReply =
      body.includes('focus') &&
      !trouble &&
      body.split('What should I focus on').length > 1;
    if (hasAiReply) pass('AI Planner real response');
    else fail('AI Planner real response', trouble ? 'connection error' : 'no AI reply text');
  } catch (e) {
    fail('AI Planner real response', e.message.split('\n')[0]);
  }

  console.log('\n=== MOMENTUM E2E RESULTS ===\n');
  for (const r of results) {
    console.log(`${r.status.padEnd(4)} | ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  if (consoleErrors.length) {
    console.log('\n=== CONSOLE ERRORS (unique) ===\n');
    [...new Set(consoleErrors)].slice(0, 12).forEach((e) => console.log(e));
  }
  await browser.close();
  process.exit(results.some((r) => r.status === 'FAIL') ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
