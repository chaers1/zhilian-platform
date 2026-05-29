/**
 * AnalysisTab.jsx - 数据分析标签页
 */
import '@fortawesome/fontawesome-free/css/all.min.css';

export const AnalysisTab = ({ crawlerName }) => {
    return (
        <div>
            <div className='stats-grid'>
                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-database'></i>
                    </div>
                    <div className='stat-value'>
                        3995
                    </div>
                    <div className='stat-label'>该爬虫数据量</div>
                </div>

                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-chart-line'></i>
                    </div>
                    <div className='stat-value'>
                        39
                    </div>
                    <div className='stat-label'>今日新增</div>
                </div>

                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-clock'></i>
                    </div>
                    <div className='stat-value'>
                        6小时
                    </div>
                    <div className='stat-label'>抓取频率</div>
                </div>

                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-check-circle'></i>
                    </div>
                    <div className='stat-value'>
                        93%
                    </div>
                    <div className='stat-label'>成功率</div>
                </div>
            </div>
            <div className='chart-card'>
                <div className='chart-title'>
                    <i className='fas fa-chart-line'></i>
                    电影爬虫 - 近7天抓取趋势
                </div>
            </div>
        </div>
    );
}

export default AnalysisTab;