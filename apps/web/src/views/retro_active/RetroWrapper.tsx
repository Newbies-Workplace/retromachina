import type React from "react";
import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { RetroService } from "@/api/Retro.service";
import { RetroContextProvider } from "@/context/retro/RetroContext";

export const RetroWrapper: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { retroId } = useParams<{ retroId: string }>();

  useEffect(() => {
    if (retroId) {
      RetroService.getRetroByRetroId(retroId).then((retro) => {
        if (!retro.is_running) {
          navigate(`/retro/${retroId}/summary`);
        }
      });
    }
  }, [retroId, navigate]);

  if (!retroId) {
    return <Navigate to={"/"} />;
  }

  return (
    <RetroContextProvider retroId={retroId}>{children}</RetroContextProvider>
  );
};
