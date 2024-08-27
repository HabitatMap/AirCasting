import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import closeImage from "../../../assets/icons/closeButton.svg";
import { SessionsListTile } from "../SessionsListTile/SessionListTile";
import { SessionListEntity } from "../SessionsListView";
import * as S from "./MobileSessionList.style";

interface MobileSessionListProps {
  sessions: SessionListEntity[];
  onCellClick?: (id: number, streamId: number) => void;
  onClose: () => void;
  onScrollEnd?: () => void;
  fetchableSessionsCount: number;
}

const MobileSessionList: React.FC<MobileSessionListProps> = ({
  sessions,
  onCellClick,
  onClose,
  onScrollEnd,
  fetchableSessionsCount,
}) => {
  const { t } = useTranslation();
  const sessionListRef = useRef<HTMLDivElement>(null);

  const results = sessions.length;

  const handleClick = (id: number, streamId: number) => {
    if (onCellClick) {
      onCellClick(id, streamId);
    }
  };

  useEffect(() => {
    const listInnerElement = sessionListRef.current;

    if (listInnerElement) {
      const onScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = listInnerElement;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (isNearBottom && onScrollEnd) {
          onScrollEnd();
        }
      };

      listInnerElement.addEventListener("scroll", onScroll);

      return () => {
        listInnerElement.removeEventListener("scroll", onScroll);
      };
    }
  }, [onScrollEnd]);

  return (
    <S.Overlay>
      <S.VerticalContainer>
        <S.HorizontalContainer>
          <S.ImageButton onClick={onClose}>
            <S.Image src={closeImage} alt={t("map.altClose")} />
          </S.ImageButton>
          <S.Title>
            {t("map.mobileResults", { results, fetchableSessionsCount })}
          </S.Title>
        </S.HorizontalContainer>
        <S.SessionListStyled ref={sessionListRef}>
          {sessions.map((session, index) => (
            <div key={index}>
              <SessionsListTile
                id={session.id}
                sessionName={session.sessionName}
                sensorName={session.sensorName}
                averageValue={session.averageValue}
                startTime={session.startTime}
                endTime={session.endTime}
                streamId={session.streamId}
                onClick={(id, streamId) => {
                  handleClick(id, streamId);
                }}
              />
            </div>
          ))}
        </S.SessionListStyled>
      </S.VerticalContainer>
    </S.Overlay>
  );
};

export { MobileSessionList };
