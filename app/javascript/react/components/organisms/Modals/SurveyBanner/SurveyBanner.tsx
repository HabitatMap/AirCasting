import React, { useEffect, useState } from "react";

import closeIcon from "../../../../assets/icons/closeButton.svg";
import heroImage from "../../../../assets/images/airbeam-mini-hero.webp";
import * as S from "./SurveyBanner.style";

const SURVEY_URL = "https://tally.so/r/XxB9DP";
const SURVEY_END_DATE = new Date("2026-05-07T23:59:59Z");
const DISMISSED_KEY = "aircasting_survey_dismissed_date";
const TAKEN_KEY = "aircasting_survey_taken";

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage disabled / quota — ignore */
  }
};

const shouldShow = () => {
  if (Date.now() > SURVEY_END_DATE.getTime()) return false;
  if (safeGet(TAKEN_KEY) !== null) return false;
  if (safeGet(DISMISSED_KEY) === todayKey()) return false;
  return true;
};

const SurveyBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(shouldShow);

  useEffect(() => {
    if (!isOpen) return;
    const reactApp = document.getElementById("react-app");
    reactApp?.setAttribute("inert", "");
    const firstFocusable = document.querySelector<HTMLElement>(
      "#popup-root button, #popup-root a"
    );
    firstFocusable?.focus();
    return () => reactApp?.removeAttribute("inert");
  }, [isOpen]);

  if (!isOpen) return null;

  const dismiss = () => {
    safeSet(DISMISSED_KEY, todayKey());
    setIsOpen(false);
  };

  const takeSurvey = () => {
    safeSet(TAKEN_KEY, "1");
    setIsOpen(false);
  };

  return (
    <S.SurveyPopup
      open={isOpen}
      modal
      nested
      closeOnDocumentClick={false}
      closeOnEscape={false}
      overlayStyle={{ zIndex: 1100 }}
    >
      <S.Hero>
        <img src={heroImage} alt="AirBeam Mini" decoding="async" />
        <S.CloseButton onClick={dismiss} aria-label="Close">
          <img src={closeIcon} alt="" />
        </S.CloseButton>
      </S.Hero>

      <S.Body>
        <S.Title>Help shape AirCasting</S.Title>
        <S.Description>
          We're rebuilding the mobile app with you in mind. Take our short
          survey to share what's working — and what isn't.
        </S.Description>

        <S.Actions>
          <S.PrimaryButton
            as="a"
            href={SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={takeSurvey}
          >
            Take the survey →
          </S.PrimaryButton>
        </S.Actions>
      </S.Body>
    </S.SurveyPopup>
  );
};

export { SurveyBanner };
