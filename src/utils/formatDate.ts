// Format date function
export function formatDate(dateString?: string | null) : string {
    if (!dateString) return '---'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '---'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
