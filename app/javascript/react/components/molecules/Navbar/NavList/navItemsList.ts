import { urls } from "../../../../const/urls";

export const navItems = [
  {
    isNavTitle: true,
    href: urls.airbeam,
    label: "navbar.sections.airbeam",
    subNav: [
      {
        href: urls.userStories,
        label: "navbar.sections.userStories",
      },
      {
        href: urls.airbeamHowItWorks,
        label: "navbar.sections.howItWorks",
      },
      {
        href: urls.faq,
        label: "navbar.sections.faq",
      },
      {
        href: urls.usersGuide,
        label: "navbar.sections.usersGuide",
      },
      {
        href: urls.airbeamMiniUsersGuide,
        label: "navbar.sections.airbeamMiniUsersGuide",
      },
      {
        href: urls.airbeamBuyNow,
        label: "navbar.sections.airbeamBuyNow",
      },
    ],
  },
  {
    isNavTitle: true,
    href: urls.aircasting,
    label: "navbar.sections.aircasting",
    subNav: [
      {
        href: urls.map,
        label: "navbar.sections.maps",
      },
      {
        href: urls.android,
        label: "navbar.sections.androidApp",
      },
      {
        href: urls.iOS,
        label: "navbar.sections.iOSApp",
      },
      {
        href: urls.actions,
        label: "navbar.sections.actions",
      },
    ],
  },
  {
    isNavTitle: true,
    href: urls.about,
    label: "navbar.sections.about",
    subNav: [
      {
        href: urls.history,
        label: "navbar.sections.history",
      },
      {
        href: urls.press,
        label: "navbar.sections.press",
      },
      {
        href: urls.blog,
        label: "navbar.sections.blog",
      },
    ],
  },
  {
    isNavTitle: true,
    href: urls.privacy,
    label: "navbar.sections.privacy",
    subNav: [
      {
        href: "#",
        label: "navbar.sections.ein",
      },
    ],
  },
];
