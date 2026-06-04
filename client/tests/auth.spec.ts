import { test, expect } from '@playwright/test'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function login(page: import('@playwright/test').Page, email = 'ashley@cupboard.test', password = 'password123') {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

// Dev overlay intercepts pointer events in headless mode; click via JS instead.
async function clickSignOut(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Sign out')
    ) as HTMLButtonElement | undefined
    btn?.click()
  })
}

// ── Proxy / redirect tests ─────────────────────────────────────────────────

test('root redirects unauthenticated user to /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/login')
})

test('/dashboard redirects unauthenticated user to /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
})

test('visiting /login while already logged in redirects to /dashboard', async ({ page }) => {
  await login(page)
  await page.goto('/login')
  await expect(page).toHaveURL('/dashboard')
})

// ── Login page ─────────────────────────────────────────────────────────────

test('login page renders logo, heading, and form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Cupboard')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.getByText('Sign in to your account')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('invalid credentials shows error and stays on /login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'ashley@cupboard.test')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
  await expect(page.getByText('Invalid email or password')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

test('unknown email shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'nobody@cupboard.test')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page.getByText('Invalid email or password')).toBeVisible()
})

// ── Successful login & dashboard ───────────────────────────────────────────

test('valid login redirects to /dashboard', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL('/dashboard')
})

test('dashboard sidebar shows Cupboard logo and nav sections', async ({ page }) => {
  await login(page)
  await expect(page.getByRole('complementary').getByText('Cupboard', { exact: true })).toBeVisible()
  await expect(page.getByText('MAIN')).toBeVisible()
  await expect(page.getByText('CATALOG')).toBeVisible()
  // 'Reports' only appears when the admin section renders
  await expect(page.getByText('Reports')).toBeVisible()
})

test('sidebar nav items are all present for admin user', async ({ page }) => {
  await login(page)
  const sidebar = page.getByRole('complementary')
  for (const label of ['Dashboard', 'Orders', 'Invoices', 'Payments', 'Products', 'Suppliers', 'Clients', 'Reports', 'Users']) {
    await expect(sidebar.getByText(label)).toBeVisible()
  }
})

test('dashboard shows active state on Dashboard nav link', async ({ page }) => {
  await login(page)
  const dashLink = page.getByRole('complementary').getByRole('link', { name: 'Dashboard' })
  await expect(dashLink).toHaveClass(/bg-\[#EAF3DE\]/)
})

test('sidebar shows user name, email, role and initials', async ({ page }) => {
  await login(page)
  const sidebar = page.getByRole('complementary')
  await expect(sidebar.getByText('Ashley Kekona')).toBeVisible()
  await expect(sidebar.getByText('ashley@cupboard.test')).toBeVisible()
  await expect(sidebar.getByText('Admin').first()).toBeVisible()
  await expect(sidebar.getByText('AK')).toBeVisible()
})

// ── Role-based visibility ──────────────────────────────────────────────────

test('staff user does not see Suppliers or Admin section', async ({ page }) => {
  await login(page, 'kai@cupboard.test', 'password123')
  const sidebar = page.getByRole('complementary')
  await expect(sidebar.getByText('Suppliers')).not.toBeVisible()
  await expect(sidebar.getByText('Reports')).not.toBeVisible()
  await expect(sidebar.getByText('Users')).not.toBeVisible()
  // ADMIN section label should not be present either
  await expect(sidebar.getByText('ADMIN')).not.toBeVisible()
})

// ── Sign out ───────────────────────────────────────────────────────────────

test('sign out redirects to /login', async ({ page }) => {
  await login(page)
  await clickSignOut(page)
  await page.waitForURL('**/login', { timeout: 5000 })
  await expect(page).toHaveURL('/login')
})

test('after sign out, /dashboard is blocked', async ({ page }) => {
  await login(page)
  await clickSignOut(page)
  await page.waitForURL('**/login', { timeout: 5000 })
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
})
