import React from "react";
import { Provider } from "react-redux";

import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/styles/global-styles";
import store from "./store/index";
import "./locales/i18n";
import { WeekView } from "./components/DayView/WeekView";


const today = new Date()

const getDayAhead = (ahead: number): Date => {
  const today = new Date()
  const upDate = today.setDate(today.getDate() + ahead)
  return new Date(upDate)
}

const weeklyData = [
  { value: 25, date: today },
  { value: 50, date: getDayAhead(1) },
  { value: 120, date: getDayAhead(2) },
  { value: 2, date: getDayAhead(3) },
  { value: 70, date: getDayAhead(4) },
  { value: 200, date: getDayAhead(5) },
  { value: 30, date: getDayAhead(6) },
];

const colorRanges = {
  bottom: 0,
  lower: 40,
  middle: 60,
  higher: 80,
  top: 100
};

const App = () => {
  return (
    <Provider store={store}>
      <GlobalStyles />
      {/* <CalendarPage /> */}
      <WeekView weeklyData={weeklyData} colorRanges={colorRanges}/>
    </Provider>
  );
};

export { App };
