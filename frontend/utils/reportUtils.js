export const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'completed':
            return '#0e8a0e';
        case 'in_progress':
            return '#b58a0e';
        case 'failed':
            return '#dc3545';
        default:
            return '#666';
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const REPORT_STATUSES = {
    COMPLETED: 'completed',
    IN_PROGRESS: 'in_progress',
    FAILED: 'failed'
}; 