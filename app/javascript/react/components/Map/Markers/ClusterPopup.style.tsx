import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

interface ClusterPopupProps {
  data?: {
    lastHourAvg: number;
    instrumentsCount: number;
    measurementsCount: number;
    contributorsCount: number;
  };
  position?: {
    lat: () => number;
    lng: () => number;
  };
  onClose: () => void;
}
const { t } = useTranslation();

const PopupContainer = styled.div<{ top: string; left: string }>`
  position: absolute;
  transform: translate(-50%, -100%);
  background-color: #fff;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  top: ${(props) => props.top};
  left: ${(props) => props.left};
`;

const CloseButton = styled.button`
  float: right;
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
`;

const ClusterPopup: React.FC<ClusterPopupProps> = ({
  data,
  position,
  onClose,
}) => {
  if (!data || !position) return null;

  const style = {
    top: `${position.lat()}px`,
    left: `${position.lng()}px`,
  };

  return (
    <PopupContainer top={style.top} left={style.left}>
      <CloseButton onClick={onClose}>&times;</CloseButton>
      <div>
        {/* The unit is hardcoded for time being */}
        <p>
          {t("clusters.avg")} {data.lastHourAvg}
          {t("clusters.unit")}
        </p>
        <p>
          {data.instrumentsCount} {t("clusters.instruments")}
        </p>
        <p>
          {data.measurementsCount} {t("clusters.measurements")}
        </p>
        <p>
          {data.contributorsCount} {t("clusters.contributors")}
        </p>
      </div>
    </PopupContainer>
  );
};

export default ClusterPopup;
