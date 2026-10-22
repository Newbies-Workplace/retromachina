import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import type { AuthParams } from "shared/model/auth/Auth.interface";
import { Loader } from "@/components/organisms/loader/Loader";
import { useUser } from "@/context/user/UserContext.hook";
import { getRedirectPath, setRedirectPath } from "@/hooks/useRedirect";

export const LoadingView = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );

    login({ ...(params as unknown as AuthParams) })
      .then(() => {
        const redirectPath = getRedirectPath();
        setRedirectPath(null);

        if (
          redirectPath &&
          new URL(redirectPath).origin !== window.location.origin
        )
          window.location.replace(redirectPath);
        else {
          const url = redirectPath ? new URL(redirectPath) : null;
          navigate(url ? url.pathname + url.search + url.hash : "/");
        }
      })
      .catch();
  }, [login, navigate]);

  return <Loader />;
};
