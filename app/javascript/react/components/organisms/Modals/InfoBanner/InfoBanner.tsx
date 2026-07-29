import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import closeIcon from "../../../../assets/icons/closeButton.svg";
import habitatMapLogo from "../../../../assets/icons/habitatMapLogo.svg";
import { trackBannerEvent } from "../../../../utils/trackBannerEvent";
import { BannerVariant, BlogPost } from "./config";
import {
  pickPost,
  pickVariant,
  recordClicked,
  recordDismissed,
  recordShown,
  shouldShow,
  withRef,
} from "./logic";
import * as S from "./InfoBanner.style";

const InfoBanner: React.FC = () => {
  const { t } = useTranslation();
  // Decide once on mount so the roll/pick is stable for this page load.
  const [post, setPost] = useState<BlogPost | null>(null);
  const [variant, setVariant] = useState<BannerVariant | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    if (shouldShow()) {
      setVariant(pickVariant());
      setPost(pickPost());
    }
  }, []);

  useEffect(() => {
    if (post && variant && !recorded.current) {
      recorded.current = true;
      recordShown(post);
      trackBannerEvent({
        event: "banner_shown",
        variant,
        postSlug: post.postSlug,
      });
    }
  }, [post, variant]);

  if (!post || !variant) return null;

  // Canonical join key shared with HabitatMap (= their page.slug).
  const postSlug = post.postSlug;

  const handleDismiss = () => {
    recordDismissed();
    trackBannerEvent({ event: "banner_dismissed", variant, postSlug });
    setPost(null);
  };

  const handleClick = () => {
    recordClicked();
    trackBannerEvent({ event: "banner_clicked", variant, postSlug });
  };

  const href = withRef(post.url, variant, postSlug);

  const logo = (
    <img src={habitatMapLogo} alt={t("infoBanner.habitatMapAlt")} />
  );

  const closeButton = (onImage: boolean) => (
    <S.CloseButton
      $onImage={onImage}
      onClick={handleDismiss}
      aria-label={t("infoBanner.dismiss")}
    >
      <img src={closeIcon} alt="" />
    </S.CloseButton>
  );

  // --- Minimal variant: whole card is one clickable link, no image/button ---
  if (variant === "minimal") {
    return (
      <S.MinimalBanner
        role="complementary"
        aria-label={t("infoBanner.ariaLabel")}
      >
        <S.Accent />
        <S.Body>
          <S.MinimalTop>
            <S.HabitatBadge>{logo}</S.HabitatBadge>
            {closeButton(false)}
          </S.MinimalTop>
          <S.Kicker>{t("infoBanner.kicker")}</S.Kicker>
          <S.MinimalLink
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
          >
            <S.Title>{post.title}</S.Title>
          </S.MinimalLink>
        </S.Body>
      </S.MinimalBanner>
    );
  }

  // --- Full variant (default): image when available + read-more button ------
  const hasImage = Boolean(post.image);

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
          {closeButton(true)}
        </S.Thumb>
      ) : (
        <S.Accent />
      )}

      <S.Body>
        {!hasImage && (
          <S.TopRow>
            <S.HabitatBadge>{logo}</S.HabitatBadge>
            {closeButton(false)}
          </S.TopRow>
        )}
        <S.Kicker>{t("infoBanner.kicker")}</S.Kicker>
        <S.Title>{post.title}</S.Title>
        <S.ReadLink
          href={href}
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
