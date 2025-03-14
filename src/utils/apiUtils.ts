import { ElMessage } from 'element-plus';
import request from '@/utils/request';

/**
 * 通用API请求处理函数
 * @param url API端点URL
 * @param errorMessage 失败时显示的自定义错误信息
 * @param options Axios请求选项
 * @returns 请求成功时返回API响应数据，失败时返回null
 */
export async function fetchData<T>(
    url: string,
    errorMessage: string = "Request failed",
    options = {}
): Promise<T | null> {
    try {
        const response = await request.get(url, options);
        return response.data;
    } catch (error: any) {
        if (error.response?.data && typeof error.response.data === 'string' && error.response.data.trim()) {
            ElMessage.error(error.response.data);
        } else {
            ElMessage.error(errorMessage);
        }
        return null;
    }
}

export default fetchData;