/**
 * LoginPage 主页面组件
 * 整个页面的主容器，负责管理所有子组件的状态和交互
 * 
 * @returns {JSX.Element} 主页面组件
 */

import { useState, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';  // 路由

import BrandSection from './components/BrandSection/BrandSection';
import LoginForm from './components/LoginForm/LoginForm';
import RegisterForm from './components/RegisterForm/RegisterForm';
import PhotoWall from './components/PhotoWall/PhotoWall';
import ProfilePage from './components/ProfilePage/ProfilePage';
import './LoginPage.css';

/*引入API函数*/
import { register, login, logout, getUserInfo, updateProfile } from '../../api';

const LoginPage = () => {

    // 页面显示状态，'login' | 'register' | 'photoWall' | 'profile'
    const [currentPage, setCurrentPage] = useState('login');

    // 登录状态
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 加载状态
    const [isLoading, setIsLoading] = useState(false);

    // 当前用户信息
    const [currentUser, setCurrentUser] = useState({
        name: '',// 名字
        initial: '',// 用户名首字母
        email: '', // 邮箱
        phone: '', // 手机号
        role: '', // 角色
        department: '', // 部门
        bio: '', // 个人简介
        lastLogin: '', // 最后登录时间
        avatar_url: '' // 头像URL
    });

    // 路由导航函数
    const navigate = useNavigate();

    /**
     * 组件初始化时恢复登录状态
     */
    useEffect(() => {
        // 优先从 localStorage 读取，其次从 sessionStorage 读取
        let token = localStorage.getItem('token');
        let userInfoStr = localStorage.getItem('userInfo');

        if (!token) {
            token = sessionStorage.getItem('token');
            userInfoStr = sessionStorage.getItem('userInfo');
        }

        if (token && userInfoStr) {
            try {
                const userInfo = JSON.parse(userInfoStr);
                setCurrentUser(prev => ({
                    ...prev,
                    name: userInfo.name || '',
                    initial: (userInfo.name || 'U').charAt(0),
                    avatar_url: userInfo.avatar_url || '',
                    email: userInfo.email || '',
                    phone: userInfo.phone || '',
                    role: userInfo.role || '',
                    department: userInfo.department || '',
                    bio: userInfo.bio || '',
                    lastLogin: userInfo.lastLogin || userInfo.last_login || ''
                }));
                setIsLoggedIn(true);
                setCurrentPage('photoWall');
                setWelcomeContent({
                    title: `欢迎回来，${userInfo.name || '用户'}`,
                    desc: '已登录状态，点击卡片进入对应客户端'
                });
                console.log('恢复登录状态成功');
            } catch (error) {
                console.error('解析用户信息失败:', error);
                // 如果解析失败，清除存储
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userInfo');
            }
        }
    }, []);

    // 欢迎语内容（根据页面状态动态变化）

    const [welcomeContent, setWelcomeContent] = useState({
        title: '欢迎回来',
        desc: '一站式管理爬虫采集 · 企业运营应用网站 · AI模型与后台数据 · 统一账号 · 无缝切换。'
    });

    /**
    * 处理登录
    * @param {Object} loginData - 登录数据
    */

    const handleLogin = useCallback(async (loginData) => {
        /**
         * 函数处理了登录的请求状态，loginData是为了接受登录表单中的内容，包括邮箱、密码和是否记住登录状态、
         * 并调用login API函数进行登录请求。
         * 登录成功后，更新当前用户信息、登录状态、欢迎语内容并切换到照片墙页面。
         * 登录失败后，显示错误信息。
         */
        setIsLoading(true);/* 登录请求开始，设置加载状态为true */
        try {
            const result = await login({
                email: loginData.email,
                password: loginData.password,
                rememberMe: loginData.rememberMe
            });

            if (result.success) {
                const userData = result.data;
                setCurrentUser(prev => ({
                    ...prev,
                    name: userData.name || userData.email.split('@')[0],
                    initial: (userData.name || userData.email.split('@')[0]).charAt(0),
                    avatar_url: userData.avatar_url || '',
                    role: userData.role || '',
                    lastLogin: userData.lastLogin || userData.last_login || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    department: userData.department || '',
                    bio: userData.bio || ''
                }));
                setIsLoggedIn(true);/* 登录成功，设置登录状态为true */
                setCurrentPage('photoWall');/* 登录成功，切换到照片墙页面 */
                setWelcomeContent({
                    title: `欢迎回来，${userData.name || userData.email?.split('@')[0] || '用户'}`,
                    desc: '已登录状态，点击卡片进入对应客户端'
                });/*· 登录成功，设置欢迎语内容 */
            } else {
                alert(result.message);/* 登录失败，显示错误信息 */
            }
        } catch (error) {
            alert('网络错误，请稍后重试');/* 登录请求失败，显示错误信息 */
            console.error('登录请求失败:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * 处理注册
     *  @param {Object} registerData - 注册数据
     */

    const handleRegister = useCallback(async (registerData) => {
        /**
         * 函数处理了注册的请求状态，registerData是为了接受注册表单中的内容，包括姓名、邮箱、手机号、密码和确认密码、
         * 并调用register API函数进行注册请求。
         * 注册成功后，更新当前用户信息、登录状态、欢迎语内容并切换到登录页面。
         * 注册失败后，显示错误信息。
         */
        setIsLoading(true);
        try {
            const result = await register({
                firstName: registerData.firstName,
                lastName: registerData.lastName,
                email: registerData.email,
                phone: registerData.phone,
                password: registerData.password,
                confirmPassword: registerData.password,
                agreeTerms: true
            });

            if (result.success) {
                alert(result.message);
                const fullName = registerData.firstName;
                setCurrentUser(prev => ({
                    ...prev,
                    name: fullName,
                    initial: registerData.firstName,
                    email: registerData.email,
                    phone: registerData.phone
                }));

                setIsLoggedIn(false);
                setCurrentPage('login');
                setWelcomeContent({
                    title: '欢迎回来',
                    desc: '注册成功，请登录您的账户'
                });
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('网络错误，请稍后重试');
            console.error('注册请求失败:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * 处理退出登录
     */

    const handleLogout = useCallback(async () => {
        /**
         * 函数处理了退出登录的请求状态，
         * 并调用logout API函数进行退出登录请求。
         * 退出登录成功后，更新当前用户信息、登录状态、欢迎语内容并切换到登录页面。
         * 退出登录失败后，显示错误信息。
         */

        try {
            const result = await logout();
            if (result.success) {
                setIsLoggedIn(false);
                setCurrentPage('login');
                // 重置用户信息
                setCurrentUser({
                    name: '',
                    initial: '',
                    email: '',
                    phone: '',
                    role: '',
                    department: '',
                    bio: '',
                    lastLogin: '',
                    avatar_url: ''
                });
                setWelcomeContent({
                    title: '欢迎回来',
                    desc: '一站式管理爬虫采集、餐饮运营、AI模型与后台管理，包括权限管理，统一账号，无缝切换。'
                });
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('退出登录请求失败:', error);

            setIsLoggedIn(false);
            setCurrentPage('login');
            // 重置用户信息
            setCurrentUser({
                name: '',
                initial: '',
                email: '',
                phone: '',
                role: '',
                department: '',
                bio: '',
                lastLogin: '',
                avatar: '',
                avatar_url: ''
            });
            // 清除存储的token和用户信息
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userInfo');
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            setWelcomeContent({
                title: '欢迎回来',
                desc: '一站式管理爬虫采集、餐饮运营、AI模型与后台管理，包括权限管理，统一账号，无缝切换。'
            })
        }
    }, []);

    /**
     * 切换到注册页面
     */

    const switchToRegister = useCallback(() => {
        /**
         * 函数切换到注册页面，更新欢迎语内容。
         */
        setCurrentPage('register');
        setWelcomeContent({
            title: '加入智联平台',
            desc: '注册即享受智联平台所有功能 · 立即加入'

        });
    }, []);

    /**
     * 切换到登录页面
     */

    const switchToLogin = useCallback(() => {
        /**
         * 函数切换到登录页面，更新欢迎语内容。
         */
        setCurrentPage('login');
        setWelcomeContent({
            title: '欢迎回来',
            desc: '一站式管理爬虫采集、餐饮运营、AI模型与后台管理，包括权限管理，统一账号，无缝切换。'
        });
    }, []);

    /**
     * 查看个人资料
     */

    const viewProfile = useCallback(async () => {
        /**
         * 函数查看个人资料，更新当前用户信息。
         * 如果获取用户信息失败，也设置页面为个人资料页。
         */
        try {
            const result = await getUserInfo();
            if (result.success) {
                setCurrentUser(prev => ({
                    ...prev,
                    ...result.data,
                    avatar_url: result.data.avatar_url || '',
                    // 确保initial 始终有值
                    initial: (result.data.name || 'U').charAt(0)
                }));
                // 打印用户信息，以便调试
                console.log('用户信息:', result.data);
                // 获取用户信息成功后再设置页面为个人资料页
                setCurrentPage('profile');
                setWelcomeContent({
                    title: '个人资料',
                    desc: '理你的个人信息和账户设置'
                });
            } else {
                // 获取用户信息失败，也设置页面为个人资料页
                setCurrentPage('profile');
                setWelcomeContent({
                    title: '个人资料',
                    desc: '理你的个人信息和账户设置'
                });
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            // 即使获取用户信息失败，也设置页面为个人资料页
            setCurrentPage('profile');
            setWelcomeContent({
                title: '个人资料',
                desc: '理你的个人信息和账户设置'
            });
        }
    }, []);
    /**
     * 返回首页(照片墙)
     */
    const backToDashboard = useCallback(() => {
        /**
         * 函数返回首页(照片墙)，更新欢迎语内容。
         */
        setCurrentPage('photoWall');
        setWelcomeContent({
            title: `欢迎回来，${currentUser.name}`,
            desc: '已登录状态，点击卡片进入对应客户端'
        });
    }, [currentUser.name]);

    /**
     * 处理模块点击
     * @param {string} moduleId - 模块ID
     * @description 处理模块点击事件，根据模块ID跳转到对应页面。
     * @returns {void}
     */

    const handleModuleClick = useCallback((moduleId) => {
        const moduleRoutes = {
            crawler: '/web-crawler',
            restaurant: '/restaurant',
            ai: '/ai-model',
            admin: '/admin'
        }
        const moduleNames = {
            crawler: '爬虫客户端',
            restaurant: '餐饮客户端',
            ai: 'AI语言模型',
            admin: '后台管理'
        };
        const route = moduleRoutes[moduleId];
        if (route) {
            navigate(route);
            alert(`正在跳转到 ${moduleNames[moduleId]}`);
        } else {
            alert(`模块ID ${moduleId} 不存在`);
        }

    }, [navigate]);

    /**
     * 处理保存个人资料
     * @param {Object} profileData - 个人资料数据
     * 
     */

    const handleSaveProfile = useCallback(async (profileData) => {
        const result = await updateProfile(profileData);
        if (result.success) {
            setCurrentUser(prev => ({
                ...prev,
                ...result.data,
                avatar_url: result.data.avatar_url || '',
            }));
            alert('保存成功');
            backToDashboard();
        } else {
            alert(result.message || '保存失败，请稍后重试')
        }
    }, [backToDashboard]);

    return (
        <div className='LoginPage-body'>
            <div className='LoginPage'>
                { /* 左侧品牌区域 完成*/}
                <BrandSection
                    welcomeTitle={welcomeContent.title} // 欢迎语标题
                    welcomeDesc={welcomeContent.desc}// 欢迎语描述
                    isLoggedIn={isLoggedIn}// 是否登录，这个值是从是否登录中进行设定的
                    onModuleClick={handleModuleClick}// 处理模块点击
                />

                { /* 右侧内容区域 */}
                <div className='LoginPage-content'>

                    {/* 表单容器 */}
                    <div className='LoginPage-forms'>
                        {/* 登录表单 */}
                        <LoginForm
                            onLogin={handleLogin}
                            onSwitchToRegister={switchToRegister}
                            isActive={currentPage === 'login'}
                            isLoading={isLoading}
                        />

                        {/* 注册表单 */}
                        <RegisterForm
                            onRegister={handleRegister}
                            onSwitchToLogin={switchToLogin}
                            isActive={currentPage === 'register'}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* 照片墙 */}
                    <PhotoWall
                        user={currentUser}
                        isActive={currentPage === 'photoWall'}
                        onLogout={handleLogout}
                        onViewProfile={viewProfile}
                        onViewSettings={() => alert('跳转到账户设置页面')}
                        onViewSecurity={() => alert('跳转到安全中心页面')}
                        onViewHelp={() => alert('跳转到帮助与反馈页面')}
                    />

                    {/* 个人资料页面 */}
                    <ProfilePage
                        user={currentUser}
                        isActive={currentPage === 'profile'}
                        onSave={handleSaveProfile}
                        onBack={backToDashboard}
                    />

                    {/* 页脚 */}
                    <div className="LoginPage-footer">
                        <div className="LoginPage-footer-copyright">
                            <span>Copyright © 2025-2026</span>
                            <span className="LoginPage-footer-divider">|</span>
                            <a
                                href="https://chaers1.github.io/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="LoginPage-footer-link"
                            >
                                张志刚个人主页
                            </a>
                            <span className="LoginPage-footer-divider">|</span>
                            <span>版权所有·张志刚</span>
                            <span className="LoginPage-footer-divider">|</span>
                            <span>本项目基于 django, fastapi + react 开发</span>
                        </div>
                        <div className="LoginPage-footer-version">
                            © 2025 智联平台 · 多模块统一登录 · v1.0.0
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );

};

export default memo(LoginPage);