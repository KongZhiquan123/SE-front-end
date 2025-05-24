// src/utils/request.ts
import axios from 'axios'
import type {AxiosError} from "axios";
import {useUserStore} from "@/stores/user";


const request = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 5000
})

// 请求拦截器，主要是为了添加 token
request.interceptors.request.use(
    config => {
        const userStore = useUserStore();
        if (userStore.token) {
            config.headers.Authorization = `Bearer ${userStore.token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器，打印到控制台，方便调试
request.interceptors.response.use(
    response => response,
    (error: AxiosError) => {
        console.error('Error Request:', error.request)
        console.error('Error Message:', error.response)
        console.error('Error Response:', error.response?.data)
        return Promise.reject(error)
    }
)
export default request