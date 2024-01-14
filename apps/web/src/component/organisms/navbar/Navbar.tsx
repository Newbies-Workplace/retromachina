import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import LogoSvg from "../../../assets/images/logo.svg";
import useClickOutside from "../../../context/useClickOutside";
import { useUser } from "../../../context/user/UserContext.hook";
import { Avatar, AvatarProps } from "../../atoms/avatar/Avatar";
import { Menu } from "../menu/Menu";
import styles from "./Navbar.module.scss";

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
		<div className={styles.navbar}>
			<div className={styles.topSection}>
				<div className={styles.name}>
					<LogoSvg
						onClick={() => navigate("/")}
						style={{ cursor: "pointer" }}
					/>
				</div>

				<div className={styles.topContainer}>
					{topContent}

					<div className={styles.profile}>
						<div onClick={() => toggle(true)}>
							<Avatar
								style={{ cursor: "pointer" }}
								url={user?.avatar_link!}
								{...avatarProps}
							/>

							{isOpen && (
								<div className={styles.bubbleContainer} ref={popover}>
									<Menu />
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{!!children && <div className={styles.bottomSection}>{children}</div>}

			<div className={styles.line} />
		</div>
	);
};

export default Navbar;
