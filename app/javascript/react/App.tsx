import React from "react";
import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/styles/global-styles";
import './locales/i18n'

const App = () => {
  return (
    <>
      <GlobalStyles />
      <CalendarPage />
    </>
  );
};

export { App };
