import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
    message: string
    onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <div className={styles.container}>
            <div className={styles.icon}>⚠️</div>
            <p className={styles.message}>{message}</p>
            {onRetry && (
                <button className={styles.retryButton} onClick={onRetry}>
                    重试
                </button>
            )}
        </div>
    )
}
