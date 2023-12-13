import React from 'react';
import GoogleButton from 'react-google-button';
import styles from './SignInView.module.scss';
import LogoSvg from '../../../assets/images/logo.svg'

export const SignInView: React.FC = () => {
    const href = `${process.env.RETRO_API_URL}google/redirect`

    return (
        <div className={styles.container}>
            <div className={styles.dialog}>
                <div className={styles.text}>
                    <LogoSvg width={400} height={40}/>
                    <span>powered by <a href="http://newbies.pl">Newbies</a></span>
                </div>

                <div className={styles.bottom}>
                    <a href={href}>
                        <GoogleButton className={styles.googleBtn} />
                    </a>

                    <span className={styles.privacy}>
                        Korzystając z Retromachiny akceptujesz<br/>
                        <a href={"/privacy"}>politykę prywatności</a>
                    </span>
                </div>
            </div>
        </div>
    );
};