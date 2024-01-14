import React from "react";
import { Button } from "../../atoms/button/Button";
import styles from "./RetroCard.module.scss";

interface RetroCardProps {
	onClick(): void;
}

export const ActiveRetroCard: React.FC<RetroCardProps> = ({ onClick }) => {
	return (
		<Button className={styles.wrapper} onClick={onClick}>
			Retro właśnie trwa
		</Button>
	);
};
