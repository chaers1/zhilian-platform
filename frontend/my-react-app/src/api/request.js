// src/api/request.js
/**
 * HTTP 请求封装模块
 * 统一管理多个后端服务的请求实例，提供统一的拦截器和错误处理
 * 
 * 后端服务架构：
 * - Django (8000端口): 用户认证、爬虫管理、数据操作
 * - FastAPI (8001端口): 数据统计、图表查询、实时数据
 */

import axios from 'axios'

//==================== 后端服务地址配置 ====================
/**
 * 从环境变量读取后端配置
 * VITE_ 前缀是 Vite 的约定，用于暴露环境变量给前端代码
 */
const getBackendUrl = (host, port) => {
    const envHost = import.meta.env[`VITE_${host}`] || '127.0.0.1'
    const envPort = import.meta.env[`VITE_${port}`] || '8000'
    return `http://${envHost}:${envPort}/`
}

/**
 * Django 后端基础URL
 * 负责：用户认证（登录/注册）、爬虫操作（启动/停止）、权限管理
 */
const DJANGO_BASE_URL = getBackendUrl('DJANGO_HOST', 'DJANGO_PORT')

/**
 * FastAPI 后端基础URL
 * 负责：Dashboard 统计数据、图表数据查询、实时数据流
 */
const FASTAPI_BASE_URL = getBackendUrl('FASTAPI_HOST', 'FASTAPI_PORT')

// ==================== 请求实例创建 ====================

/**
 * Django 请求实例（需要认证）
 * @description 用于需要用户登录的 Django 接口
 * @example 爬虫启动/停止、用户信息更新、操作记录查询
 */
export const djangoRequest = axios.create({
    baseURL: DJANGO_BASE_URL,
    timeout: 10000,  // 10秒超时
    headers: {
        'Content-Type': 'application/json',
    },
})

/**
 * FastAPI 请求实例（需要认证）
 * @description 用于需要用户登录的 FastAPI 接口
 * @example Dashboard 统计、图表数据、实时监控
 */
export const fastapiRequest = axios.create({
    baseURL: FASTAPI_BASE_URL,
    timeout: 15000,  // 15秒超时（统计数据可能需要更长时间）
    headers: {
        'Content-Type': 'application/json',
    },
})

/**
 * 公开请求实例（无需认证）
 * @description 用于不需要登录的公开接口
 * @example 用户注册、登录、公开数据查询
 */
export const publicRequest = axios.create({
    baseURL: DJANGO_BASE_URL,
    timeout: 5000,  // 5秒超时
    headers: {
        'Content-Type': 'application/json',
    },
})

// ==================== 拦截器工具函数 ====================

/**
 * Token 注入函数
 * @description 从 sessionStorage/localStorage 获取 token 并添加到请求头
 * @param {import('axios').InternalAxiosRequestConfig} config - 请求配置
 * @returns {import('axios').InternalAxiosRequestConfig} 处理后的配置
 */
const injectToken = (config) => {
    // 优先从 sessionStorage 获取（会话级存储）
    let token = sessionStorage.getItem('token')
    // 如果没有，从 localStorage 获取（持久化存储）
    if (!token) {
        token = localStorage.getItem('token')
    }
    // 如果存在 token，添加到 Authorization 头
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
    }

    // 如果是 FormData，删除 Content-Type，让 axios 自动设置 multipart/form-data
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type']
    }

    return config
}

/**
 * 响应数据处理函数
 * @description 统一提取响应数据，简化前端使用
 * @param {import('axios').AxiosResponse} response - 响应对象
 * @returns {*} 响应数据（response.data）
 */
const handleResponse = (response) => {
    return response.data
}

/**
 * 响应错误处理函数
 * @description 统一处理 HTTP 错误状态码，提供友好的错误提示
 * @param {*} error - 错误对象
 * @returns {Promise<never>} 拒绝的 Promise
 */
const handleError = (error) => {
    // 检查是否有响应（服务器返回了状态码）
    if (error.response) {
        const { status } = error.response

        switch (status) {
            // 401: 未授权（token过期或无效）
            case 401:
                console.warn('[Request Error] 登录已过期，请重新登录')
                // 清除所有存储的认证信息
                sessionStorage.removeItem('token')
                localStorage.removeItem('token')
                sessionStorage.removeItem('userInfo')
                localStorage.removeItem('userInfo')
                // 跳转到登录页
                window.location.href = '/'
                break

            // 403: 禁止访问（没有权限）
            case 403:
                alert('抱歉，您没有权限执行此操作')
                break

            // 404: 资源不存在
            case 404:
                console.warn('[Request Error] 请求的资源不存在')
                break

            // 500: 服务器内部错误
            case 500:
                alert('服务器内部错误，请稍后重试')
                break

            // 其他错误
            default:
                const message = error.response.data?.message || '请求失败'
                alert(`请求失败：${message}`)
        }
    }
    // 请求已发出但没有收到响应（网络问题）
    else if (error.request) {
        alert('网络连接失败，请检查网络连接')
    }
    // 请求配置错误
    else {
        console.error('[Request Error] 请求配置错误:', error.message)
    }

    // 将错误传递给调用方处理
    return Promise.reject(error)
}

// ==================== 注册拦截器 ====================

// Django 请求实例
djangoRequest.interceptors.request.use(injectToken)
djangoRequest.interceptors.response.use(handleResponse, handleError)

// FastAPI 请求实例
fastapiRequest.interceptors.request.use(injectToken)
fastapiRequest.interceptors.response.use(handleResponse, handleError)

// 公开请求实例（不需要 token 注入）
publicRequest.interceptors.response.use(handleResponse, handleError)

// ==================== 默认导出 ====================
/**
 * 默认导出请求实例集合
 * @property {axios.AxiosInstance} django - Django 请求实例
 * @property {axios.AxiosInstance} fastapi - FastAPI 请求实例
 * @property {axios.AxiosInstance} public - 公开请求实例
 */
export default {
    django: djangoRequest,
    fastapi: fastapiRequest,
    public: publicRequest,
}