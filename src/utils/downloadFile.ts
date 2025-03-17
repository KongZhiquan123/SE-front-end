export default function downloadFile (url?: string) {
    if (url && window) {
        window.open(url);
    }
};