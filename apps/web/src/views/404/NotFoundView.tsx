import React from "react";
import {Button} from "../../component/atoms/button/Button";
import {useNavigate} from "react-router";
import styles from "./NotFoundView.module.scss"
import Navbar from "../../component/organisms/navbar/Navbar";
import NotFoundSvg from "../../assets/images/not-found.svg";

export const NotFoundView: React.FC = () => {
    const navigate = useNavigate()

    return (
        <>
            <Navbar/>

            <div className={styles.container}>
                <NotFoundSvg />

                <div className={styles.texts}>
                    <span>404</span>
                    <span style={{fontSize: 18}}>Strony nie znaleziono</span>
                </div>

                <Button size={'small'} onClick={() => navigate("/")}>
                    Powrót na stronę główną
                </Button>
            </div>
        </>
    )
}