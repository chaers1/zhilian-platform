/**
 * MonitorTab.jsx - 运行监控标签页
 */
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useState } from 'react';
import { controlSpider } from '../../../../api/auth'

// 直接接收父组件计算好的 runTime！
export const MonitorTab = ({ crawlerName, spiderType, currentStatus,
    onStatusChange, runTime, startTime, currentCount, totalExpected, progressPercent, logs }) => {

    /**
     * 状态标签
     * 显示当前状态，包括空闲、运行中、已停止
     * 显示上次运行时间，格式为 HH:mm:ss
     * 点击状态标签可以切换状态
     * crawlerName - 爬虫名称
     * spiderType - 爬虫类型
     * currentStatus - 当前状态（来自父组件）
     * onStatusChange - 状态切换回调函数
     * runTime - 运行时长（来自父组件，已经计算好）
     */
    // 直接使用来自父组件的状态
    const status = currentStatus || 'idle';
    const [loading, setLoading] = useState(false);

    // 格式化启动时间
    const formatStartTime = (timestamp) => {
        if (!timestamp) return '--:--:--';
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };
    const displayStartTime = formatStartTime(startTime);

    // 启动爬虫函数
    const handleStart = async () => {
        try {
            const result = await controlSpider(spiderType, 'start');
            if (result.success) {
                if (onStatusChange) onStatusChange('running');
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('链接失败，请检查网路')
        } finally {
            setLoading(false);
        }
    };

    // 停止爬虫函数
    const handleStop = async () => {
        try {
            const result = await controlSpider(spiderType, 'stop');
            if (result.success) {
                if (onStatusChange) onStatusChange('stopped');
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('连接失败，请检查网络');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* 爬虫头部 */}
            <div className='crawler-header'>
                <div className='crawler-info'>
                    <span className={`status-dot ${status} large`}></span>
                    <span className='crawler-name'>{crawlerName}</span>

                    <span className={`status-tag ${status}`}>{status === 'running' ?
                        '运行中' : status === 'idle' ? '空闲' : '已停止'}
                    </span>

                </div>

                <div className='crawler-actions'>
                    <button className='btn btn-start'
                        onClick={handleStart}><i className='fas fa-play'></i>
                        启动
                    </button>

                    <button className='btn btn-stop'
                        onClick={handleStop}
                    >
                        <i className='fas fa-stop'></i>
                        停止
                    </button>

                </div>
            </div>

            {/* 统计卡片 */}
            <div className='stats-grid'>
                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-microchip'></i>
                    </div>

                    <div className='stat-value'>{status === 'running' ?
                        '运行中' : status === 'idle' ? '空闲' : '已停止'}</div>

                    <div className='stat-label'>当前状态</div>
                </div>
                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-database'></i>
                    </div>
                    <div className='stat-value'>{currentCount}/{totalExpected}</div>
                    <div className='stat-label'>抓取数量</div>
                </div>
                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-hourglass-half'></i>
                    </div>
                    <div className='stat-value'>{runTime}</div>
                    <div className='stat-label'>运行时长</div>
                </div>
                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-clock'></i>
                    </div>
                    <div className='stat-value'>{displayStartTime}</div>
                    <div className='stat-label'>启动时间</div>
                </div>
            </div>

            {/* 实时日志（双栏布局） */}
            <div className='logs-container'>
                {/* 全部日志 */}
                <div>
                    <div className='chart-title'>
                        <i className='fas fa-terminal'></i>
                        实时日志
                    </div>
                    <div className='log-terminal'>
                        {logs && logs.length > 0 ? (
                            logs.map((log, index) => {
                                const parts = log.split('|');
                                const time = parts[0] || '';
                                const type = parts[1] || 'info';
                                const content = parts[2] || '';

                                const getLogClass = (logType) => {
                                    switch (logType.toLowerCase()) {
                                        case 'success':
                                            return 'log-success';
                                        case 'error':
                                            return 'log-error';
                                        case 'warning':
                                        case 'warn':
                                            return 'log-warning';
                                        case 'info':
                                        default:
                                            return 'log-info';
                                    }
                                };

                                return (
                                    <div key={index} className='log-line'>
                                        <span className='log-time'>[{time}]</span>
                                        <span className={getLogClass(type)}>{content}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className='log-line'>
                                <span className='log-info'>暂无日志</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 错误日志 */}
                <div>
                    <div className='chart-title'>
                        <i className='fas fa-exclamation-circle'></i>
                        错误日志
                    </div>
                    <div className='log-terminal error-only'>
                        {logs && logs.filter(log => log.includes('|error|')).length > 0 ? (
                            logs.filter(log => log.includes('|error|')).map((log, index) => {
                                const parts = log.split('|');
                                const time = parts[0] || '';
                                const content = parts[2] || '';

                                return (
                                    <div key={index} className='log-line'>
                                        <span className='log-time'>[{time}]</span>
                                        <span className='log-error'>{content}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className='log-line'>
                                <span className='log-info'>暂无错误</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 历史记录 */}
            <div className='history-section'>
                <div className='chart-title'>
                    <i className='fas fa-history'></i>
                    历史运行记录
                </div>
                <div className='history-item'>
                    <span className='history-time'>03-31 14:30</span>
                    <span>🔄 running</span>
                </div>
                <div className='history-item'>
                    <span className='history-time'>03-31 08:00</span>
                    <span>✅ success 抓取 198 条 5分23秒</span>
                </div>
            </div>
        </div>
    );
}

export default MonitorTab;