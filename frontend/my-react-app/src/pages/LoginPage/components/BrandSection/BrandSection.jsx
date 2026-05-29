/**
 * BrandSection 组件
 * 左侧品牌区域，包含 Logo、欢迎语、功能模块卡片
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.welcomeTitle - 欢迎标题
 * @param {string} props.welcomeDesc - 欢迎描述
 * @param {boolean} props.isLoggedIn - 是否已登录
 * @param {Function} props.onModuleClick - 模块点击回调函数
 * 
 */

import { memo } from 'react';
import './BrandSection.css';

const BrandSection = ({ welcomeTitle, welcomeDesc, isLoggedIn, onModuleClick }) => {
    /**
     * 首页功能模块
     * 包含模块ID，图标，标题和描述  
     */
    const modules = [
        {
            id: 'crawler',
            title: '爬虫模块',
            desc: '爬取网页数据 · 提取有效信息 · 数据采集 · 数据处理 · 可视化 · 定时任务 · 代理IP',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
            )
        },
        {
            id: 'restaurant',
            title: '餐饮客户端',
            desc: '点餐管理 · 库存预警 · 销售报表',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                    <line x1="6" y1="1" x2="6" y2="4" />
                    <line x1="10" y1="1" x2="10" y2="4" />
                    <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
            )
        },
        {
            id: 'ai',
            title: '机器学习',
            desc: '对话 · 训练',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                </svg>
            )
        },
        {
            id: 'admin',
            title: '后台管理',
            desc: '用户角色 · 权限分配 · 审计日志',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            )
        },
    ];

    /**
     * 处理模块点击事件
     * param {string} moduleId - 模块ID
     * 如果isloggedin 是一个false，提示用户先登录
     * @returns {void}
     */
    const handleModuleClick = (moduleId) => {
        if (!isLoggedIn) {
            alert('请先登录后在访问该模块');
            return;
        }
        if (onModuleClick) {
            onModuleClick(moduleId);
        };
    };

    return (
        <div className='BrandSection'>
            { /* logo区域 */}
            <div className='BrandSection-logo'>
                <div className="BrandSection-logo-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <div className="BrandSection-logo-text">
                    智联<span>平台</span>
                </div>
            </div>

            { /* 欢迎语区域 */}
            <div className='BrandSection-welcome'>
                <div className='BrandSection-welcome-title'>
                    {welcomeTitle || '欢迎回来'}
                </div>
                <div className='BrandSection-welcome-desc'>
                    {welcomeDesc || '一站式管理爬虫采集、餐饮运营、机器学习与后台管理，包括权限管理用户管理，统一账号，无缝切换。'}
                </div>
            </div>

            { /* 功能模块区域 */}
            <div className="BrandSection-modules">
                {modules.map((module) => (
                    <div
                        key={module.id}
                        className='BrandSection-module-card'
                        onClick={() => handleModuleClick(module.id)}
                    >
                        <div className='BrandSection-module-icon'>
                            {module.icon}
                        </div>
                        <h3>{module.title}</h3>
                        <p>{module.desc}</p>
                    </div>
                ))}
            </div>

            { /* 底部安全标识 */}
            <div className="BrandSection-security">
                <i className='fas fa-lock'></i>
                <span>统一身份认证 · 企业级安全</span>
            </div>
        </div>
    );

}

export default memo(BrandSection);