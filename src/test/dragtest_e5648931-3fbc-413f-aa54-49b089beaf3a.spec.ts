
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('DragTest_2025-08-07', async ({ page, context }) => {
  
    // Click element
    await page.click('[data-testid="drag-handle"]:first-of-type');

    // Click element
    await page.click('.cursor-grab:first-of-type');
});