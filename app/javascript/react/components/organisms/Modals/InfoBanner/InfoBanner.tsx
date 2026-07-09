import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import closeIcon from "../../../../assets/icons/closeButton.svg";
import habitatMapLogo from "../../../../assets/icons/habitatMapLogo.svg";
import { BlogPost } from "./config";
import {
  pickPost,
  recordClicked,
  recordDismissed,
  recordShown,
  shouldShow,
} from "./logic";
import * as S from "./InfoBanner.style";

const InfoBanner: React.FC = () => {
  const { t } = useTranslation();
  // Decide once on mount so the roll/pick is stable for this page load.
  const [post, setPost] = useState<BlogPost | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    if (shouldShow()) {
      setPost(pickPost());
    }
  }, []);

  useEffect(() => {
    if (post && !recorded.current) {
      recorded.current = true;
      recordShown(post);
    }
  }, [post]);

  if (!post) return null;

  const handleDismiss = () => {
    recordDismissed();
    setPost(null);
  };

  const handleClick = () => {
    recordClicked();
  };

  const hasImage = Boolean(post.image);

  const logo = (
    <img src={habitatMapLogo} alt={t("infoBanner.habitatMapAlt")} />
  );
  const closeButton = (
    <S.CloseButton
      $onImage={hasImage}
      onClick={handleDismiss}
      aria-label={t("infoBanner.dismiss")}
    >
      <img src={closeIcon} alt="" />
    </S.CloseButton>
  );

  return (
    <S.BannerWrapper
      $compact={!hasImage}
      role="complementary"
      aria-label={t("infoBanner.ariaLabel")}
    >
      {hasImage ? (
        <S.Thumb>
          <img src={post.image} alt="" decoding="async" />
          <S.HabitatBadge $onImage>{logo}</S.HabitatBadge>
          {closeButton}
        </S.Thumb>
      ) : (
        <S.Accent />
      )}

      <S.Body>
        {!hasImage && (
          <S.TopRow>
            <S.HabitatBadge>{logo}</S.HabitatBadge>
            {closeButton}
          </S.TopRow>
        )}
        <S.Kicker>{t("infoBanner.kicker")}</S.Kicker>
        <S.Title>{post.title}</S.Title>
        <S.ReadLink
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
        >
          {t("infoBanner.readMore")}
        </S.ReadLink>
      </S.Body>
    </S.BannerWrapper>
  );
};

export { InfoBanner };
