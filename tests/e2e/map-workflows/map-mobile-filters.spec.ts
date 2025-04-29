import { test } from "@playwright/test";
import { test as mapPageTest } from "../../fixtures/map-page-fixture";

test.describe("Map Mobile Filters Workflow", () => {
  mapPageTest(
    "should handle all filter interactions correctly",
    async ({ mapPage }) => {
      await mapPage.goto(
        "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150"
      );
      await mapPage.getByRole("button", { name: "mobile" }).click();
      await mapPage.getByRole("combobox", { name: "profile names" }).click();
      await mapPage.getByRole("option", { name: "2ndplace" }).click();
      await mapPage.getByTestId("close-selected-item-button").click();
      await mapPage.locator(".sc-jowuvU").click();
      await mapPage.goto(
        "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=mobile&previousUserSettings=MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=true&timeFrom=1735689600&timeTo=1767225599&fetchedSessions=100&boundEast=-67.59738290534534&boundNorth=48.63169261089525&boundSouth=23.481713124525914&boundWest=-123.84738290534534&currentCenter=%7B%22lat%22%3A37.08877211846209%2C%22lng%22%3A-95.72238290534534%7D&currentZoom=5"
      );
      await mapPage.getByRole("combobox", { name: "tags" }).click();
      await mapPage.getByRole("option", { name: "AC/EV" }).click();
      await mapPage
        .locator("#react-app div")
        .filter({
          hasText:
            "FiltersCopy linkmobilefixedparameterParticulate MattersensorAirBeam-PM2.",
        })
        .getByLabel("")
        .check();
      await mapPage.goto(
        "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=mobile&previousUserSettings=MAP_VIEW&currentUserSettings=CROWD_MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=true&timeFrom=1735689600&timeTo=1767225599&fetchedSessions=100&boundEast=-67.59738290534534&boundNorth=48.63169261089525&boundSouth=23.481713124525914&boundWest=-123.84738290534534&currentCenter=%7B%22lat%22%3A37.08877211846209%2C%22lng%22%3A-95.72238290534534%7D&currentZoom=5"
      );
      await mapPage.getByRole("button", { name: "30" }).click();
      await mapPage.getByRole("button", { name: "40" }).click();
      await mapPage.getByRole("button", { name: "2023" }).click();
      await mapPage
        .locator("div")
        .filter({ hasText: /^crowdMap on$/ })
        .getByLabel("")
        .uncheck();
      await mapPage.goto(
        "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=mobile&previousUserSettings=CROWD_MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=true&timeFrom=1672531200&timeTo=1704067199&fetchedSessions=100&boundEast=-67.59738290534534&boundNorth=48.63169261089525&boundSouth=23.481713124525914&boundWest=-123.84738290534534&currentCenter=%7B%22lat%22%3A37.08877211846209%2C%22lng%22%3A-95.72238290534534%7D&currentZoom=5&gridSize=11"
      );
      await mapPage
        .getByRole("button", { name: "sensor AirBeam-PM2.5" })
        .click();
      await mapPage
        .getByRole("button", { name: "AirBeam-PM1", exact: true })
        .click();
      await mapPage.getByRole("button", { name: "sensor AirBeam-PM1" }).click();
      await mapPage
        .getByRole("button", { name: "parameter Particulate Matter" })
        .click();
      await mapPage.getByRole("button", { name: "Humidity" }).click();
      await mapPage.getByRole("button", { name: "parameter Humidity" }).click();
      await mapPage.getByRole("button", { name: "Sound Level" }).click();
      await mapPage
        .getByRole("button", { name: "parameter Sound Level" })
        .click();
      await mapPage.getByRole("button", { name: "Temperature" }).click();
      await mapPage
        .getByRole("button", { name: "parameter Temperature" })
        .click();
    }
  );
});
