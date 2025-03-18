export default function formatFileSize (size: number | string): string {
    if (typeof size === 'string') {
        return size; //若size是字符串类型，则直接返回
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let fileSize = size;
    let unitIndex = 0;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
        fileSize /= 1024;
        unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
}
