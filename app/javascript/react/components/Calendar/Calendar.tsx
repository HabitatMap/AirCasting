import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid"; // a plugin!
import { EventInput } from "@fullcalendar/core";
import "./CalendarCSS.css";

import {
  calendarGreen,
  calendarOrange,
  calendarYellow,
  calendarRed,
} from "../../assets/styles/colors";

export function Calendar() {
  const makeEvents = () => {
    const now = new Date();

    const event: EventInput = {
      date: new Date(now.getTime() + 20 * 60 * 60 * 1000),
      allDay: true,
      display: "background",
      color: calendarGreen,
    };
    return [event];
  };

  return (
    <div>
      <FullCalendar
        height={300}
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        weekends={true}
        events={makeEvents()}
      />
    </div>
  );
}
