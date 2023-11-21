import React from "react";

import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/global-styles";
import { ValuePlaceholder } from "./components/molecules/ValuePlaceholder";

const App = () => {
  return (
    <>
      <GlobalStyles />
      <CalendarPage />
      <ValuePlaceholder />
    </>
  );
};

export { App };
