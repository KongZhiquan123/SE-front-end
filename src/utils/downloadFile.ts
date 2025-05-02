import {Attachment} from "@/types/interfaces";
import apiRequest from "@/utils/apiUtils";
import {ElMessage} from "element-plus";

export default async function downloadFile (attachment: Attachment) {
    if (!attachment || !attachment.id) return
    try {
        const blob = await apiRequest({
            url: `/attachments/${attachment.id}/download`,
            requestType: 'GET',
            config: {
                responseType: 'blob',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Accept': 'application/octet-stream'
                }
            }
        })
        const url = window.URL.createObjectURL(blob)
        const downloadLink = document.createElement('a')
        downloadLink.href = url
        downloadLink.download = attachment.name
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        window.URL.revokeObjectURL(url)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        ElMessage.error('Failed to download the file')
    }
}
