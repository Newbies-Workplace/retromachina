import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
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
    <div className={"flex flex-col gap-2 py-1 w-full bg-secondary-500"}>
      <div className={"flex flex-row items-center w-full"}>
        <div className={"flex flex-col ml-4"}>
          <span
            onClick={() => navigate("/")}
            className={
              "font-harlow-solid-italic text-xl md:text-3xl xl:text-5xl text-background-50 cursor-pointer"
            }
          >
            Retromachina
          </span>
        </div>

        <div className={"flex justify-end items-center gap-4 w-full"}>
          {topContent}

          <div
            className={
              "flex justify-center items-center size-10 bg-white rounded-full mr-4"
            }
          >
            <div onClick={() => toggle(true)}>
              <Avatar
                className={"cursor-pointer"}
                url={user?.avatar_link!}
                {...avatarProps}
              />

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={"relative z-10"}
                    ref={popover}
                  >
                    <Menu />
                  </motion.div>
                )}
              </AnimatePresence>
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
          backgroundImage: "url(/assets/images/line.svg)",
        }}
      />
    </div>
  );
};

export default Navbar;
