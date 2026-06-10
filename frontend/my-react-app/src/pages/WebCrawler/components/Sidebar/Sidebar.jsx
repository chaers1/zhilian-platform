/**
 * sidebar.jsx 侧边栏组件
 * 侧边栏组件，包含表头，爬虫集群导航，侧边栏展开和关闭按钮，用户头像和按钮 * 
 * @returns {JSX.Element} 侧边栏组件
 */
import { useState } from 'react';
import { getFullAvatarUrl } from '../../../../config/backend';
import './Sidebar.css';
import '@fortawesome/fontawesome-free/css/all.min.css'

const Sidebar = ({ activeItem, onItemClick, isOpen = true, user, spiderStatus }) => {
    // 统一的菜单数据
    const menuItems = [
        { id: 'overview', name: '总体概览', icon: 'fa-home', type: 'menu' },
        { id: 'data-query', name: '数据查询', icon: 'fa-search', type: 'menu' },
        { id: 'spider-group', name: '爬虫集群', icon: 'fa-bug', type: 'group' },
        { id: 'movie-crawler', name: '电影爬虫', status: '空闲', type: 'spider' },
        { id: 'news-crawler', name: '新闻爬虫', status: '已停止', type: 'spider' },
        { id: 'novel-crawler', name: '小说爬虫', status: '空闲', type: 'spider' },
    ];

    // 如果侧边栏关闭，不渲染
    if (!isOpen) {
        return null;
    }

    // 点击处理
    const handleClick = (itemId) => {
        if (onItemClick) {
            onItemClick(itemId);
        }
    }

    //根据不同的type渲染不同的组件
    const renderMenuItem = (item) => {
        // 分组标题
        if (item.type === 'group') {
            return (
                <div key={item.id} className='list_title'>
                    <i className={`fas ${item.icon}`}></i>
                    <span>{item.name}</span>
                </div>
            );
        }

        // 菜单项
        if (item.type === 'menu') {
            const isActive = activeItem === item.id;
            return (
                <div
                    key={item.id}
                    className={`spider-item ${isActive ? 'spider-item-active' : ''}`}
                    onClick={() => handleClick(item.id)}
                >
                    <div className='spider-name'>
                        <span>{item.name}</span>
                    </div>
                </div>
            );
        }

        // 爬虫
        if (item.type === 'spider') {
            const isActive = activeItem === item.id;
            const status = spiderStatus[item.id] || 'idle';  // 获取当前爬虫状态

            return (
                <div
                    key={item.id}
                    className={`spider-item ${isActive ? 'spider-item-active' : ''}`}
                    onClick={() => handleClick(item.id)}
                >
                    <div className='spider-name'>
                        <span>
                            <span className={`status-dot ${status}`}></span>  {/* 动态状态点 */}
                            {item.name}
                        </span>
                        <span className={`status-tag ${status}`}>
                            {/* 中文状态文字 */}
                            {status === 'running' ? '运行中' : status === 'idle' ? '空闲' : '已停止'}
                        </span>
                    </div>
                </div>
            )
        }
        return null;
    }

    return (
        <div className="sidebar">
            <div className='sidebar-header'>
                <div className='logo'>
                    <div className='logo-icon'>
                        <i className='fas fa-robot'></i>
                    </div>
                    <div className='logo-text'>
                        <h2>SpiderHub</h2>
                        <p>智能爬虫管理平台</p>
                    </div>
                </div>

            </div>
            <div className='spider-list-container'>
                { /* 统一渲染所有菜单项 */}
                {menuItems.map((item) => renderMenuItem(item))}
            </div>
            <div className='sidebar-footer'>
                <div className='user-avatar'>
                    {user?.avatar_url && user.avatar_url !== null && user.avatar_url !== '' ? (
                        <img
                            src={getFullAvatarUrl(user.avatar_url)}
                            alt={user.name}
                            className='avatar-img'
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    <i className={`fas fa-user ${(user?.avatar_url && user.avatar_url !== null && user.avatar_url !== '') ? 'hidden' : ''}`}></i>
                </div>
                <div className='user-info'>
                    {console.log('Sidebar 用户信息:', user)}
                    <span className='user-name'>{user?.name || '用户'}</span>
                    <span className='user-role'>{user?.department || user?.role || '未知'}</span>
                </div>
            </div>
        </div>
    );
}
export default Sidebar;
