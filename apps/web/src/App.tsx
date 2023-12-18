import React from 'react';
import {AppRouter} from './views/AppRouter';
import {UserContextProvider} from './context/user/UserContext';
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import {ToastContainer} from "react-toastify";

import 'react-toastify/dist/ReactToastify.css';
import "./App.module.scss"

export const App: React.FC = () => {
    dayjs.extend(duration)

    return (
        <DndProvider backend={HTML5Backend}>
            <UserContextProvider>
                <ToastContainer
                    icon={false}
                    closeButton={false}
                    theme={'colored'}
                    position={'bottom-right'}
                    hideProgressBar/>

                <AppRouter />
            </UserContextProvider>
        </DndProvider>
    );
};
