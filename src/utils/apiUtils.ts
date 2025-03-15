import { ElMessage } from 'element-plus';
import request from '@/utils/request';

/**
 * 通用API请求处理函数
 * @param url API端点URL
 * @param requestType 请求类型，默认为GET
 * @param errorMessage 失败时显示的自定义错误信息
 * @param data Axios请求数据, 用于POST和PUT请求
 * @param config Axios请求配置
 * @returns 请求成功时返回API响应数据，失败时返回null
 */
export async function apiRequest<T>(
    url: string,
    requestType: string = 'get',
    errorMessage: string = "Request failed",
    data = {},
    config = {}
): Promise<T | null> {
    try {
        let response;
        requestType = requestType.toLowerCase();
        if (requestType === 'get') {
            response = await request.get(url, config);
        } else if (requestType === 'post') {
            response = await request.post(url, data, config);
        } else if (requestType === 'put') {
            response = await request.put(url, data, config);
        } else {
            response = await request.delete(url, config);
        }
        return response?.data;
    } catch (error: any) {
        if (error.response?.data && typeof error.response.data === 'string' && error.response.data.trim()) {
            ElMessage.error(error.response.data);
        } else {
            ElMessage.error(errorMessage);
        }
        return null;
    }
}

export default apiRequest;