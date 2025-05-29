import moment, { Moment } from "moment";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { movingData } from "../../../store/movingCalendarStreamSlice";
import { selectCalendarData } from "../../../store/movingStreamSelectors";
import { DateFormat } from "../../../types/dateFormat";
import { MovesKeys } from "../../../types/movesKeys";
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

  const [visibleDateRange, setVisibleDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const threeMonthsData = useAppSelector((state) =>
    selectCalendarData(
      state,
      visibleDateRange.startDate,
      visibleDateRange.endDate
    )
  );
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
    const maxEndDateMoment = moment(maxCalendarDate, DateFormat.default);
    if (newEndMoment.isAfter(maxEndDateMoment)) {
      newEndMoment = maxEndDateMoment;
      setIsRightButtonDisabled(true);
    }
    return newEndMoment;
  };

  const getFormattedDateRange = () => {
    if (!movingCalendarData.data || movingCalendarData.data.length === 0) {
      return {
        firstDate: "",
        lastDate: "",
        lastDateNoFormat: "",
      };
    }

    const lastElementIdx = movingCalendarData.data.length - 1;
    const maxEndDate = movingCalendarData.data[lastElementIdx].date;
    const processedMaxEndDate = moment(maxEndDate, DateFormat.default).format(
      DateFormat.us
    );

    const firstElementIdx = 0;
    const firstDataPoint = movingCalendarData.data[firstElementIdx].date;
    const processedFirstDataPoint = moment(
      firstDataPoint,
      DateFormat.default
    ).format(DateFormat.us);

    return {
      firstDate: processedFirstDataPoint,
      lastDate: processedMaxEndDate,
      lastDateNoFormat: maxEndDate,
    };
  };

  useEffect(() => {
    if (!movingCalendarData.data || movingCalendarData.data.length === 0) {
      return;
    }

    try {
      const sortedData = [...movingCalendarData.data].sort(
        (a, b) => moment(a.date).valueOf() - moment(b.date).valueOf()
      );

      const firstDate = moment(sortedData[0].date).format(DateFormat.us);
      const lastDate = moment(sortedData[sortedData.length - 1].date).format(
        DateFormat.us
      );

      // Initialize with the last 3 months of data
      const endMoment = moment(lastDate, DateFormat.us);
      const newStartDate = endMoment
        .clone()
        .date(1)
        .subtract(SEEN_MONTHS_NUMBER - 1, "months")
        .format(DateFormat.us);
      const newEndDate = endMoment.format(DateFormat.us);

      setVisibleDateRange({
        startDate: newStartDate,
        endDate: newEndDate,
      });

      // Disable right arrow if we're at the latest data
      const maxEndDateMoment = moment(maxCalendarDate, DateFormat.default);
      setIsRightButtonDisabled(
        endMoment.isSameOrAfter(maxEndDateMoment, "day")
      );

      setDateReference((prevState) => ({
        ...prevState,
        currentStartDate: newStartDate,
        currentEndDate: newEndDate,
        firstVisibleDataPointDate: newStartDate,
        lastVisibleDataPointDate: newEndDate,
      }));
    } catch (error) {
      console.error("Error processing calendar data:", error);
    }
  }, [movingCalendarData, maxCalendarDate]);

  useEffect(() => {
    if (!dateReference.currentEndDate || !dateReference.direction) return;

    const dateMoment = moment(dateReference.currentEndDate, DateFormat.us);
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

    const newEndDate = newEndMoment.format(DateFormat.us);
    const newStartDate = newEndMoment
      .clone()
      .date(1)
      .subtract(SEEN_MONTHS_NUMBER - 1, "months")
      .format(DateFormat.us);

    const newStartDateMoment = moment(newStartDate, DateFormat.us).date(1);
    const minCalendarMoment = moment(minCalendarDate, DateFormat.default).date(
      1
    );

    if (newStartDateMoment.isBefore(minCalendarMoment)) {
      setIsLeftButtonDisabled(true);
      return;
    }

    setVisibleDateRange({
      startDate: newStartDate,
      endDate: newEndDate,
    });

    setDateReference((prevState) => ({
      ...prevState,
      currentStartDate: newStartDate,
      currentEndDate: newEndDate,
      firstVisibleDataPointDate: newStartDate,
      lastVisibleDataPointDate: newEndDate,
    }));
  }, [dateReference.triggerDirectionUpdate]);

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
