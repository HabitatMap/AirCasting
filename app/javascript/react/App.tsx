import React from "react";
import './locales/i18n'

import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/styles/global-styles";

const App = () => {
  return (
    <>
      <GlobalStyles />
      <CalendarPage />
    </>
  );
};

export { App };
