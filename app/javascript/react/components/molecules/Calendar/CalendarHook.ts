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
  maxEndDate: string;
  maxStartDate: string;
  currentStartDate: string;
  currentEndDate: string;
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

const useCalendarHook = (streamId: number): CalendarControllerReturn => {
  const SEEN_MONTHS_NUMBER = 3;

  const dispatch = useAppDispatch();
  const threeMonthsData = useSelector(selectThreeMonthsDailyAverage);
  const movingCalendarData = useSelector(movingData);
  const [isRightButtonDisabled, setIsRightButtonDisabled] =
    useState<boolean>(false);
  const [isLeftButtonDisabled, setIsLeftButtonDisabled] =
    useState<boolean>(false);
  const [dateReference, setDateReference] = useState<MovableCalendarData>({
    maxEndDate: "",
    maxStartDate: "",
    currentStartDate: "",
    currentEndDate: "",
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
    const maxEndDateMoment = moment(dateReference.maxEndDate, "DD/MM/YYYY");
    if (newEndMoment.isAfter(maxEndDateMoment)) {
      newEndMoment = maxEndDateMoment;
      setIsRightButtonDisabled(true);
    }
    return newEndMoment;
  };

  useEffect(() => {
    // Disable forward button at first, becouse
    // we present the newest months just after loading this page
    setIsRightButtonDisabled(true);

    const lastElementIdx = movingCalendarData.data.length - 1;
    const maxEndDate = movingCalendarData.data[lastElementIdx].date;
    const processedMaxEndDate = moment(maxEndDate, "YYYY-MM-DD").format(
      "DD/MM/YYYY"
    );

    const maxStartDate = movingCalendarData.data[0].date;
    console.log("Saving...", movingCalendarData.data);
    const processedMaxStartDate = moment(maxStartDate, "YYYY-MM-DD").format(
      "DD/MM/YYYY"
    );

    const startMoment = moment(maxEndDate, "YYYY-MM-DD");
    const newStartDate = startMoment
      .date(1)
      .subtract(SEEN_MONTHS_NUMBER - 1, "months")
      .format("DD/MM/YYYY");

    setDateReference((prevState) => ({
      ...prevState,
      maxStartDate: processedMaxStartDate,
      maxEndDate: processedMaxEndDate,
      currentStartDate: newStartDate,
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

    const maxStartDateMoment = moment(dateReference.maxStartDate, "DD/MM/YYYY");
    const newStartDateMoment = moment(newStartDate, "DD/MM/YYYY");

    console.log("^^^^", maxStartDateMoment, newStartDateMoment);
    if (newStartDateMoment.isBefore(maxStartDateMoment)) {
      setIsLeftButtonDisabled(true)
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
