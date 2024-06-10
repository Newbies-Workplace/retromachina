import type React from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { Loader } from "../../component/organisms/loader/Loader";
import { setRedirectPath } from "../useRedirect";
import { useUser } from "./UserContext.hook";

interface RequireAuthProps {
  fallback?: JSX.Element;
}

export const RequireAuth: React.FC<
  React.PropsWithChildren<RequireAuthProps>
> = ({ fallback, children }) => {
  const { user, refreshUser } = useUser();
  const [busy, setBusy] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    if (user) return;

    const waitForUser = async () => {
      await refreshUser();
      setBusy(false);
    };

    waitForUser();
  });

  if (busy) {
    return <Loader />;
  }

  if (user) {
    return <>{children}</>;
  }

  if (fallback) {
    return fallback;
  }

  setRedirectPath(pathname);
  return <Navigate to={"/signin"} />;
};
