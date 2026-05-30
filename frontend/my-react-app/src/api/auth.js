import { publicRequest, djangoRequest, fastapiRequest } from './request'

/**
 * 用户注册
 * @param {Object} userData - 注册信息
 * @param {string} userData.firstName - 名字
 * @param {string} userData.lastName - 姓氏
 * @param {string} userData.email - 邮箱
 * @param {string} userData.phone - 手机号
 * @param {string} userData.password - 密码
 * @param {string} userData.confirmPassword - 确认密码
 * @param {boolean} userData.agreeTerms - 是否同意协议
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
export const register = async (userData) => {
    try {
        if (!userData.lastName || !userData.firstName) {
            return { success: false, message: '请填写姓名' }
        }
        if (!userData.email) {
            return { success: false, message: '请填写电子邮箱' }
        }
        if (!userData.phone) {
            return { success: false, message: '请填写手机号码' }
        }
        if (!userData.password || userData.password.length < 8) {
            return { success: false, message: '密码至少需要8位字符' }
        }
        if (userData.password !== userData.confirmPassword) {
            return { success: false, message: '两次输入的密码不一致' }
        }
        if (!userData.agreeTerms) {
            return { success: false, message: '请阅读并同意用户服务协议' }
        }

        const requestData = {
            first_name: userData.firstName + userData.lastName,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
        }

        const res = await publicRequest.post('api/users/register', requestData)

        if (res.code === 200 || res.code === 201) {
            const fullName = userData.firstName + userData.lastName
            const firstName = userData.firstName
            const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(firstName) + '&background=random&color=fff'

            const userInfo = {
                id: res.data.id,
                name: fullName,
                avatar: defaultAvatar,
                avatar_url: defaultAvatar,
                email: userData.email,
                phone: userData.phone
            }

            return { success: true, data: userInfo, message: res.message || '注册成功' }
        } else {
            return { success: false, message: res.message || '注册失败，请稍后重试' }
        }
    } catch (error) {
        console.error('注册请求失败:', error)
        if (error.response?.data?.message) {
            return { success: false, message: error.response.data.message }
        }
        return { success: false, message: error.message || '网络错误，请检查网络连接' }
    }
}

/**
 * 用户登录
 * @param {Object} userData - 登录信息
 * @param {string} userData.email - 邮箱
 * @param {string} userData.password - 密码
 * @param {boolean} userData.rememberMe - 是否记住登录
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
export const login = async (userData) => {
    try {
        if (!userData.email) {
            return { success: false, message: '请填写电子邮箱' }
        }
        if (!userData.password || userData.password.length < 6) {
            return { success: false, message: '请填写密码' }
        }

        const loginData = { email: userData.email, password: userData.password }
        const res = await publicRequest.post('api/users/login', loginData)

        if (res.code === 200 || res.code === 201) {
            const token = res.data.token

            if (userData.rememberMe) {
                localStorage.setItem('token', token)
                sessionStorage.removeItem('token')
            } else {
                sessionStorage.setItem('token', token)
                localStorage.removeItem('token')
            }

            const userInfoResult = await getUserInfo()
            let userdata/* 如果登录成功，保存到本地的登录信息*/

            if (userInfoResult.success) {
                const fullInfo = userInfoResult.data
                userdata = {
                    id: fullInfo.id,
                    name: fullInfo.name,
                    email: fullInfo.email,
                    phone: fullInfo.phone,
                    avatar_url: fullInfo.avatar_url || '',
                    role: fullInfo.role,
                    department: fullInfo.department || '未知部门',
                    lastLogin: fullInfo.last_login || fullInfo.lastLogin
                }
            } else {
                userdata = {
                    id: res.data.id,
                    name: res.data.name,
                    avatar_url: res.data.avatar_url || '',
                    role: res.data.role,
                    department: res.data.department || '未知部门',
                    lastLogin: res.data.last_login || res.data.lastLogin
                }
            }

            if (userData.rememberMe) {
                localStorage.setItem('userInfo', JSON.stringify(userdata))
                sessionStorage.removeItem('userInfo')
            } else {
                sessionStorage.setItem('userInfo', JSON.stringify(userdata))
                localStorage.removeItem('userInfo')
            }

            return { success: true, data: userdata }
        } else {
            return { success: false, message: res.message || '登录失败，请稍后重试' }
        }
    } catch (error) {
        console.error('登录失败:', error)
        if (error.response?.data?.message) {
            return { success: false, message: error.response.data.message }
        }
        return { success: false, message: error.message || '网络请求错误，稍后重试' }
    }
}

