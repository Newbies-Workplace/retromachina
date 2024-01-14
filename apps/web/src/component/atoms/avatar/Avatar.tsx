import cs from "classnames";
import React from "react";
import styles from "./Avatar.module.scss";

export type AvatarProps = {
	className?: string;
	size?: number;
	style?: React.CSSProperties;
	variant?: "inactive" | "active" | "ready";
	url: string;
};

export const Avatar: React.FC<AvatarProps> = ({
	variant = "active",
	size = 40,
	style,
	url,
	className,
}) => {
	return (
		<div style={style} className={className}>
			<img
				referrerPolicy="no-referrer"
				src={url}
				style={{
					width: size,
					height: size,
					minWidth: size,
					minHeight: size,
				}}
				alt={"avatar"}
				className={cs(styles.circle, styles[variant], styles.photo)}
			/>

			{variant === "ready" && (
				<div className={styles.readyDotHolder}>
					<div className={styles.readyDot} />
				</div>
			)}
		</div>
	);
};
