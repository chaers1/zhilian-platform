/**
 * Crawler.jsx 主内容组件
 * 爬虫页面组件 * 
 * @returns {JSX.Element} 爬虫页面组件
 */
import './Crawler.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MonitorTab from './MonitorTab';  // 导入组件
import AnalysisTab from './AnalysisTab';  // 导入组件
import DataTab from './DataTab';  // 导入组件



export const Crawler = ({ sidebarOpen, onToggleSidebar, crawlerName, spiderType,
    onStatusChange, currentStatus, runTime, startTime, currentCount,
    totalExpected, progressPercent, logs }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('monitor');  // 添加标签状态

    return (
        <div id='mainContent' className="main-content">
            {/* header */}
            <div className='content-header'>
                <div className='collapse-btn'>
                    <button className={`sidebar-toggle-btn ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} onClick={onToggleSidebar}>
                        <i className='fas fa-bars'></i>
                    </button>
                </div>
                <div className='header-title'>
                    <h1 id='pageTitle'>{crawlerName}</h1>
                    <p id='pageSubtitle'>运行监控 · 数据分析 · 数据管理</p>
                </div>
                <div className='header-actions'>
                    <button className='btn-back-home' onClick={() => navigate('/')}>
                        <i className='fas fa-home'></i>
                        <span>返回首页</span>
                    </button>
                </div>
            </div>

            <div id='rightContent' className='content-card'>
                {/* 标签导航 */}
                <div className='tabs'>
                    <div
                        className={`tab ${activeTab === 'monitor' ? 'active' : ''}`}
                        onClick={() => setActiveTab('monitor')}
                    >📡 运行监控</div>
                    <div
                        className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analysis')}
                    >📊 数据分析</div>
                    <div
                        className={`tab ${activeTab === 'data' ? 'active' : ''}`}
                        onClick={() => setActiveTab('data')}
                    >🔄 抓取数据</div>
                </div>

                {/* 内容区域 - 使用条件渲染 */}
                {activeTab === 'monitor' && (

                    <div className='tab-content active'>

                        <MonitorTab crawlerName={crawlerName} spiderType={spiderType}
                            currentStatus={currentStatus} onStatusChange={onStatusChange}
                            runTime={runTime} startTime={startTime} currentCount={currentCount}
                            totalExpected={totalExpected} progressPercent={progressPercent}
                            logs={logs} />
                    </div>
                )}
                {activeTab === 'analysis' && (
                    <div className='tab-content active'>
                        {/* 数据分析内容（后续添加） */}
                        <AnalysisTab crawlerName={crawlerName} />
                    </div>
                )}
                {activeTab === 'data' && (
                    <div className='tab-content active'>
                        <DataTab crawlerName={crawlerName} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Crawler;