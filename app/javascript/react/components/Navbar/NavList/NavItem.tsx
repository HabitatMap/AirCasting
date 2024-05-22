import React, { ReactNode } from "react";
import * as S from "./NavList.style";

interface SubNavItem {
  href: string;
  label: string;
}

interface NavItemProps {
  href: string;
  isNavTitle?: boolean;
  isUnderline?: boolean;
  isActive?: boolean;
  children?: ReactNode;
  subNav?: SubNavItem[];
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  isNavTitle,
  isUnderline,
  isActive,
  children,
  subNav,
}) => (
  <S.ListItem $isUnderline={isUnderline} $isActive={isActive}>
    {isNavTitle ? (
      <S.SubNavTitleLink href={href}>{children}</S.SubNavTitleLink>
    ) : (
      <S.NavItemLink href={href}>{children}</S.NavItemLink>
    )}
    {subNav && (
      <S.SubNav>
        {subNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            isActive={window.location.pathname === item.href}
          >
            {item.label}
          </NavItem>
        ))}
      </S.SubNav>
    )}
  </S.ListItem>
);

export default NavItem;
