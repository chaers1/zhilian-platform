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
export const getDashboardStats = async (retryCount = 0) => {
    try {
        const res = await fastapiRequest.get('/api/crawler/dashboard/stats')
        console.log(res)
        return { success: true, data: res.data, message: res.message || '获取数据统计成功' }
    } catch (error) {
        console.error('获取数据统计失败:', error)

        if (error.code === 'ECONNABORTED' && retryCount < 1) {
            console.log('请求超时，尝试重试...')
            return getDashboardStats(retryCount + 1)
        }

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
        const res = await fastapiRequest.get(`/api/crawler/dashboard/${spiderName}/status`)
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

export const getSpiderLogs = async (spiderName, limit = 50, retryCount = 0) => {
    try {
        const res = await fastapiRequest.get(`/api/crawler/dashboard/${spiderName}/logs?limit=${limit}`)
        console.log('FastAPI 返回:', res)
        const data = res.data !== undefined ? res.data : res;
        return { success: true, data: data || [], message: '获取爬虫日志成功' }
    } catch (error) {
        console.error('获取爬虫日志失败:', error)

        if (error.code === 'ECONNABORTED' && retryCount < 1) {
            console.log('请求超时，尝试重试...')
            return getSpiderLogs(spiderName, limit, retryCount + 1)
        }

        return { success: false, message: error.response?.data?.message || '获取爬虫日志失败，请稍后重试' }
    }
}

/**
 * 获取历史运行记录接口
 * @param {string} spiderType - 爬虫类型：movie, news, novel
 * @returns {Promise<{code: number, data: Array, total: number}>}
 */
export const getSpiderHistory = async () => {
    try {
        const response = await djangoRequest.get('/api/crawler/taskhistory')
        return response
    } catch (error) {
        console.error('获取历史运行记录失败：', error)
        return {
            code: 500, data: [], total: 0
        }
    }
}

/**
 * 获取爬虫数据分析接口 fastapi
 * @param {string} spiderType - 爬虫类型：movie, news, novel
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */

export const getSpiderAnalysis = async (spiderType) => {
    try {
        const res = await fastapiRequest.get(`/api/crawler/dashboard/${spiderType}/analysis`)
        return { success: true, data: res.data || res, message: res.message || '获取数据分析成功' }
    } catch (error) {
        console.error('获取数据分析失败:', error)
        return { success: false, message: error.response?.data?.message || '获取数据分析失败，请稍后重试' }
    }
}
/**
 * 获取爬虫七天内数据分析接口-折线图 fastapi
 * @param {string} spiderType - 爬虫类型：movie, news, novel
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */

export const getSpiderTrent = async (spiderType) => {
    try {
        const res = await fastapiRequest.get(`/api/crawler/dashboard/${spiderType}/trend`)
        return { success: true, data: res.data || res, message: res.message || '获取七天内数据分析成功' }
    } catch (error) {
        console.error('获取七天内数据分析失败:', error)
        return { success: false, message: error.response?.data?.message || '获取七天内数据分析失败，请稍后重试' }
    }
}

/**
 * 获取电影数据接口
 * @param {string} keyword - 搜索关键词
 * @param {Object} filters - 筛选条件 { year: '2020年后', rating: '9分以上' }
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
export const getMovieData = async (keyword = "", filters = {}) => {

    try {
        const params = {
            keyword: keyword,
        }
        // 添加筛选条件
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '全部') {
                params[key] = value;
            }

        });
        console.log('getMovieData发送的请求参数:', params);
        console.log('getMovieData请求的 URL:', `/api/crawler/dashboard/movie/data?${new URLSearchParams(params).toString()}`);
        const res = await fastapiRequest.get('/api/crawler/dashboard/movie/data', { params });
        console.log('getMovieData 返回:', res);
        return { success: true, data: res.data.data || res.data, message: '获取电影数据成功' };
    } catch (error) {
        console.error('获取电影数据失败:', error);
        return { success: false, message: error.response?.data?.message || '获取电影数据失败', data: [] };
    }
};

/**
 * 获取新闻数据接口
 */
export const getNewsData = async (keyword = "", filters = {}) => {
    try {
        const params = { keyword };
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '全部') {
                params[key] = value;
            }
        });
        const res = await fastapiRequest.get('/api/crawler/dashboard/news/data', { params });
        console.log('getNewsData 返回:', res);
        return { success: true, data: res.data.data || res.data, message: '获取新闻数据成功' };
    } catch (error) {
        console.error('获取新闻数据失败:', error);
        return { success: false, message: error.response?.data?.message || '获取新闻数据失败', data: [] };
    }
};

/**
 * 获取小说数据接口
 */
export const getNovelData = async (keyword = "", filters = {}) => {
    try {
        const params = { keyword };
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '全部') {
                params[key] = value;
            }
        });
        const res = await fastapiRequest.get('/api/crawler/dashboard/novel/data', { params });
        console.log('getNovelData 返回:', res);
        return { success: true, data: res.data.data || res.data, message: '获取小说数据成功' };
    } catch (error) {
        console.error('获取小说数据失败:', error);
        return { success: false, message: error.response?.data?.message || '获取小说数据失败', data: [] };
    }
};

