
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('DragTest_2025-08-07', async ({ page, context }) => {
  
    // Click element
    await page.click('[class*="cursor-grab"]');

    // Click element
    await page.click('img[alt=""]');
});