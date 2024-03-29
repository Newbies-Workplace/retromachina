import type React from "react";
import { useNavigate } from "react-router";
import NotFoundSvg from "../../assets/images/not-found.svg";
import { Button } from "../../component/atoms/button/Button";
import Navbar from "../../component/organisms/navbar/Navbar";
import styles from "./NotFoundView.module.scss";

export const NotFoundView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <NotFoundSvg />

        <div className={styles.texts}>
          <span>404</span>
          <span style={{ fontSize: 18 }}>Strony nie znaleziono</span>
        </div>

        <Button size={"sm"} onClick={() => navigate("/")}>
          Powrót na stronę główną
        </Button>
      </div>
    </>
  );
};
