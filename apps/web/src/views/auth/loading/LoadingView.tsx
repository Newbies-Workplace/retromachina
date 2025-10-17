import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { AuthParams } from "shared/model/auth/Auth.interface";
import { Loader } from "@/components/organisms/loader/Loader";
import { useUser } from "@/context/user/UserContext.hook";
import { getRedirectPath, setRedirectPath } from "@/hooks/useRedirect";

export const LoadingView = () => {
  const { login } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );

    login({ ...(params as unknown as AuthParams) })
      .then(() => {
        const redirectPath = getRedirectPath();
        setRedirectPath(null);

        navigate(redirectPath ?? "/");
      })
      .catch();
  }, []);

  return <Loader />;
};
