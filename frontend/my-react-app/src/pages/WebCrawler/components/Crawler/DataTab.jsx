/**
 * DataTab.jsx - 数据标签页
 */
import '@fortawesome/fontawesome-free/css/all.min.css';
import { getDashboardStats } from '../../../../api/auth'
export const DataTab = ({ crawlerName }) => {
    return (
        <div className='search-bar'>
            <input type='text' className='search-input' id='searchInput' placeholder='搜索数据' />
            <select id="categorySelect" className='search-select'>
                <option value="">全部</option>
                <option value="movie">电影</option>
                <option value="news">新闻</option>
                <option value="novel">小说</option>
            </select>
            <button className='btn btn-export'>导出CSV
                <i className="fas fa-download"></i>
            </button>
            <table className='data-table'>
                <thead>
                    <tr>
                        <th>id</th>
                        <th>标题</th>
                        <th>剧情</th>
                        <th>评分</th>
                        <th>日期</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>肖申克的救赎</td>
                        <td>剧情</td>
                        <td>9.7</td>
                        <td>2024-0--30</td>
                        <td>
                            <button className='btn' style={{ 'background': '#667eea', 'padding': '4px 12px' }}>查看</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default DataTab;