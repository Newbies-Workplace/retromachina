import type React from "react";
import { useCallback, useRef, useState } from "react";
import { Portal } from "react-portal";
import { useNavigate } from "react-router";
import lineSvg from "../../../assets/images/line.svg?url";
import { cn } from "../../../common/Util";
import useClickOutside from "../../../context/useClickOutside";
import { useUser } from "../../../context/user/UserContext.hook";
import { Avatar, type AvatarProps } from "../../atoms/avatar/Avatar";
import { Menu } from "../menu/Menu";

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
  const popover = useRef<any>();
  const [isOpen, toggle] = useState(false);
  const close = useCallback(() => toggle(false), []);

  useClickOutside(popover, close);

  return (
    <div className={"flex flex-col gap-2 w-full pb-1 bg-secondary-500"}>
      <div className={"flex flex-row items-center gap-4 w-full"}>
        <span
          onClick={() => navigate("/")}
          className={
            "font-harlow-solid-italic text-4xl text-background-50 cursor-pointer ml-4 mt-2 mr-auto"
          }
        >
          Retromachina
        </span>

        <div
          className={
            "flex justify-end items-center gap-4 overflow-x-hidden pt-2"
          }
        >
          <div className={"flex flex-row justify-end items-start gap-4"}>
            {topContent}
          </div>

          <div
            className={
              "flex justify-center items-center size-10 bg-white rounded-full mr-4 z-20"
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
          backgroundImage: `url(${lineSvg})`,
        }}
      />
    </div>
  );
};

export default Navbar;
