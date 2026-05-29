// src/api/index.js
/**
 * API接口统一出口
 * @author 张志刚
 * @description 所有API接口从这里统一导出
 */

// 1. 先导入所有模块
import * as auth from './auth'

// 2. 导出axios实例
export { publicRequest } from './request'

// 3. 导出认证相关函数
export { register, login, logout, getUserInfo, updateProfile } from './auth'

// 4. 导出整个auth模块（使用上面导入的auth）
export { auth }

// 5. 默认导出所有模块
export default {
    auth
}