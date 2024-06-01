import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { AuthParams } from "shared/model/auth/Auth.interface";
import { Loader } from "../../../component/organisms/loader/Loader";
import { getRedirectPath, setRedirectPath } from "../../../context/useRedirect";
import { useUser } from "../../../context/user/UserContext.hook";

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
