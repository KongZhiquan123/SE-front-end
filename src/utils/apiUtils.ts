import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import type { AxiosRequestConfig } from "axios";

/**
 * 支持字典形式参数的API请求函数
 */
function apiRequest<T>(options: {
    url: string;
    requestType?: string;
    errorMessage?: string;
    data?: unknown;
    config?: AxiosRequestConfig;
}): Promise<T | null>;

/**
 * 支持解构参数的API请求函数
 */
function apiRequest<T>(
    url: string,
    requestType?: string,
    errorMessage?: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T | null>;

/**
 * 通用API请求处理函数实现
 */
async function apiRequest<T>(
    urlOrOptions: string | {
        url: string;
        requestType?: string;
        errorMessage?: string;
        data?: unknown;
        config?: AxiosRequestConfig;
    },
    requestType: string = 'get',
    errorMessage: string = "Request failed",
    data: unknown = {},
    config: AxiosRequestConfig = {}
): Promise<T | null> {
    // 处理参数
    let url: string;

    if (typeof urlOrOptions === 'object') {
        // 字典形式参数
        url = urlOrOptions.url;
        requestType = urlOrOptions.requestType || 'get';
        errorMessage = urlOrOptions.errorMessage || "Request failed";
        data = urlOrOptions.data || {};
        config = urlOrOptions.config || {};
    } else {
        // 解构参数形式
        url = urlOrOptions;
    }

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
    } catch (error) {
        if (error.response?.data && typeof error.response.data === 'string' && error.response.data.trim()) {
            ElMessage.error(error.response.data);
        } else {
            ElMessage.error(errorMessage);
        }
        return null;
    }
}

export default apiRequest;