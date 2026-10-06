import type React from "react";
import { Navigate, useParams } from "react-router";
import { GramophoneContextProvider } from "@/context/gramophone/GramophoneContext";
import { PokerContextProvider } from "@/context/poker/PokerContext";

export const PokerWrapper: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) return <Navigate to="/" />;

  return (
    <GramophoneContextProvider>
      <PokerContextProvider teamId={teamId}>{children}</PokerContextProvider>
    </GramophoneContextProvider>
  );
};
