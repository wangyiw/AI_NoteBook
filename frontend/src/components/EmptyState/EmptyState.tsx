import styles from './EmptyState.module.css'

interface EmptyStateProps {
    title: string
    description?: string
    actionText?: string
    onAction?: () => void
}

export function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
    return (
        <div className={styles.container}>
            <div className={styles.icon}>📝</div>
            <h3 className={styles.title}>{title}</h3>
            {description && <p className={styles.description}>{description}</p>}
            {actionText && onAction && (
                <button className={styles.actionButton} onClick={onAction}>
                    {actionText}
                </button>
            )}
        </div>
    )
}
