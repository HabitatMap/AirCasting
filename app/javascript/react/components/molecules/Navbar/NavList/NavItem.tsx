import React, { ReactNode } from "react";
import * as S from "./NavList.style";

interface SubNavItem {
  href: string;
  label: string;
  onClick?: () => void;
}

interface NavItemProps {
  href: string;
  isNavTitle?: boolean;
  isActive?: boolean;
  children?: ReactNode;
  subNav?: SubNavItem[];
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  isNavTitle,
  isActive,
  children,
  subNav,
  onClick,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <S.ListItem $isActive={isActive}>
      {isNavTitle ? (
        href ? (
          <S.SubNavTitleLink href={href} onClick={handleClick}>
            {children}
          </S.SubNavTitleLink>
        ) : (
          <S.SubNavTitle>{children}</S.SubNavTitle>
        )
      ) : href ? (
        <S.NavItemLink href={href} onClick={handleClick}>
          {children}
        </S.NavItemLink>
      ) : (
        <S.NavItemText>{children}</S.NavItemText>
      )}
      {subNav && (
        <S.SubNav>
          {subNav.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              isActive={window.location.pathname === item.href}
              onClick={item.onClick}
            >
              {item.label}
            </NavItem>
          ))}
        </S.SubNav>
      )}
    </S.ListItem>
  );
};

export default NavItem;
