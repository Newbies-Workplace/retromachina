import React, { useState } from "react";
import { Portal } from "react-portal";
import { useNavigate } from "react-router";
import lineSvg from "@/assets/images/line.svg?inline";
import { Backdrop } from "@/components/molecules/backdrop/Backdrop";
import { Menu } from "@/components/organisms/menu/Menu";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  AvatarStatus,
} from "@/components/ui/avatar";
import { useUser } from "@/context/user/UserContext.hook";
import { cn } from "@/lib/utils";

interface NavbarProps {
  avatarProps?: {
    isReady?: boolean;
  };
  topContent?: React.ReactNode;
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
  children,
  topContent,
  avatarProps,
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={"flex flex-col gap-2 w-full pb-1 bg-secondary"}>
      <div className={"flex flex-row items-center gap-4 w-full h-[50px]"}>
        <span
          onClick={() => navigate("/")}
          className={
            "font-harlow-solid-italic text-3xl text-secondary-foreground cursor-pointer ml-4 mt-1 mr-auto"
          }
        >
          Retromachine
        </span>

        <div className={"flex justify-end items-center gap-4"}>
          <div className={"flex flex-row justify-end items-start gap-4"}>
            {topContent}
          </div>

          <div
            className={
              "flex justify-center items-center size-8 bg-white rounded-full mr-4 z-20"
            }
          >
            <AvatarGroup onClick={() => setIsMenuOpen((value) => !value)}>
              <Avatar className={"cursor-pointer"}>
                <AvatarImage src={user?.avatar_link} />
                <AvatarFallback>:)</AvatarFallback>
                {avatarProps?.isReady && <AvatarStatus />}
              </Avatar>
            </AvatarGroup>
            <Portal>
              {isMenuOpen && (
                <Backdrop
                  hasDarkBackground={false}
                  onDismiss={() => {
                    setIsMenuOpen(false);
                  }}
                >
                  <Menu />
                </Backdrop>
              )}
            </Portal>
          </div>
        </div>
      </div>

      {!!children && (
        <div
          className={"flex justify-center items-center overflow-hidden w-full"}
        >
          {children}
        </div>
      )}

      <div
        className={cn("w-full h-1.5 bg-repeat-x mt-auto")}
        style={{
          backgroundImage: `url("${lineSvg}")`,
        }}
      />
    </div>
  );
};

export default Navbar;
