import React from "react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { RootState } from "../../store";
import { UniformDistributionIcon } from "./UniformDistributionIcon";
import * as S from "./ThresholdConfigurator.style";
import { StatusEnum } from "../../types/api";
import { calculateUniformThresholds } from "../../utils/uniformDistributionThresholdCalc";
import { setUserThresholdValues } from "../../store/thresholdSlice";
import { useMapParams } from "../../utils/mapParamsHandler";

interface UniformDistributionButtonProps {
  hasErrorMessage: (message: string) => void;
}

const UniformDistributionButton = ({
  hasErrorMessage,
}: UniformDistributionButtonProps) => {
  const dispatch = useAppDispatch();
  const { sessionId } = useMapParams();

  const mobileStream = useAppSelector((state: RootState) => state.mobileStream);
  const fixedStream = useAppSelector((state: RootState) => state.fixedStream);

  const onClick = () => {
    let min = 0;
    let max = 0;

    if (
      mobileStream.status === StatusEnum.Fulfilled &&
      mobileStream.data.id === sessionId
    ) {
      min = mobileStream.minMeasurementValue!;
      max = mobileStream.maxMeasurementValue!;
    } else if (
      fixedStream.status === StatusEnum.Fulfilled &&
      fixedStream.data.stream.sessionId === sessionId
    ) {
      min = fixedStream.minMeasurementValue!;
      max = fixedStream.maxMeasurementValue!;
    } else {
      console.log("No stream data available or session mismatch");
      return;
    }

    if (min === max) {
      hasErrorMessage(
        "Can't distribute thresholds when Min and Max values are both the same."
      );
      console.error(
        "While using discrete uniform distribution the Min and Max values cannot both be the same"
      );

      setTimeout(() => {
        hasErrorMessage("");
      }, 3000);

      return;
    } else {
      hasErrorMessage("");
    }

    const thresholds = calculateUniformThresholds(min, max);
    dispatch(setUserThresholdValues(thresholds));
  };

  return (
    <S.UniformDistributionButton onClick={onClick}>
      <UniformDistributionIcon width="10" height="20" />
    </S.UniformDistributionButton>
  );
};

export { UniformDistributionButton };
