import { InfoCircledIcon } from "@radix-ui/react-icons";
import { GearIcon } from "@radix-ui/react-icons";
import React from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import AuthorsIcon from "../../../assets/icons/authors.svg";
import BugIcon from "../../../assets/icons/bug-icon.svg";
import CreateTeamSvg from "../../../assets/icons/create-team.svg";
import { useUser } from "../../../context/user/UserContext.hook";
import { Avatar } from "../../atoms/avatar/Avatar";
import { Button } from "../../atoms/button/Button";

export const Menu = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const onLogoutClick = async () => {
    await logout();

    navigate("/signin");
  };

  return (
    <div
      className={
        "absolute top-12 right-4 z-50 flex flex-col gap-4 text-center w-[280px] bg-background-500 rounded-xl shadow-lg "
      }
    >
      <div className={"flex flex-col gap-3 rounded-t-xl p-2 bg-primary-500"}>
        <div className={"flex flex-row items-center gap-2"}>
          <Avatar url={user?.avatar_link} size={40} />

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
                "flex justify-center items-center px-1.5 h-6 text-sm rounded-full bg-background-50"
              }
            >
              {team.name}
            </span>
          ))}
        </div>
      </div>

      <div className={"flex flex-col items-center gap-2 w-full px-2"}>
        <Link
          className={
            "flex flex-row items-center gap-2 w-full text-black cursor-pointer p-2 rounded-xl bg-background-50"
          }
          to={"/preferences"}
        >
          <GearIcon width={24} height={24} />
          Ustawienia
        </Link>

        <Link
          className={
            "flex flex-row items-center gap-2 w-full text-black cursor-pointer p-2 rounded-xl bg-background-50"
          }
          to={"/team/create"}
        >
          <CreateTeamSvg />
          Stwórz Zespół
        </Link>

        <Link
          className={
            "flex flex-row items-center gap-2 w-full text-black cursor-pointer p-2 rounded-xl bg-background-50"
          }
          to={"http://newbies.pl"}
        >
          <AuthorsIcon width={24} height={24} />O autorach
        </Link>

        <Link
          className={
            "flex flex-row items-center gap-2 w-full text-black cursor-pointer p-2 rounded-xl bg-background-50"
          }
          to={"/hero"}
        >
          <InfoCircledIcon width={24} height={24} />O aplikacji
        </Link>

        <Link
          className={
            "flex flex-row items-center gap-2 w-full text-black cursor-pointer p-2 rounded-xl bg-background-50"
          }
          to={
            "mailto:newbies@rst.com.pl?subject=Bug retromachina&body=Opis błędu:"
          }
        >
          <BugIcon width={24} height={24} />
          Zgłoś błąd
        </Link>
      </div>

      <Button
        size="sm"
        className={"mx-2 mb-2"}
        variant={"destructive"}
        onClick={onLogoutClick}
      >
        Wyloguj
      </Button>
    </div>
  );
};
