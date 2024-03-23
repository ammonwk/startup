const { test, expect } = require('@playwright/test');

test.describe('Login Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the login page before each test
        await page.goto('http://localhost:4000/login.html');
    });

    test('Successful Login', async ({ page }) => {
        // Assuming these credentials are valid in your test environment
        await page.fill('#username', 'testuser');
        await page.fill('#password', 'password');
        await page.click('button[type="submit"]');

        // Replace the URL below with the URL of the page users are redirected to upon successful login
        await expect(page).toHaveURL('http://localhost:4000/planner.html');

        // Optionally, verify local storage or cookie for login state persistence
        const userName = await page.evaluate(() => localStorage.getItem('userName'));
        expect(userName).toBe('testuser');
    });

    test('Invalid Login Credentials', async ({ page }) => {
        await page.fill('#username', 'wronguser');
        await page.fill('#password', 'wrongpass');
        await page.click('button[type="submit"]');

        // Assuming an error modal or message appears on invalid credentials
        await expect(page.locator('#msgModal .modal-body')).toContainText('Invalid username or password');
    });

    // test('Empty Credentials', async ({ page }) => {
    //     // Click login without entering credentials
    //     await page.click('button[type="submit"]');
    //     // Verify error message or validation
    //     await expect(page.locator('#msgModal .modal-body')).toContainText('Please enter username and password');
    // });


    // Additional tests here
});
