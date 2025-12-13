import styles from './Loading.module.css'

interface LoadingProps {
    text?: string
}

export function Loading({ text = '加载中...' }: LoadingProps) {
    return (
        <div className={styles.container}>
            <div className={styles.spinner}></div>
            <p className={styles.text}>{text}</p>
        </div>
    )
}
