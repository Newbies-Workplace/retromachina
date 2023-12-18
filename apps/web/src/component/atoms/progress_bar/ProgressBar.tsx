import React from "react"
import styles from './ProgressBar.module.scss'

interface ProgressBarProps{
    color? : string;
}


export const ProgressBar: React.FC<ProgressBarProps> = ({color="white"}) => {
    
    return (
        <div className={styles.loadingWrapper}>          
            <div className={styles.loading}>
                <div style={{backgroundColor:color}}/>
                <div style={{backgroundColor:color}}/>
                <div style={{backgroundColor:color}}/>
                <div style={{backgroundColor:color}}/>
                <div style={{backgroundColor:color}}/>
                <div style={{backgroundColor:color}}/>
                <div style={{backgroundColor:color}}/>
                <div style={{backgroundColor:color}}/>
            </div>
        </div>
    )  
}