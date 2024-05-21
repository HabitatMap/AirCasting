import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { Moment } from "moment";
import moment from "moment";

import { MovesKeys } from "../../../types/movesKeys";
import { useAppDispatch } from "../../../store/hooks";
import { selectThreeMonthsDailyAverage } from "../../../store/movingStreamSelectors";
import {
  movingData,
  fetchNewMovingStream,
} from "../../../store/movingCalendarStreamSlice";
import { CalendarMonthlyData } from "../../../types/movingStream";

interface MovableCalendarData {
  currentStartDate: string;
  currentEndDate: string;
  firstVisibleDataPointDate: string;
  lastVisibleDataPointDate: string;
  direction: MovesKeys | undefined;
  triggerDirectionUpdate: number;
}

interface CalendarControllerReturn {
  threeMonthsData: CalendarMonthlyData[];
  dateReference: MovableCalendarData;
  isLeftButtonDisabled: boolean;
  isRightButtonDisabled: boolean;
  handleLeftClick: () => void;
  handleRightClick: () => void;
}

interface CalendarHookParams {
  streamId: number;
  minCalendarDate: string;
  maxCalendarDate: string;
}

const useCalendarHook = ({
  streamId,
  minCalendarDate,
  maxCalendarDate,
}: CalendarHookParams): CalendarControllerReturn => {
  const SEEN_MONTHS_NUMBER = 3;

  const dispatch = useAppDispatch();
  const threeMonthsData = useSelector(selectThreeMonthsDailyAverage);
  const movingCalendarData = useSelector(movingData);
  const [isRightButtonDisabled, setIsRightButtonDisabled] =
    useState<boolean>(false);
  const [isLeftButtonDisabled, setIsLeftButtonDisabled] =
    useState<boolean>(false);
  const [dateReference, setDateReference] = useState<MovableCalendarData>({
    currentStartDate: "",
    currentEndDate: "",
    firstVisibleDataPointDate: "",
    lastVisibleDataPointDate: "",
    direction: undefined,
    triggerDirectionUpdate: 0,
  });

  const updateMoveValue = (direction: MovesKeys) => {
    setDateReference((prevState) => ({
      ...prevState,
      direction,
      triggerDirectionUpdate: prevState.triggerDirectionUpdate + 1,
    }));
  };

  const handleBackwardMovement = (dateMoment: moment.Moment) => {
    setIsRightButtonDisabled(false);
    const newEndMoment = dateMoment.subtract(1, "months").endOf("month");
    return newEndMoment;
  };

  const handleForwardMovement = (dateMoment: moment.Moment) => {
    setIsLeftButtonDisabled(false);
    let newEndMoment = dateMoment.add(1, "months").endOf("month");
    const maxEndDateMoment = moment(maxCalendarDate, "YYYY-MM-DD");
    if (newEndMoment.isAfter(maxEndDateMoment)) {
      newEndMoment = maxEndDateMoment;
      setIsRightButtonDisabled(true);
    }
    return newEndMoment;
  };

  const getFormattedDateRange = () => {
    const lastElementIdx = movingCalendarData.data.length - 1;
    const maxEndDate = movingCalendarData.data[lastElementIdx].date;
    const processedMaxEndDate = moment(maxEndDate, "YYYY-MM-DD").format(
      "DD/MM/YYYY"
    );

    const firstElementIdx = 0;
    const firstDataPoint = movingCalendarData.data[firstElementIdx].date;
    const processedFirstDataPoint = moment(firstDataPoint, "YYYY-MM-DD").format(
      "DD/MM/YYYY"
    );

    return {
      firstDate: processedFirstDataPoint,
      lastDate: processedMaxEndDate,
      lastDateNoFormat: maxEndDate,
    };
  };

  useEffect(() => {
    const formattedDateRange = getFormattedDateRange();
    const processedMaxEndDate = formattedDateRange.lastDate;
    const processedFirstDataPoint = formattedDateRange.firstDate;

    const startMoment = moment(
      formattedDateRange.lastDateNoFormat,
      "YYYY-MM-DD"
    );
    const newStartDate = startMoment
      .date(1)
      .subtract(SEEN_MONTHS_NUMBER - 1, "months")
      .format("DD/MM/YYYY");

    console.log("First time first and last point identify: ", processedFirstDataPoint, processedMaxEndDate)
    setDateReference((prevState) => ({
      ...prevState,
      currentStartDate: newStartDate,
      firstVisibleDataPointDate: processedFirstDataPoint,
      lastVisibleDataPointDate: processedMaxEndDate,
      currentEndDate: processedMaxEndDate,
    }));
  }, []);

  useEffect(() => {
    if (!dateReference.currentEndDate) return;

    const dateMoment = moment(dateReference.currentEndDate, "DD/MM/YYYY");
    let newEndMoment: Moment;

    switch (dateReference.direction) {
      case MovesKeys.MOVE_BACKWARD:
        newEndMoment = handleBackwardMovement(dateMoment);
        break;
      case MovesKeys.MOVE_FORWARD:
        newEndMoment = handleForwardMovement(dateMoment);
        break;
      default:
        console.error("Invalid direction value:", dateReference.direction);
        return;
    }

    const newEndDate = newEndMoment.format("DD/MM/YYYY");
    const newStartDate = newEndMoment
      .date(1)
      .subtract(SEEN_MONTHS_NUMBER - 1, "months")
      .format("DD/MM/YYYY");

    const newStartDateMoment = moment(newStartDate, "DD/MM/YYYY").date(1);
    const minCalendarMoment = moment(minCalendarDate, "YYYY-MM-DD").date(1);

    console.log("Identify new min moment...", minCalendarMoment)
    console.log("Proposed new start date", newStartDateMoment)

    if (newStartDateMoment.isBefore(minCalendarMoment)) {
      setIsLeftButtonDisabled(true);
      return;
    }

    setDateReference((prevState) => ({
      ...prevState,
      currentStartDate: newStartDate,
      currentEndDate: newEndDate,
    }));

    const formattedStartDate = moment(newStartDate, "DD/MM/YYYY").format(
      "YYYY-MM-DD"
    );
    const formattedEndDate = moment(newEndDate, "DD/MM/YYYY").format(
      "YYYY-MM-DD"
    );

    dispatch(
      fetchNewMovingStream({
        id: streamId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      })
    );
  }, [dateReference.triggerDirectionUpdate]);

  useEffect(() => {
    const formattedDateRange = getFormattedDateRange();
    const processedMaxEndDate = formattedDateRange.lastDate;
    const processedFirstDataPoint = formattedDateRange.firstDate;

    setDateReference((prevState) => ({
      ...prevState,
      firstVisibleDataPointDate: processedFirstDataPoint,
      lastVisibleDataPointDate: processedMaxEndDate,
    }));
  }, [movingCalendarData]);

  return {
    threeMonthsData,
    dateReference,
    isLeftButtonDisabled,
    isRightButtonDisabled,
    handleLeftClick: () => updateMoveValue(MovesKeys.MOVE_BACKWARD),
    handleRightClick: () => updateMoveValue(MovesKeys.MOVE_FORWARD),
  };
};

export default useCalendarHook;
