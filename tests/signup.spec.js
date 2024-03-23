const { test, expect } = require('@playwright/test');
const { MongoClient } = require('mongodb');
const config = require('../dbConfig.json');

test.describe('Signup Feature', () => {
    // Before each test, navigate to the signup page
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:4000/signup.html');
    });

    test('Successful signup redirects user to the planner page', async ({ page }) => {
        // delete the MongoDB user with the username 'testUser' if it exists
        const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
        const client = new MongoClient(url);
        await client.connect();
        const db = client.db('rm_data');
        await db.collection('users').deleteOne({ username: 'testuser' });
        await client.close();

        // Fill out the signup form and submit
        await page.fill('#username', 'testuser');
        await page.fill('#password', 'password');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('http://localhost:4000/planner.html');
        await expect(page.locator('.welcome')).toContainText('testuser');
    });

    test('Duplicate username shows error modal', async ({ page }) => {
        await page.fill('#username', 'testuser');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('#msgModal .modal-body')).toContainText('Username taken');
    });
});
