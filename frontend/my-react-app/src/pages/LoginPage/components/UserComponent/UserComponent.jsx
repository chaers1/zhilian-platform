/**
 * UserComponent 组件
 * 用户头像组件，包含头像、用户名、角色、下拉菜单、退出按钮
 * 这是一个核心可复用组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.user - 用户信息对象
 * @param {string} props.user.name - 用户名
 * @param {string} props.user.initial - 用户名首字母
 * @param {string} props.user.role - 用户角色
 * @param {string} props.user.lastLogin - 最后登录时间
 * @param {Function} props.onLogout - 退出登录回调函数
 * @param {Function} props.onViewProfile - 查看个人资料回调函数
 * @param {Function} props.onViewSettings - 查看设置回调函数
 * @param {Function} props.onViewSecurity - 查看安全中心回调函数
 * @param {Function} props.onViewHelp - 查看帮助回调函数
 */

import { useState, useEffect, useRef, memo } from 'react';
import './UserComponent.css';

const UserComponent = ({
    user,
    onLogout,
    onViewProfile,
    onViewSettings,
    onViewSecurity,
    onViewHelp
}) => {
    // 下拉菜单显示状态
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    /**
     * 切换下拉菜单显示状态
     */
    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    /**
     * 关闭下拉菜单
     */
    const closeDropdown = () => {
        setShowDropdown(false);
    };

    /**
     * 处理退出登录
     */
    const handleLogout = () => {
        closeDropdown();
        if (onLogout) {
            onLogout();
        }
    };

    /**
     * 处理查看个人资料
     */
    const handleViewProfile = () => {
        closeDropdown();
        if (onViewProfile) {
            onViewProfile();
        }
    };

    /**
     * 处理查看设置
     */
    const handleViewSettings = () => {
        closeDropdown();
        if (onViewSettings) {
            onViewSettings();
        }
    };

    /**
     * 处理查看安全中心
     */
    const handleViewSecurity = () => {
        closeDropdown();
        if (onViewSecurity) {
            onViewSecurity();
        }
    };

    /**
     * 处理查看帮助
     */
    const handleViewHelp = () => {
        closeDropdown();
        if (onViewHelp) {
            onViewHelp();
        }
    };

    /**
     * 点击外部关闭下拉菜单
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                closeDropdown();
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    return (
        <div className="UserComponent">
            {/* 用户信息区域（点击弹出下拉菜单） */}
            <div
                className="UserComponent-info"
                onClick={toggleDropdown}
                ref={buttonRef}
            >
                <div className="UserComponent-avatar">
                    {user?.avatar_url && user.avatar_url !== null && user.avatar_url !== 'none' && user.avatar_url !== '' ? (
                        <img src={user.avatar_url.startsWith('/') ? `http://127.0.0.1:8000${user.avatar_url}` : user.avatar_url} alt="用户头像" style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover', borderRadius: '50%'
                        }} />
                    ) : (
                        <span>{user?.initial || 'U'}</span>
                    )}
                </div>

                <div className="UserComponent-details">
                    <h3>
                        <span>{user?.name || '用户'}</span>
                        <span className="UserComponent-badge">
                            {user?.role || '普通用户'}
                        </span>
                    </h3>
                    <p className="UserComponent-meta">
                        <i className="fas fa-shield-alt"></i>
                        最后登录 {user?.lastLogin || '刚刚'}
                        <i className="fas fa-chevron-down" style={{ marginLeft: '6px', fontSize: '10px' }}></i>
                    </p>
                </div>
            </div>

            {/* 退出按钮 */}
            <button className="UserComponent-logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> 退出
            </button>

            {/* 下拉菜单 */}
            {showDropdown && (
                <>
                    {/* 遮罩层 */}
                    <div className="UserComponent-overlay" onClick={closeDropdown}></div>

                    {/* 下拉菜单内容 */}
                    <div className="UserComponent-dropdown" ref={dropdownRef}>
                        <div className="UserComponent-dropdown-item" onClick={handleViewProfile}>
                            <i className="fas fa-user"></i>
                            <span>个人资料</span>
                        </div>
                        <div className="UserComponent-dropdown-item" onClick={handleViewSettings}>
                            <i className="fas fa-cog"></i>
                            <span>账户设置</span>
                        </div>
                        <div className="UserComponent-dropdown-item" onClick={handleViewSecurity}>
                            <i className="fas fa-lock"></i>
                            <span>安全中心</span>
                        </div>
                        <div className="UserComponent-dropdown-divider"></div>
                        <div className="UserComponent-dropdown-item" onClick={handleViewHelp}>
                            <i className="fas fa-question-circle"></i>
                            <span>帮助与反馈</span>
                        </div>
                        <div className="UserComponent-dropdown-divider"></div>
                        <div
                            className="UserComponent-dropdown-item UserComponent-dropdown-logout"
                            onClick={handleLogout}
                        >
                            <i className="fas fa-sign-out-alt"></i>
                            <span>退出登录</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default memo(UserComponent);