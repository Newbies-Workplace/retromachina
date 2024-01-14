import React from "react";
import { Navigate, useParams } from "react-router";
import { BoardContextProvider } from "../../context/board/BoardContext";

export const TeamBoardWrapper: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	const { teamId } = useParams<{ teamId: string }>();
	if (!teamId) {
		return <Navigate to={"/"} />;
	}

	return (
		<BoardContextProvider teamId={teamId}>{children}</BoardContextProvider>
	);
};
