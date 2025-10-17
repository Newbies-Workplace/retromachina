import React, { createRef, useCallback, useState } from "react";
import { Portal } from "react-portal";
import { useNavigate } from "react-router";
import lineSvg from "@/assets/images/line.svg?inline";
import { Avatar, type AvatarProps } from "@/components/atoms/avatar/Avatar";
import { Menu } from "@/components/organisms/menu/Menu";
import { useUser } from "@/context/user/UserContext.hook";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

interface NavbarProps {
  avatarProps?: Partial<AvatarProps>;
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
  const popover = createRef<HTMLDivElement>();
  const [isOpen, toggle] = useState(false);
  const close = useCallback(() => toggle(false), []);

  useClickOutside(popover, close);

  return (
    <div className={"flex flex-col gap-2 w-full pb-1 bg-secondary-500"}>
      <div className={"flex flex-row items-center gap-4 w-full"}>
        <span
          onClick={() => navigate("/")}
          className={
            "font-harlow-solid-italic text-3xl text-background-50 cursor-pointer ml-4 mt-1 mr-auto"
          }
        >
          Retromachina
        </span>

        <div
          className={"flex justify-end items-center gap-4 overflow-hidden pt-1"}
        >
          <div className={"flex flex-row justify-end items-start gap-4"}>
            {topContent}
          </div>

          <div
            className={
              "flex justify-center items-center size-8 bg-white rounded-full mr-4 z-20"
            }
          >
            <div onClick={() => toggle(true)}>
              <Avatar
                className={"cursor-pointer"}
                url={user?.avatar_link}
                {...avatarProps}
              />
              <Portal>
                {isOpen && (
                  <div ref={popover}>
                    <Menu />
                  </div>
                )}
              </Portal>
            </div>
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
        className={cn("w-full h-1 bg-repeat-x")}
        style={{
          backgroundImage: `url("${lineSvg}")`,
        }}
      />
    </div>
  );
};

export default Navbar;
