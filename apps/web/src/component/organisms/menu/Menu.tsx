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
import styles from "./Menu.module.scss";

export const Menu = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const onLogoutClick = async () => {
    await logout();

    navigate("/signin");
  };

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <div className={styles.user}>
          <Avatar url={user?.avatar_link} size={40} />

          <div className={styles.userData}>
            <span className={styles.nickname}>{user?.nick}</span>
            <span className={styles.mail}>{user?.email}</span>
          </div>
        </div>

        <div className={styles.teams}>
          {user?.teams?.map((team) => (
            <span key={team.id} className={styles.team}>
              {team.name}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.options}>
        <Link to={"/preferences"} className={styles.option}>
          <GearIcon width={24} height={24} />
          Ustawienia
        </Link>

        <Link className={styles.option} to={"/team/create"}>
          <CreateTeamSvg />
          Stwórz Zespół
        </Link>

        <Link className={styles.option} to={"http://newbies.pl"}>
          <AuthorsIcon width={24} height={24} />O autorach
        </Link>

        <Link className={styles.option} to={"/hero"}>
          <InfoCircledIcon width={24} height={24} />O aplikacji
        </Link>

        <Link
          className={styles.option}
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
