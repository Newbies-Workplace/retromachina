import {
  BugIcon,
  HandshakeIcon,
  InfoIcon,
  RocketIcon,
  SettingsIcon,
} from "lucide-react";
import React from "react";
import { Link, useNavigate } from "react-router";
import { PreferencesDialogContent } from "@/components/organisms/menu/PreferencesDialogContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useUser } from "@/context/user/UserContext.hook";

export const Menu = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const onLogoutClick = async () => {
    await logout();

    navigate("/signin");
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
      className={
        "absolute top-12 right-4 z-50 flex flex-col gap-4 text-center w-70 bg-card rounded-xl shadow-lg "
      }
    >
      <div className={"flex flex-col gap-3 rounded-t-xl p-2 bg-primary"}>
        <div className={"flex flex-row items-center gap-2"}>
          <Avatar>
            <AvatarImage src={user?.avatar_link} />
            <AvatarFallback>:)</AvatarFallback>
          </Avatar>

          <div className={"flex flex-col gap-1 overflow-hidden"}>
            <span
              className={
                "text-start overflow-ellipsis whitespace-nowrap overflow-hidden font-bold text-xl"
              }
            >
              {user?.nick}
            </span>
            <span
              className={
                "text-start overflow-ellipsis whitespace-nowrap overflow-hidden text-lg"
              }
            >
              {user?.email}
            </span>
          </div>
        </div>

        <div className={"flex flex-row gap-2 flex-wrap"}>
          {user?.teams?.map((team) => (
            <span
              key={team.id}
              className={
                "px-1.5 h-6 text-sm rounded-full bg-background text-ellipsis line-clamp-1"
              }
            >
              {team.name}
            </span>
          ))}
        </div>
      </div>

      <div className={"flex flex-col items-center gap-2 w-full px-2"}>
        <Dialog>
          <DialogTrigger
            render={
              <div
                className={
                  "flex flex-row items-center gap-2 w-full cursor-pointer p-2 rounded-xl bg-background"
                }
              >
                <SettingsIcon className={"size-4"} />
                Ustawienia
              </div>
            }
          />

          <PreferencesDialogContent />
        </Dialog>

        <Link
          className={
            "flex flex-row items-center gap-2 w-full cursor-pointer p-2 rounded-xl bg-background"
          }
          to={"/team/create"}
        >
          <HandshakeIcon className={"size-4"} />
          Stwórz Zespół
        </Link>

        <Link
          className={
            "flex flex-row items-center gap-2 w-full cursor-pointer p-2 rounded-xl bg-background"
          }
          to={"http://newbies.pl"}
        >
          <RocketIcon className={"size-4"} />O autorach
        </Link>

        <Link
          className={
            "flex flex-row items-center gap-2 w-full cursor-pointer p-2 rounded-xl bg-background"
          }
          to={"/hero"}
        >
          <InfoIcon className={"size-4"} />O aplikacji
        </Link>

        <Link
          className={
            "flex flex-row items-center gap-2 w-full cursor-pointer p-2 rounded-xl bg-background"
          }
          to={
            "mailto:newbies@rst.com.pl?subject=Bug retromachine&body=Opis błędu:"
          }
        >
          <BugIcon className={"size-4"} />
          Zgłoś błąd
        </Link>
      </div>

      <Button
        className={"mx-2 mb-2"}
        variant={"destructive"}
        onClick={onLogoutClick}
      >
        Wyloguj
      </Button>
    </div>
  );
};
