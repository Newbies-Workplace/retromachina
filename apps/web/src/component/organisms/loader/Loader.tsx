import styles from './LoadingView.module.scss';
import LogoSvg from '../../../assets/images/logo.svg'
import {ProgressBar} from '../../atoms/progress_bar/ProgressBar'
import React from "react";

export const Loader = () => {
    return (
        <div className={styles.container}>
            <div className={styles.dialog}>
                <div className={styles.text}>
                    <LogoSvg width={400} height={40}/>
                    <span>powered by <a href="http://newbies.pl">Newbies</a></span>
                </div>

                <ProgressBar />
            </div>
        </div>
    );
};
