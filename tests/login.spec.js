const { test, expect } = require('@playwright/test');

test.describe('Login Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the login page before each test
        await page.goto('http://localhost:4000/login.html');
    });

    test('Successful Login', async ({ page }) => {
        await page.fill('#username', 'testuser');
        await page.fill('#password', 'password');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('http://localhost:4000/planner.html');

        // Verify local storage or cookie for login state persistence
        const userName = await page.evaluate(() => localStorage.getItem('userName'));
        expect(userName).toBe('testuser');
    });

    test('Invalid Login Credentials', async ({ page }) => {
        await page.fill('#username', 'wronguser');
        await page.fill('#password', 'wrongpass');
        await page.click('button[type="submit"]');

        await expect(page.locator('#msgModal .modal-body')).toContainText('Invalid username or password');
    });

    test('Empty Credentials', async ({ page }) => {
        // Click login without entering credentials
        await page.click('button[type="submit"]');
        // Verify error message or validation
        await expect(page.locator('#msgModal .modal-body')).toContainText('Please enter username and password');
    });


    test('Redirection After Successful Login', async ({ page }) => {
        await page.fill('#username', 'testuser');
        await page.fill('#password', 'password');
        await page.click('button[type="submit"]');

        // Adjust the expected URL to your application's post-login redirection target
        await expect(page).toHaveURL('http://localhost:4000/planner.html');
    });

    test('Persistence of Login State', async ({ page }) => {
        await page.fill('#username', 'testuser');
        await page.fill('#password', 'password');
        await page.click('button[type="submit"]');

        // Check for the existence of a session token or similar persistent login state marker
        await expect(page).toHaveURL('http://localhost:4000/planner.html');
        const loginToken = await page.evaluate(() => localStorage.getItem('userName'));
        expect(loginToken).toBe('testuser');

        // Optionally, reload the page or navigate away and back, then check the login state again
        await page.reload();
        const loginStateAfterReload = await page.evaluate(() => localStorage.getItem('userName'));
        await expect(page).toHaveURL('http://localhost:4000/planner.html');
        expect(loginStateAfterReload).toBe(loginToken);
    });


    test('UI Elements Existence', async ({ page }) => {
        // Check for the presence of the username input
        await expect(page.locator('#username')).toBeVisible();
        // Check for the presence of the password input
        await expect(page.locator('#password')).toBeVisible();
        // Check for the presence of the login button
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

});