/**
 * 获取全部数据接口
 */
export const getAllData = async (keyword = "", filters = {}) => {
    try {
        const params = { keyword };
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '全部') {
                params[key] = value;
            }
        });
        const res = await fastapiRequest.get('/api/crawler/dashboard/all/data', { params });
        console.log('getAllData 返回:', res);
        return { success: true, data: res.data.data || res.data, message: '获取全部数据成功' };
    } catch (error) {
        console.error('获取全部数据失败:', error);
        return { success: false, message: error.response?.data?.message || '获取全部数据失败', data: [] };
    }
};

/**
 * 获取级联筛选配置接口
 * @returns {Promise<{code: number, data: Object, message?: string}>}
 */

export const getCascadeFilters = async () => {
    try {
        const res = await fastapiRequest.get(`/api/crawler/dashboard/cascadefilters`)
        console.log('getCascadeFilters l级联筛选返回:', res)

        return { code: 200, data: res.data || res, message: res.message || 'success' }
    } catch (error) {
        console.error('获取筛选配置失败:', error);
        return { success: false, message: error.response?.data?.message || '获取筛选配置失败，请稍后重试', data: null };
    }
}

/**
 * 获取数据详情接口（查看功能）
 * @param {string} type - 数据类型：movie, news, novel
 * @param {number|string} id - 数据ID
 * @param {string} name - 数据名称（用于精确查找）
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
export const getDataDetail = async (type, id, name) => {
    try {
        const params = {
            type: type,
            id: id,
            name: name || ''
        };
        console.log('getDataDetail 发送的参数:', params);
        const res = await fastapiRequest.get('/api/crawler/dashboard/detail', { params });
        console.log('getDataDetail 返回:', res);

        // 后端返回格式: {"code": 200, "success": true, "data": {...}}
        if (res.success === true) {
            return { success: true, data: res.data, message: res.message || '获取详情成功' };
        } else {
            return { success: false, message: res.message || '获取详情失败', data: null };
        }
    } catch (error) {
        console.error('获取详情失败:', error);
        return { success: false, message: error.response?.data?.message || '获取详情失败', data: null };
    }
};

/**
 * 导出CSV接口
 * @param {Object} params - 导出参数
 * @param {string} params.type - 数据类型：movie, news, novel
 * @param {string} [params.keyword] - 搜索关键词
 * @param {Object} [params.filters] - 筛选条件
 * @param {Array<number>} [params.ids] - 数据ID列表（可选，不传则导出全部）
 * @returns {Promise<{success: boolean, data?: Blob, message?: string}>}
 */
export const exportCsv = async (params) => {
    try {
        console.log("exportCsv 发送的参数:", params);

        // 设置 responseType: 'blob' 来接收文件流
        const response = await fastapiRequest.post(
            '/api/crawler/dashboard/exportcsv',
            params,
            { responseType: 'blob' }
        );

        console.log("exportCsv 返回:", response);

        // 检查是否是 Blob 对象
        if (response instanceof Blob) {
            // 检查 Content-Type 是否正确
            const contentType = response.type || 'application/octet-stream';
            if (contentType.includes('csv') || contentType.includes('text')) {
                return { success: true, data: response, message: '导出成功' };
            }

            // 如果不是CSV类型，尝试解析为JSON错误
            try {
                const text = await response.text();
                const errorData = JSON.parse(text);
                return {
                    success: false,
                    message: errorData.detail || errorData.message || '导出失败',
                    data: null
                };
            } catch {
                return { success: false, message: '返回数据格式错误', data: null };
            }
        }

        // 如果返回的是对象（JSON格式的错误）
        if (response && typeof response === 'object') {
            return {
                success: false,
                message: response.detail || response.message || '导出失败',
                data: null
            };
        }

        return { success: true, data: response, message: '导出成功' };

    } catch (error) {
        console.error('导出失败:', error);

        // 处理各种错误情况
        if (error.response) {
            // HTTP 错误（4xx, 5xx）
            const { status, data } = error.response;

            if (data && (data.detail || data.message)) {
                return { success: false, message: data.detail || data.message, data: null };
            }

            return { success: false, message: `请求失败，状态码: ${status}`, data: null };

        } else if (error.request) {
            // 请求已发送但无响应
            return { success: false, message: '网络超时或服务器无响应', data: null };

        } else {
            // 请求配置错误
            return { success: false, message: error.message || '请求配置错误', data: null };
        }
    }
};
export default {
    register, login, logout, getUserInfo,
    updateProfile, getDashboardStats, controlSpider, getSpiderHistory,
    getSpiderAnalysis, getSpiderTrent, getMovieData, getCascadeFilters, getDataDetail,
    exportCsv
}
