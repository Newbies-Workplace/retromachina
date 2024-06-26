import type React from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { Loader } from "../../component/organisms/loader/Loader";
import { setRedirectPath } from "../useRedirect";
import { useUser } from "./UserContext.hook";

interface RequireAuthProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  fallback,
  children,
}) => {
  const { user, isFetchingUser } = useUser();
  const { pathname } = useLocation();

  if (user) {
    return <>{children}</>;
  }

  if (isFetchingUser) {
    return <Loader />;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  setRedirectPath(pathname);
  return <Navigate to={"/signin"} />;
};
