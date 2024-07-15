import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PopupProps } from "reactjs-popup/dist/types";

import calendar from "../../../../assets/icons/calendar.svg";
import copyLinkIcon from "../../../../assets/icons/copyLinkIcon.svg";
import downloadImage from "../../../../assets/icons/download.svg";
import { white } from "../../../../assets/styles/colors";
import { MobileStreamShortInfo as StreamShortInfo } from "../../../../types/mobileStream";
import { Thresholds } from "../../../../types/thresholds";
import { isNoData } from "../../../../utils/measurementsCalc";
import { getColorForValue } from "../../../../utils/thresholdColors";
import { ConfirmationMessage } from "../../atoms/ConfirmationMessage";
import { CopyLinkModal, CopyLinkModalData } from "../../CopyLinkModal";
import { ExportDataModal } from "../../ExportDataModal";
import * as S from "../SessionDetailsModal.style";

interface Extremes {
  minMeasurementValue: number | null;
  maxMeasurementValue: number | null;
  averageValue: number | null;
}

interface ModalDesktopHeaderProps {
  streamShortInfo: StreamShortInfo;
  thresholds: Thresholds;
  extremes: Extremes;
  formattedTime: (time: string) => string;
  streamId: number | null;
  fixedSessionTypeSelected: boolean;
}

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

// Workaround for the typescript error
export const CopyLinkPopup: React.FC<
  CustomPopupProps & Omit<PopupProps, "children">
> = (props) => {
  return <S.SmallPopup {...(props as PopupProps)} />;
};

const ModalDesktopHeader: React.FC<ModalDesktopHeaderProps> = ({
  streamShortInfo,
  thresholds,
  extremes,
  formattedTime,
  streamId,
  fixedSessionTypeSelected,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();

  const { minMeasurementValue, maxMeasurementValue, averageValue } = extremes;
  const noData = isNoData(
    extremes.minMeasurementValue,
    extremes.maxMeasurementValue,
    extremes.averageValue
  );

  const handleCopySubmit = (
    formData: CopyLinkModalData,
    close: { (): void; (): void }
  ) => {
    close();
    setShowConfirmation(true);
  };

  const handleCopyError = (error: Error) => {
    console.error("Error copying link: ", error.message);
    alert(t("alert.linkShortenedFailed"));
  };

  const updateButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    updateButtonPosition();
    window.addEventListener("resize", updateButtonPosition);

    return () => {
      window.removeEventListener("resize", updateButtonPosition);
    };
  }, [buttonRef.current]);

  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => setShowConfirmation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation]);

  useEffect(() => {
    updateButtonPosition();
  }, [showConfirmation]);

  return (
    <S.ModalDesktopHeader>
      <S.Wrapper>
        <S.SessionName>{streamShortInfo.title}</S.SessionName>
        <S.ProfileName>{streamShortInfo.profile}</S.ProfileName>
        <S.SensorName>{streamShortInfo.sensorName}</S.SensorName>
      </S.Wrapper>
      <S.Wrapper>
        {noData ? (
          <S.NoData>{t("sessionDetailsModal.noData")}</S.NoData>
        ) : (
          <>
            <S.AverageValueContainer>
              <S.AverageDot
                $color={getColorForValue(thresholds, averageValue)}
              />
              {t("sessionDetailsModal.averageValue")}
              <S.AverageValue>{averageValue}</S.AverageValue>
              {streamShortInfo.unitSymbol}
            </S.AverageValueContainer>
            <S.MinMaxValueContainer $isMobile={false}>
              <div>
                <S.SmallDot
                  $color={getColorForValue(thresholds, minMeasurementValue)}
                />
                {t("sessionDetailsModal.minValue")}
                <S.Value>{minMeasurementValue}</S.Value>
              </div>
              <div>
                <S.SmallDot
                  $color={getColorForValue(thresholds, maxMeasurementValue)}
                />
                {t("sessionDetailsModal.maxValue")}
                <S.Value>{maxMeasurementValue}</S.Value>
              </div>
            </S.MinMaxValueContainer>
          </>
        )}
        <S.TimeRange>
          {formattedTime(streamShortInfo.startTime ?? "")} -{" "}
          {formattedTime(streamShortInfo.endTime ?? "")}
        </S.TimeRange>
      </S.Wrapper>
      <S.ButtonsContainer>
        {fixedSessionTypeSelected && (
          <S.BlueButton to={`/fixed_stream?streamId=${streamId}`}>
            {t("sessionDetailsModal.calendar")}
            <img src={calendar} alt={t("sessionDetailsModal.calendarIcon")} />
          </S.BlueButton>
        )}
        <S.SmallPopup
          trigger={
            <S.Button aria-labelledby={t("calendarHeader.altExportSession")}>
              <img
                src={downloadImage}
                alt={t("calendarHeader.altExportSession")}
              />
            </S.Button>
          }
          position="top center"
          nested
          closeOnDocumentClick
          offsetX={fixedSessionTypeSelected ? 0 : 40}
          arrowStyle={
            fixedSessionTypeSelected
              ? {}
              : {
                  left: "34%",
                  borderColor: `transparent transparent ${white} transparent`,
                  borderWidth: "0 10px 10px 10px",
                  borderStyle: "solid",
                }
          }
        >
          <ExportDataModal
            sessionId={streamShortInfo.sessionId}
            onSubmit={(formData) => {}}
          />
        </S.SmallPopup>
        <S.WrapperButton ref={buttonRef}>
          <CopyLinkPopup
            trigger={
              <S.Button aria-label={t("copyLinkModal.altCopyLink")}>
                <img src={copyLinkIcon} alt={t("copyLinkModal.copyLink")} />
              </S.Button>
            }
            position="top center"
            nested
            closeOnDocumentClick
          >
            {(close) => (
              <>
                <CopyLinkModal
                  onSubmit={(formData) => handleCopySubmit(formData, close)}
                  onError={handleCopyError}
                />
              </>
            )}
          </CopyLinkPopup>
          {showConfirmation && (
            <S.ConfirmationPopup
              open={showConfirmation}
              closeOnDocumentClick={false}
              arrow={false}
              contentStyle={{
                top: `${buttonPosition.top - 42}px`,
                left: `${buttonPosition.left - 12}px`,
                position: "absolute",
              }}
            >
              <ConfirmationMessage
                message={t("copyLinkModal.confirmationMessage")}
              />
            </S.ConfirmationPopup>
          )}
        </S.WrapperButton>
      </S.ButtonsContainer>
    </S.ModalDesktopHeader>
  );
};

export default ModalDesktopHeader;
