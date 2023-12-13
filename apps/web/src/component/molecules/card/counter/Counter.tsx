import React from "react";
import AddIcon from "../../../../assets/icons/add-icon.svg";
import MinusIcons from "../../../../assets/icons/minus-icon.svg";
import styles from "./Counter.module.scss";
import cs from "classnames";

interface CounterProps {
    canIncrement: boolean;
    count: number;
    onIncrement(): void;
    onDecrement(): void;
    style?: React.CSSProperties;
}

const Counter: React.FC<CounterProps> = (
    {
        count,
        canIncrement,
        onIncrement,
        onDecrement,
        style,
    }
) => {
    const onMinusClick = () => {
        if (count > 0) {
            onDecrement();
        }
    };

    const onPlusClick = () => {
        if (canIncrement) {
            onIncrement();
        }
    };

    return (
        <div className={styles.wrapper} style={style}>
            <MinusIcons
                onClick={onMinusClick}
                className={cs(styles.action, {
                    [styles.inactive]: count <= 0,
                })}
            />

            <span className={cs(styles.count, {
                [styles.accented]: count > 0,
            })}>
                {count}
            </span>

            <AddIcon
                onClick={onPlusClick}
                className={cs(styles.action, {
                    [styles.inactive]: !canIncrement,
                })}
            />
        </div>
    );
};
export default Counter;
