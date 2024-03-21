import type React from "react";
import { useNavigate } from "react-router";
import CreateTeamSvg from "../../assets/icons/create-team.svg";
import NotFoundSvg from "../../assets/images/not-found.svg";
import { Button } from "../../component/atoms/button/Button";
import { TeamRetroList } from "../../component/molecules/team_retro_list/TeamRetroList";
import Navbar from "../../component/organisms/navbar/Navbar";
import { useUser } from "../../context/user/UserContext.hook";
import styles from "./HomeView.module.scss";

const HomeView: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {user?.teams?.length === 0 && (
          <div className={styles.noTeam}>
            <NotFoundSvg />

            <div className={styles.text}>
              <span>Nie jesteś członkiem żadnego Zespołu!</span>
              <span style={{ fontSize: 18 }}>
                Stwórz nowy zespół lub poczekaj na zaproszenie od innego członka
                retromachiny!
              </span>
              <Button onClick={() => navigate("/team/create")} size="small">
                <CreateTeamSvg />
                Stwórz Zespół
              </Button>
            </div>
          </div>
        )}

        <div className={styles.teams}>
          {user?.teams?.map((team) => (
            <TeamRetroList
              key={team.id}
              teamId={team.id}
              teamName={team.name}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default HomeView;
