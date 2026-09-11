import type React from "react";
import { Navigate, useParams } from "react-router";
import { PokerContextProvider } from "@/context/poker/PokerContext";

export const PokerWrapper: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) return <Navigate to="/" />;

  return (
    <PokerContextProvider teamId={teamId}>{children}</PokerContextProvider>
  );
};
