import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import type { AuthParams } from "shared/model/auth/Auth.interface";
import { toast } from "sonner";
import { Loader } from "@/components/organisms/loader/Loader";
import { useUser } from "@/context/user/UserContext.hook";
import { getRedirectPath, setRedirectPath } from "@/hooks/useRedirect";

export const LoadingView = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const loginPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let active = true;
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );

    loginPromise.current ??= login({
      ...(params as unknown as AuthParams),
    });

    void loginPromise.current
      .then(() => {
        if (!active) return;
        const redirectPath = getRedirectPath();
        setRedirectPath(null);
        navigate(redirectPath ?? "/");
      })
      .catch((error: unknown) => {
        if (active) {
          console.error("Google login failed", error);
          toast.error("Nie udało się zalogować. Spróbuj ponownie.");
          navigate("/signin", { replace: true });
        }
      });

    return () => {
      active = false;
    };
  }, [login, navigate]);

  return <Loader />;
};
