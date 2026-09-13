import React, { useState } from "react";
import { useNavigate } from "react-router";
import lineSvg from "@/assets/images/line.svg?inline";
import { Menu } from "@/components/organisms/menu/Menu";
import { PreferencesDialogContent } from "@/components/organisms/menu/PreferencesDialogContent";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  AvatarStatus,
} from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  return (
    <header
      className={
        "sticky top-0 left-0 z-30 flex shrink-0 flex-col gap-2 w-full pb-1 bg-secondary shadow-sm"
      }
    >
      <div
        className={
          "flex h-[58px] min-h-[58px] w-full flex-row items-center gap-3 px-3 sm:px-4"
        }
      >
        <button
          type="button"
          aria-label="Przejdź do strony głównej"
          onClick={() => navigate("/")}
          className={
            "font-harlow-solid-italic text-3xl text-secondary-foreground cursor-pointer mr-auto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          }
        >
          Retromachine
        </button>

        <div className={"flex h-full items-center justify-end gap-4"}>
          <div className={"flex h-full flex-row items-start justify-end gap-4"}>
            {topContent}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Otwórz menu konta"
                className="z-20 flex size-9 cursor-pointer items-center justify-center rounded-full bg-background outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <AvatarGroup>
                  <Avatar>
                    <AvatarImage src={user?.avatar_link} />
                    <AvatarFallback>:)</AvatarFallback>
                    {avatarProps?.isReady && <AvatarStatus />}
                  </Avatar>
                </AvatarGroup>
              </button>
            </DropdownMenuTrigger>
            <Menu onOpenPreferences={() => setPreferencesOpen(true)} />
          </DropdownMenu>

          <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
            <PreferencesDialogContent />
          </Dialog>
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
    </header>
  );
};

export default Navbar;
