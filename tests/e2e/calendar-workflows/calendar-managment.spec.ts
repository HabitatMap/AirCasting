import { expect } from "@playwright/test";
import { test } from "../../fixtures/calendar-fixture";

test("Test the calendar workflow", async ({ calendarPage: page }) => {
  await test.step("Navigate to the page with specific parameters", async () => {
    await page.goto(
      "http://localhost:3000/?streamId=2597281&thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=fixed&previousUserSettings=MAP_VIEW&currentUserSettings=MODAL_VIEW&sessionId=1875408&measurementType=Particulate+Matter&sensorName=Government-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=true&timeFrom=1735689600&timeTo=1767225599&fetchedSessions=16&boundEast=-73.37466729032256&boundNorth=40.93662879130742&boundSouth=40.45752305499353&boundWest=-74.58434470967742&currentCenter=%7B%22lat%22%3A40.69750662508967%2C%22lng%22%3A-73.979506%7D&currentZoom=11.123352446381977&previousCenter=%7B%22lat%22%3A40.69750662508967%2C%22lng%22%3A-73.979506%7D&previousZoom=11.123352446381977"
    );
  });

  await test.step("Open calendar view and select dates", async () => {
    await page.getByRole("link", { name: "Calendar icon" }).click();

    // Wait for calendar to be visible and interactive
    await page.waitForSelector('[data-testid="calendar-cell"]', {
      state: "visible",
      timeout: 60000,
    });

    const calendarCells = page.getByTestId("calendar-cell");
    await calendarCells.first().waitFor({ state: "visible", timeout: 60000 });

    const cells = await calendarCells.all();
    expect(cells.length).toBeGreaterThan(0);

    await cells[0].click();

    // Wait a bit for any animations or state updates
    await page.waitForTimeout(1000);

    // Click the second visible cell
    await cells[1].click();
  });

  await test.step("Change time view settings", async () => {
    const getStartDate = () =>
      page.locator(".time-container").first().locator(".date");
    const getStartTime = () =>
      page.locator(".time-container").first().locator(".time");
    const getEndDate = () =>
      page.locator(".time-container").last().locator(".date");
    const getEndTime = () =>
      page.locator(".time-container").last().locator(".time");

    const parseDateTime = async (
      dateLocator: import("@playwright/test").Locator,
      timeLocator: import("@playwright/test").Locator
    ): Promise<Date> => {
      const dateStr = await dateLocator.textContent();
      const timeStr = await timeLocator.textContent();
      if (!dateStr || !timeStr) {
        throw new Error("Date or time string is null");
      }
      return new Date(`${dateStr} ${timeStr}`);
    };

    // --- HOURS ---
    await page.getByRole("button", { name: "HOURS" }).click();
    await page.waitForTimeout(500);
    let startDate = await parseDateTime(getStartDate(), getStartTime());
    let endDate = await parseDateTime(getEndDate(), getEndTime());
    let diffInHours =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    // The application is setting this to 23 hours consistently
    expect(diffInHours).toBe(23);

    // --- WEEK ---
    await page.getByRole("button", { name: "WEEK" }).click();
    await page.waitForTimeout(500);
    startDate = await parseDateTime(getStartDate(), getStartTime());
    endDate = await parseDateTime(getEndDate(), getEndTime());
    let diffInDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    // Round to handle slight time differences
    expect(Math.round(diffInDays)).toBe(7);

    // --- MONTH ---
    await page.getByRole("button", { name: "MONTH" }).click();
    await page.waitForTimeout(500);
    startDate = await parseDateTime(getStartDate(), getStartTime());
    endDate = await parseDateTime(getEndDate(), getEndTime());

    // Calculate the expected end date (approximately one month after start date)
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setMonth(startDate.getMonth() + 1);

    // Calculate difference in days to check if it's approximately one month
    const diffInDaysMonth =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffInDaysMonth).toBeGreaterThanOrEqual(28); // Minimum days in a month
    expect(diffInDaysMonth).toBeLessThanOrEqual(31); // Maximum days in a month

    // Check time formats - start time is 00:00:00 and end time is 23:59:00
    expect(await getStartTime().textContent()).toBe("00:00:00");
    expect(await getEndTime().textContent()).toBe("23:59:00");
  });

  await test.step("Navigate calendar and adjust settings", async () => {
    await page.locator("image").nth(1).click();

    // Try to click the back button if it's enabled
    const backButton = page.getByRole("button", {
      name: "Move calendar page one step back",
    });

    // Check if the button is enabled before trying to click it
    const isBackButtonDisabled = await backButton.isDisabled();
    if (!isBackButtonDisabled) {
      await backButton.click();

      // Try clicking again if it's still enabled
      const isStillEnabled = !(await backButton.isDisabled());
      if (isStillEnabled) {
        await backButton.click();
      }
    } else {
      console.log("Back button is disabled, skipping backward navigation");
    }

    // Forward navigation instead if back is disabled
    const forwardButton = page.getByRole("button", {
      name: "Move calendar page one step forward",
    });
    const isForwardButtonDisabled = await forwardButton.isDisabled();
    if (!isForwardButtonDisabled) {
      await forwardButton.click();

      // Try clicking again if it's still enabled
      const isStillEnabled = !(await forwardButton.isDisabled());
      if (isStillEnabled) {
        await forwardButton.click();
      }
    }

    await page.getByRole("spinbutton").nth(3).click();
    await page.getByRole("spinbutton").nth(3).fill("95");
    await page.getByRole("spinbutton").nth(3).press("Enter");
  });

  await test.step("Adjust data distribution and reset settings", async () => {
    await page
      .getByRole("button", { name: "Scale to fit data Distribute" })
      .click();
    await page
      .getByRole("button", { name: "Reset to default Reset the" })
      .click();
  });

  await test.step("Get session link and download data", async () => {
    await page
      .getByRole("button", { name: "Get link to the session you" })
      .click();
    await page.getByTestId("overlay").click();
    await page.getByRole("button", { name: "DOWNLOAD DATA" }).click();
  });

  await test.step("Enter email for data download", async () => {
    const emailInput = page.getByRole("textbox", { name: "email address" });
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("test@example.com");
    await emailInput.press("Enter");
  });

  await test.step("Wait for calendar to be visible", async () => {
    await page
      .getByTestId("calendar-cell")
      .first()
      .waitFor({ state: "visible" });
  });

  await test.step("Change threshold values in sequence", async () => {
    const spinbutton3 = page.getByRole("spinbutton").nth(3);
    await spinbutton3.waitFor({ state: "visible" });
    await spinbutton3.fill("130");
    await spinbutton3.press("Enter");
    await page.waitForTimeout(1000);

    const spinbutton2 = page.getByRole("spinbutton").nth(2);
    await spinbutton2.waitFor({ state: "visible" });
    await spinbutton2.fill("130");
    await spinbutton2.press("Enter");
    await page.waitForTimeout(1000);

    const spinbutton1 = page.getByRole("spinbutton").nth(1);
    await spinbutton1.waitFor({ state: "visible" });
    await spinbutton1.fill("130");
    await spinbutton1.press("Enter");
    await page.waitForTimeout(1000);
  });

  await test.step("Verify calendar cells are green", async () => {
    const calendarCells = await page.getByTestId("calendar-cell").all();
    expect(calendarCells.length).toBeGreaterThan(0);

    for (const cell of calendarCells) {
      await cell.waitFor({ state: "visible" });

      const cellData = await cell.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const value = el.querySelector(".value")?.textContent;
        return {
          value,
          color: style.backgroundColor,
        };
      });

      if (!cellData.value) {
        continue;
      }

      expect(cellData.color).toBe("rgb(150, 215, 136)");
    }
  });
});