/**
 * 用户退出登录
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const logout = async () => {
    try {
        try {
            await djangoRequest.post('api/users/logout')
        } catch (error) {
            console.log('后端退出接口调用失败，继续清除本地存储')
        }

        sessionStorage.removeItem('token')
        sessionStorage.removeItem('userInfo')
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')

        return { success: true, message: '退出成功' }
    } catch (error) {
        console.error('退出登录异常:', error)
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('userInfo')
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        return { success: true, message: '已退出登录' }
    }
}

/**
 * 获取用户信息，主要用于登录后点击进个人资料后获取用户信息，包括姓名、部门、邮箱、手机号、个人简介、头像等
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
export const getUserInfo = async () => {
    try {
        const res = await djangoRequest.get('api/users/profile')
        if (res.code === 200 || res.code === 201) {
            return { success: true, data: res.data, message: res.message || '获取用户信息成功' }
        } else {
            return { success: false, message: res.message || '获取用户信息失败，请稍后重试' }
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
        return { success: false, message: error.response?.data?.message || '获取用户信息失败，请稍后重试' }
    }
}

/**
 * 更新用户信息
 * @param {Object} data - 更新信息
 * @param {string} data.name - 姓名
 * @param {string} data.department - 部门
 * @param {string} data.email - 邮箱
 * @param {string} data.phone - 手机号
 * @param {string} data.bio - 个人简介
 * @param {File} data.avatar - 头像文件
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
export const updateProfile = async (data) => {
    try {
        console.log('updateProfile 接收到的数据:', data)
        console.log('avatar 文件:', data.avatar)

        const formData = new FormData()
        formData.append('name', data.name || '')
        formData.append('department', data.department || '')
        formData.append('email', data.email || '')
        formData.append('phone', data.phone || '')
        formData.append('bio', data.bio || '')
        if (data.avatar) {
            formData.append('avatar', data.avatar)
            console.log('已添加 avatar 到 FormData')
        }

        console.log('FormData 内容:')
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1])
        }

        const res = await djangoRequest.post('api/users/profile', formData)

        if (res.code === 200 || res.code === 201) {
            return { success: true, data: res.data, message: res.message || '更新用户信息成功' }
        } else {
            return { success: false, message: res.message || '更新用户信息失败，请稍后重试' }
        }
    } catch (error) {
        console.error('更新用户信息失败:', error)
        return { success: false, message: error.response?.data?.message || '更新用户信息失败，请稍后重试' }
    }
}

/**
 * 总体概览页面，数据信息接口
 * 数据总量，今日，七天数据抓取趋势，数据分类分布，爬虫更新，日军抓取，成功率抓取频率
 */
export const getDashboardStats = async () => {
    try {
        const res = await fastapiRequest.get('/api/crawler/dashboard/stats')
        console.log(res)
        return { success: true, data: res.data, message: res.message || '获取数据统计成功' }
    } catch (error) {
        console.error('获取数据统计失败:', error)
        return { success: false, message: error.response?.data?.message || '获取数据统计失败，请稍后重试' }
    }
}

/**
 * 爬虫操作接口（启动/停止）
 * @param {string} spiderType - 爬虫类型：movie, news, novel
 * @param {string} action - 操作：start, stop
 * @param {string} source - 来源：ssr2 (默认)
 */
export const controlSpider = async (spiderType, action, source = 'ssr2') => {
    try {
        const spiderData = {
            spider_type: spiderType,
            action: action,
            source: source
        };

        // 发送请求
        const res = await djangoRequest.post('/api/crawler/spider_start', spiderData);

        return { success: true, data: res };
    } catch (error) {
        console.error('爬虫操作失败:', error);
        return { success: false, message: error.response?.data?.message || '操作失败，请稍后重试' };
    }
};
/**
 * 获取爬虫状态接口
 * @param {string} spiderName - 爬虫名称：movie, news, novel
 */
export const getSpiderStatus = async (spiderName) => {
    try {
        const res = await djangoRequest.get(`api/crawler/spider/${spiderName}/status`)
        console.log('getSpiderStatus 返回:', res)  // 调试日志
        return { success: true, data: res.data || res, message: res.message || '获取爬虫状态成功' }
    } catch (error) {
        console.error('获取爬虫状态失败:', error)
        return { success: false, message: error.response?.data?.message || '获取爬虫状态失败，请稍后重试' }
    }
}

/**
 * 获取爬虫实时日志
 * @param {string} spiderName - 爬虫名称：movie, news, novel
 * @param {number} limit - 返回日志数量，默认50
 * apiurl: http://localhost:8001/api/spider/movie/logs
 */

export const getSpiderLogs = async (spiderName, limit = 50) => {
    try {
        const res = await fastapiRequest.get(`/api/crawler/dashboard/${spiderName}/logs?limit=${limit}`)
        console.log('FastAPI 返回:', res)
        // FastAPI 直接返回数组时，数据可能在 res 或 res.data 中
        const data = res.data !== undefined ? res.data : res;
        return { success: true, data: data || [], message: '获取爬虫日志成功' }
    } catch (error) {
        console.error('获取爬虫日志失败:', error)
        return { success: false, message: error.response?.data?.message || '获取爬虫日志失败，请稍后重试' }
    }
}

export default {
    register, login, logout, getUserInfo,
    updateProfile, getDashboardStats, controlSpider
}
