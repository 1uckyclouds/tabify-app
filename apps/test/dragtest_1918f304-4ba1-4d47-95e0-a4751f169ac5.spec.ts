
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('DragTest_2025-08-07', async ({ page, context }) => {
  
    // Click element
    await page.click('[title="拖拽移动标签页"]');

    // Click element
    await page.click('.cursor-grab');
});