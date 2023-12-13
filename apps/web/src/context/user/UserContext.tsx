import React, { createContext, useEffect, useState } from "react";
import { axiosInstance } from "../../api/AxiosInstance";
import { getMyUser } from "../../api/user/User.service";
import {UserResponse} from "../../api/user/User.interfaces";
import {AuthParams} from "../../api/auth/Auth.interface";
import {loginGoogle} from "../../api/auth/Auth.service";

interface UserContext {
    user: UserResponse | null,
    refreshUser: () => Promise<void>,
    login: (params: AuthParams) => Promise<void>
}

export const UserContext = createContext<UserContext>({
    user: null,
    refreshUser: () => { return Promise.reject() },
    login: () => { return Promise.reject() }
});

export const UserContextProvider: React.FC<any> = ({ children }) => {
    const [user, setUser] = useState<UserResponse | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('Bearer');

        if (token && !user) {
            refreshUser();
        }
    },[])

    const refreshUser = () => {
        return getMyUser()
            .then((response) => {
                setUser(response)
            })
            .catch((error) => {
                if (error.status == 401) {
                    setUser(null);
                } else {
                    console.error(error);
                }
            });
    }

    const login = (params: AuthParams) => {
        return loginGoogle(params)
            .then((res) => {
                localStorage.setItem("Bearer", res.access_token);

                axiosInstance.defaults.headers["Authorization"] = "Bearer " + res.access_token;
                getMyUser()
                    .then((response) => {
                        setUser(response);
                    });
            })
            .catch((err) => {
                console.log(err);
            });
    }

    return(
        <UserContext.Provider
            value={{
                user: user,
                refreshUser: refreshUser,
                login: login,
            }}>
            {children}
        </UserContext.Provider>
    );
};