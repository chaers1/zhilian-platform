/**
 * PhotoWall 组件
 * 照片墙组件，登录后显示
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.user - 用户信息对象
 * @param {boolean} props.isActive - 是否显示照片墙
 * @param {Function} props.onLogout - 退出登录回调函数
 * @param {Function} props.onViewProfile - 查看个人资料回调函数
 * @param {Function} props.onViewSettings - 查看设置回调函数
 * @param {Function} props.onViewSecurity - 查看安全中心回调函数
 * @param {Function} props.onViewHelp - 查看帮助回调函数
 */

import { memo } from 'react';
import UserComponent from '../UserComponent/UserComponent';
import './PhotoWall.css';

const PhotoWall = ({
    user,
    isActive,
    onLogout,
    onViewProfile,
    onViewSettings,
    onViewSecurity,
    onViewHelp
}) => {
    /**
     * 照片数据
     */
    const photos = [
        { id: 1, url: 'https://picsum.photos/200/200?random=1', caption: '🕷️ 爬虫任务 #234' },
        { id: 2, url: 'https://picsum.photos/200/200?random=2', caption: '🍽️ 今日特供菜单' },
        { id: 3, url: 'https://picsum.photos/200/200?random=3', caption: '🤖 AI对话摘要' },
        { id: 4, url: 'https://picsum.photos/200/200?random=4', caption: '⚙️ 新用户注册' },
        { id: 5, url: 'https://picsum.photos/200/200?random=5', caption: '📊 月度报表' },
        { id: 6, url: 'https://picsum.photos/200/200?random=6', caption: '🔧 系统更新' }
    ];

    /**
     * 统计数据
     */
    const stats = [
        { id: 1, number: '5', label: '运行中爬虫' },
        { id: 2, number: '23', label: '今日订单' },
        { id: 3, number: '80%', label: 'AI额度剩余' }
    ];

    return (
        <div className={`PhotoWall ${isActive ? 'PhotoWall-active' : ''}`}>
            {/* 用户头像组件 */}
            <UserComponent
                user={user}
                onLogout={onLogout}
                onViewProfile={onViewProfile}
                onViewSettings={onViewSettings}
                onViewSecurity={onViewSecurity}
                onViewHelp={onViewHelp}
            />

            {/* 欢迎横幅 */}
            <div className="PhotoWall-banner">
                <h2>🌟 欢迎回来，{user?.name || '用户'}！</h2>
                <p>今天想使用哪个模块？你的四个客户端已准备就绪。</p>
            </div>

            {/* 照片网格 */}
            <div className="PhotoWall-grid">
                {photos.map((photo) => (
                    <div key={photo.id} className="PhotoWall-item">
                        <img src={photo.url} alt={photo.caption} />
                        <div className="PhotoWall-caption">{photo.caption}</div>
                    </div>
                ))}
            </div>

            {/* 统计卡片 */}
            <div className="PhotoWall-stats">
                {stats.map((stat) => (
                    <div key={stat.id} className="PhotoWall-stat-card">
                        <div className="PhotoWall-stat-number">{stat.number}</div>
                        <div className="PhotoWall-stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(PhotoWall);