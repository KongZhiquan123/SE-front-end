import * as mammoth from 'mammoth';
import { ElMessage } from 'element-plus';

/**
 * 将 Word 文档(doc/docx)转换为 HTML 并生成可预览的 URL
 * @param input 原始文档的 Blob 对象或 Blob URL
 * @returns 转换后的 HTML 内容的 Blob URL，失败时返回 null
 */
async function convertWordToHtml(input: Blob | string | null): Promise<string | null> {
    if (!input) {
        ElMessage.warning('Invalid file input');
        return null;
    }
    try {
        let blob: Blob;
        // 判断输入是 Blob 对象还是 Blob URL
        if (typeof input === 'string') {
            // 如果是 URL，则获取 Blob
            const response = await fetch(input);
            if (!response.ok) {
                ElMessage.error('Failed to fetch file');
                return null;
            }
            blob = await response.blob();
        } else {
            // 如果已经是 Blob，直接使用
            blob = input;
        }

        // 检查是否为 Word 文档类型
        if (!blob.type.includes('word') &&
            !blob.type.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
            !blob.type.includes('application/msword')) {
            ElMessage.error('Unsupported file type, only doc/docx formats are supported');
            return null;
        }

        // 将 Blob 转换为 ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();

        // 使用 mammoth 将 Word 文档转换为 HTML
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const htmlContent = result.value;

        // 创建完整的 HTML 文档
        const fullHtml = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WORD PREVIEW</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          table, th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

        // 创建包含 HTML 内容的 Blob
        const htmlBlob = new Blob([fullHtml], { type: 'text/html' });

        // 生成新的 Blob URL
        return URL.createObjectURL(htmlBlob);
    } catch (error) {
        console.error('Error converting document:', error);
        ElMessage.error('Failed to convert document');
        return null;
    }
}

export default convertWordToHtml;