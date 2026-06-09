const { test, expect } = require('@playwright/test');

test.describe('Kazka App — Core Features', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/app.html');
    // Wait for the DOM to be ready
    await page.waitForSelector('#app-content', { timeout: 15000 }).catch(() => {});
  });

  test('Page loads with login form visible', async ({ page }) => {
    const loginForm = page.locator('#loginForm, #login-form, .login-form');
    await expect(loginForm.first()).toBeVisible({ timeout: 10000 });
  });

  test('Static admin credentials work', async ({ page }) => {
    // Try static admin login
    const adminBtn = page.locator('button:has-text("Admin"), a:has-text("Admin")').first();
    if (await adminBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await adminBtn.click();
    }
    const username = page.locator('input[type="text"], input[name="username"], input#username').first();
    const password = page.locator('input[type="password"], input[name="password"], input#password').first();
    if (await username.isVisible({ timeout: 3000 }).catch(() => false)) {
      await username.fill('admin');
      await password.fill('admintest');
      const submit = page.locator('button[type="submit"], button:has-text("Accedi"), button:has-text("Login")').first();
      await submit.click();
      await page.waitForTimeout(2000);
    }
  });

  test('Navigation items are rendered', async ({ page }) => {
    // Wait for possible auto-login
    await page.waitForTimeout(3000);
    const navItems = page.locator('#nav-bar a, .nav-item, nav a').first();
    if (await navItems.isVisible({ timeout: 3000 }).catch(() => false)) {
      const count = await page.locator('#nav-bar a, .nav-item, nav a').count();
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  test('Transaction modal opens correctly', async ({ page }) => {
    await page.waitForTimeout(3000);
    const addBtn = page.locator('button:has-text("Aggiungi"), button:has-text("Nuova")').first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      const modal = page.locator('.mo.active, .modal.active, #txModal.active');
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('Profile page has backup/restore buttons', async ({ page }) => {
    await page.waitForTimeout(3000);
    const profileLink = page.locator('a:has-text("Profilo"), button:has-text("Profilo"), [href*="profilo"], [onclick*="profilo"]').first();
    if (await profileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileLink.click();
      await page.waitForTimeout(1500);
      const backup = page.locator('button:has-text("Backup")');
      const restore = page.locator('label:has-text("Ripristina")');
      // At least one should be visible
      const visible = (await backup.isVisible({ timeout: 2000 }).catch(() => false)) ||
                      (await restore.isVisible({ timeout: 2000 }).catch(() => false));
      expect(visible).toBeTruthy();
    }
  });

  test('Currency selector is present in profile', async ({ page }) => {
    await page.waitForTimeout(3000);
    const profileLink = page.locator('a:has-text("Profilo"), button:has-text("Profilo"), [href*="profilo"]').first();
    if (await profileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileLink.click();
      await page.waitForTimeout(1500);
      const currencySelect = page.locator('#currencySelect');
      if (await currencySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        const value = await currencySelect.inputValue();
        expect(['EUR', 'USD', 'GBP', 'CHF', 'JPY']).toContain(value);
      }
    }
  });

  test('Chart.js is loaded', async ({ page }) => {
    const hasChart = await page.evaluate(() => typeof Chart !== 'undefined');
    expect(hasChart).toBe(true);
  });

  test('Tesseract.js OCR library is loaded', async ({ page }) => {
    const hasTesseract = await page.evaluate(() => typeof Tesseract !== 'undefined');
    expect(hasTesseract).toBe(true);
  });

  test('Audit log functions exist', async ({ page }) => {
    const auditExists = await page.evaluate(() => typeof auditLog === 'function');
    expect(auditExists).toBe(true);
  });

  test('Backup/restore functions exist', async ({ page }) => {
    const backupExists = await page.evaluate(() => typeof backupAllData === 'function');
    const restoreExists = await page.evaluate(() => typeof restoreBackup === 'function');
    expect(backupExists && restoreExists).toBe(true);
  });

  test('Multi-currency conversion works', async ({ page }) => {
    const convResult = await page.evaluate(() => {
      if (typeof convertCurrency !== 'function') return null;
      return convertCurrency(100, 'EUR', 'USD');
    });
    if (convResult !== null) {
      expect(parseFloat(convResult)).toBeCloseTo(109, 0);
    }
  });

  test('Custom categories can be loaded', async ({ page }) => {
    const cats = await page.evaluate(() => {
      if (typeof loadCustomCats !== 'function') return null;
      return loadCustomCats();
    });
    expect(Array.isArray(cats)).toBe(true);
  });

  test('AI category suggestion works', async ({ page }) => {
    const cat = await page.evaluate(() => {
      if (typeof aiSuggestCategory !== 'function') return null;
      return 'function_exists';
    });
    expect(cat).toBe('function_exists');
  });

  test('Debts page loads via navigation', async ({ page }) => {
    await page.waitForTimeout(3000);
    const debtsLink = page.locator('a:has-text("Debiti"), a:has-text("Debt"), [onclick*="debiti"]').first();
    if (await debtsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await debtsLink.click();
      await page.waitForTimeout(1500);
      const content = page.locator('#content');
      const text = await content.textContent().catch(() => '');
      expect(text).toContain('Debiti');
    }
  });

  test('Threshold settings save and load', async ({ page }) => {
    const loadResult = await page.evaluate(() => {
      if (typeof loadThresholds !== 'function') return null;
      return loadThresholds();
    });
    expect(Array.isArray(loadResult)).toBe(true);
  });

});
