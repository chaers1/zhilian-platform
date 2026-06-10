/**
 * 数据列表页面 - 独立页面组件
 * 获取爬虫抓取的数据列表，包括显示、搜索、导出CSV，和过滤功能，需要通过选择不同的爬虫类型来获取不同的过滤条件
 */
import { useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { getMovieData, getNewsData, getNovelData, getAllData, getCascadeFilters, getDataDetail, exportCsv } from '../../../../api/auth';
import './DataList.css';
import { useNavigate } from 'react-router-dom';

// 模拟数据 - 生成更多数据以展示滚动效果

const generateNewsData = () => {
    const news = [
        { title: '人工智能技术取得重大突破', source: '新华网', author: '科技记者', category: '科技' },
        { title: '新能源汽车销量创历史新高', source: '人民网', author: '财经编辑', category: '财经' },
        { title: '国际体育赛事即将开幕', source: '央视新闻', author: '体育记者', category: '体育' },
        { title: '文化遗产保护成果显著', source: '澎湃新闻', author: '特约记者', category: '时政' },
        { title: '互联网行业监管新规出台', source: '今日头条', author: '官方发布', category: '时政' },
        { title: '医疗健康服务持续改善', source: '新华网', author: '通讯员', category: '时政' },
        { title: '影视行业迎来发展新机遇', source: '人民网', author: '娱乐记者', category: '娱乐' },
        { title: '教育改革稳步推进', source: '央视新闻', author: '教育编辑', category: '时政' },
        { title: '股市行情分析报告', source: '澎湃新闻', author: '财经记者', category: '财经' },
        { title: '天气变化趋势预测', source: '今日头条', author: '气象专家', category: '科技' },
    ];
    const data = [];
    for (let i = 1; i <= 100; i++) {
        const item = news[(i - 1) % news.length];
        data.push({
            id: i,
            title: item.title,
            source: item.source,
            author: item.author,
            category: item.category,
            date: '2024-06-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
        });
    }
    return data;
};

const generateNovelData = () => {
    const novels = [
        { title: '斗破苍穹', author: '天蚕土豆', status: '已完结', category: '玄幻' },
        { title: '斗罗大陆', author: '唐家三少', status: '已完结', category: '玄幻' },
        { title: '凡人修仙传', author: '忘语', status: '已完结', category: '仙侠' },
        { title: '诡秘之主', author: '爱潜水的乌贼', status: '已完结', category: '悬疑' },
        { title: '全职高手', author: '蝴蝶蓝', status: '已完结', category: '都市' },
        { title: '雪中悍刀行', author: '烽火戏诸侯', status: '已完结', category: '玄幻' },
        { title: '剑来', author: '烽火戏诸侯', status: '连载中', category: '仙侠' },
        { title: '星辰变', author: '我吃西红柿', status: '已完结', category: '玄幻' },
        { title: '吞噬星空', author: '我吃西红柿', status: '已完结', category: '科幻' },
        { title: '一念永恒', author: '耳根', status: '连载中', category: '仙侠' },
    ];
    const data = [];
    for (let i = 1; i <= 100; i++) {
        const item = novels[(i - 1) % novels.length];
        data.push({
            id: i,
            title: item.title,
            author: item.author,
            status: item.status,
            category: item.category,
            date: '2024-06-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
        });
    }
    return data;
};

const mockData = {
    news: generateNewsData(),
    novel: generateNovelData(),
};

export const DataList = ({ sidebarOpen, onToggleSidebar }) => {
    const navigate = useNavigate();

    // 搜索状态
    const [keyword, setKeyword] = useState('');
    const [selectedType, setSelectedType] = useState('movie');

    // 级联筛选条件
    const [cascadeFilters, setCascadeFilters] = useState({});
    const [appliedCascadeFilters, setAppliedCascadeFilters] = useState({});

    // 级联筛选配置（从后端获取）
    const [filterConfig, setFilterConfig] = useState(null);
    const [filterConfigLoading, setFilterConfigLoading] = useState(false);

    // 数据状态
    const [dataList, setDataList] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(30);
    // 动画状态
    const [isAnimating, setIsAnimating] = useState(false);

    // 详情弹窗状态
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // csv 导出状态
    const [csvData, setCsvData] = useState(null); // 临时存储csv数据
    const [isExporting, setIsExporting] = useState(false); // 导出状态

    // 默认筛选配置
    const defaultFilterConfig = {
        movie: [
            { key: 'year', label: '上映时间', options: ['全部', '2020年后', '2010-2020', '2000-2010', '2000年前'] },
            { key: 'rating', label: '评分', options: ['全部', '9分以上', '8-9分', '7-8分', '7分以下'] }
        ],
        news: [
            { key: 'source', label: '新闻来源', options: ['全部', '新华网', '人民网', '央视新闻', '澎湃新闻', '今日头条'] },
            { key: 'category', label: '新闻分类', options: ['全部', '时政', '财经', '科技', '娱乐', '体育'] },
            { key: 'author', label: '作者类型', options: ['全部', '官方', '特约记者', '通讯员'] }
        ],
        novel: [
            { key: 'status', label: '连载状态', options: ['全部', '连载中', '已完结', '暂停更新'] },
            { key: 'category', label: '小说分类', options: ['全部', '都市', '玄幻', '仙侠', '言情', '悬疑', '科幻'] },
            { key: 'wordCount', label: '字数', options: ['全部', '100万以上', '50-100万', '10-50万', '10万以下'] }
        ],
        all: [
            { key: 'date_range', label: '日期范围', options: ['全部', '今天', '昨天', '近7天', '近30天'] },
            { key: 'error_data', label: '错误数据', options: ['全部', '近7天', '近30天'] }
        ]
    };

    // 获取级联筛选配置
    const fetchFilterConfig = async () => {
        setFilterConfigLoading(true);
        try {
            const response = await getCascadeFilters();
            if (response.code === 200 && response.data) {
                const mergedConfig = {};
                const types = ['movie', 'news', 'novel', 'all'];
                types.forEach(type => {
                    const backendFilters = response.data[type] || [];
                    const defaultFilters = defaultFilterConfig[type] || [];
                    const backendKeys = backendFilters.map(f => f.key);
                    const extraFilters = defaultFilters.filter(f => !backendKeys.includes(f.key));
                    mergedConfig[type] = [...backendFilters, ...extraFilters];
                });
                setFilterConfig(mergedConfig);
            } else {
                setFilterConfig(defaultFilterConfig);
            }
        } catch (error) {
            console.error('获取筛选配置失败:', error);
            setFilterConfig(defaultFilterConfig);
        } finally {
            setFilterConfigLoading(false);
        }
    };

    // 页面加载时获取筛选配置
    useEffect(() => {
        fetchFilterConfig();
    }, []);

    // 当爬虫类型变化时，重置级联筛选条件
    useEffect(() => {
        const config = filterConfig || defaultFilterConfig;
        if (selectedType && config[selectedType]) {
            const initialFilters = {};
            config[selectedType].forEach(filter => {
                initialFilters[filter.key] = '全部';
            });
            setCascadeFilters(initialFilters);
        } else {
            setCascadeFilters({});
        }
        setCurrentPage(1);
        fetchData(1);
    }, [selectedType, filterConfig]);

    // 获取数据
    const fetchData = async (page) => {
        setLoading(true);
        setIsAnimating(true);

        // 准备筛选参数（过滤掉全部选项）
        const filterParams = {};
        Object.entries(cascadeFilters).forEach(([key, value]) => {
            if (value !== '全部') {
                filterParams[key] = value;
            }
        });

        // 根据类型调用不同的接口
        let response;
        switch (selectedType) {
            case 'movie':
                response = await getMovieData(keyword, filterParams);
                break;
            case 'news':
                response = await getNewsData(keyword, filterParams);
                break;
            case 'novel':
                response = await getNovelData(keyword, filterParams);
                break;
            default:
                response = await getAllData(keyword, filterParams);
        }

        let data = response.success ? (response.data || []) : [];

        // 如果接口返回空，使用模拟数据
        if (!Array.isArray(data) || data.length === 0) {
            if (selectedType && mockData[selectedType]) {
                data = mockData[selectedType];
            } else {
                let allData = [];
                Object.keys(mockData).forEach(type => {
                    allData = [...allData, ...mockData[type].map(item => ({ ...item, spider_type: type }))];
                });
                data = allData;
            }
        }

        // 级联筛选
        const config = filterConfig || defaultFilterConfig;
        if (selectedType && config[selectedType]) {
            Object.entries(cascadeFilters).forEach(([key, value]) => {
                if (value !== '全部') {
                    switch (key) {
                        case 'categories_str':
                            data = data.filter(item => item.categories_str?.includes(value));
                            break;
                        case 'region':
                            data = data.filter(item => item.region === value);
                            break;
                        case 'year':
                            data = filterByYear(data, value);
                            break;
                        case 'source':
                            data = data.filter(item => item.source === value);
                            break;
                        case 'category':
                            data = data.filter(item => item.category?.includes(value));
                            break;
                        case 'author':
                            const authorMap = { '官方': '官方', '特约记者': '特约记者', '通讯员': '通讯员' };
                            data = data.filter(item => item.author?.includes(authorMap[value] || value));
                            break;
                        case 'status':
                            data = data.filter(item => item.status === value);
                            break;
                        case 'wordCount':
                            break;
                        default:
                            break;
                    }
                }
            });
        }

        // 分页处理
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = data.slice(startIndex, endIndex);

        setDataList(paginatedData);
        setTotal(data.length);
        setLoading(false);
        setIsAnimating(false);
    };

    // 年份范围过滤
    const filterByYear = (data, range) => {
        return data.filter(item => {
            // 优先使用 release_date，如果不存在则使用 year
            const dateStr = item.release_date || item.year;
            const year = parseInt(dateStr);
            if (isNaN(year)) return true; // 如果无法解析年份，返回true（不过滤）

            switch (range) {
                case '2020年后': return year >= 2020;
                case '2010-2020': return year >= 2010 && year < 2020;
                case '2000-2010': return year >= 2000 && year < 2010;
                case '2000年前': return year < 2000;
                default: return true;
            }
        });
    };

    // 查看详情处理
    const handleViewDetail = async (item) => {
        setDetailLoading(true);
        setDetailModalVisible(true);
        setDetailData(null);

        try {
            // 根据类型获取名称字段
            let name = item.title || item.name || '';
            const result = await getDataDetail(selectedType, item.id, name);

            if (result.success) {
                setDetailData(result.data);
            } else {
                // 如果接口调用失败，使用当前数据
                setDetailData(item);
                alert(result.message || '获取详情失败，将显示列表数据');
            }
        } catch (error) {
            console.error('查看详情失败:', error);
            setDetailData(item); // 使用列表数据作为后备
            alert('获取详情失败，将显示列表数据');
        } finally {
            setDetailLoading(false);
        }
    };

    // 关闭详情弹窗
    const handleCloseDetail = () => {
        setDetailModalVisible(false);
        setDetailData(null);
    };

    // 分页切换
    const handlePageChange = (page) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentPage(page);
            fetchData(page);
        }, 150);
    };

    // 级联筛选变化处理
    const handleCascadeFilterChange = (filterKey, value) => {
        setCascadeFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
        setCurrentPage(1);
    };

    // 应用筛选条件
    const handleApplyFilter = () => {
        setAppliedCascadeFilters({ ...cascadeFilters });
        setCurrentPage(1);
        fetchData(1);
    };

    // 重置筛选条件
    const handleResetFilter = () => {
        const config = filterConfig || defaultFilterConfig;
        const initialFilters = {};
        if (selectedType && config[selectedType]) {
            config[selectedType].forEach(filter => {
                initialFilters[filter.key] = '全部';
            });
        }
        setCascadeFilters(initialFilters);
        setAppliedCascadeFilters({});
        setCurrentPage(1);
    };

    // 搜索按钮点击
    const handleSearch = () => {
        setCurrentPage(1);
        fetchData(1);
    };

    // 导出CSV
    const handleExport = async () => {
        setIsExporting(true);
        try {
            // 收集表格中所有数据的id

            console.log('导出 - 数据类型:', selectedType);
            console.log('导出 - 搜索关键词:', keyword);
            console.log('导出 - 筛选条件:', cascadeFilters);

            // 2. 调用后端接口
            const params = {
                type: selectedType,
                keyword: keyword,
                cascadeFilters: cascadeFilters
            }
            const response = await exportCsv(params);
            console.log('导出响应:', response);

            // 3. 处理返回结果

            if (response.success && response.data) {
                const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${selectedType}_data.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                alert(response.message || '导出失败');
            }


        } catch (error) {
            console.error('导出CSV失败:', error);
            alert('导出失败，请重试');
        } finally {
            setIsExporting(false);
        }
    };

    // 获取表格列配置
    const getColumns = () => {
        switch (selectedType) {
            case 'movie':
                return [
                    { key: 'id', label: 'ID', width: '80px' },
                    { key: 'name', label: '电影名', width: '100px' },
                    { key: 'categories_str', label: '电影类别', width: '80px' },
                    { key: 'region', label: '地区', width: '80px' },
                    { key: 'release_date', label: '上映日期', width: '80px' },
                    { key: 'score', label: '评分', width: '30px' },
                    { key: 'duration', label: '时长', width: '50px' },
                    { key: 'action', label: '操作', width: '100px' }
                ];
            case 'news':
                return [
                    { key: 'id', label: 'ID' },
                    { key: 'title', label: '标题' },
                    { key: 'source', label: '来源' },
                    { key: 'author', label: '作者' },
                    { key: 'category', label: '分类' },
                    { key: 'date', label: '抓取日期' },
                    { key: 'action', label: '操作' }
                ];
            case 'novel':
                return [
                    { key: 'id', label: 'ID' },
                    { key: 'title', label: '书名' },
                    { key: 'author', label: '作者' },
                    { key: 'status', label: '状态' },
                    { key: 'category', label: '分类' },
                    { key: 'date', label: '抓取日期' },
                    { key: 'action', label: '操作' }
                ];
            default:
                return [
                    { key: 'id', label: 'ID' },
                    { key: 'title', label: '标题/书名' },
                    { key: 'type', label: '类型' },
                    { key: 'extra', label: '备注' },
                    { key: 'date', label: '抓取日期' },
                    { key: 'action', label: '操作' }
                ];
        }
    };

    // 渲染表格内容
    const renderTableCell = (item, column) => {
        if (column.key === 'action') {
            return (
                <button
                    className='btn btn-view'
                    onClick={() => handleViewDetail(item)}
                >
                    <i className='fas fa-eye'></i> 查看
                </button>
            );
        }

        if (column.key === 'extra') {
            if (item.rating) return item.rating;
            if (item.author) return item.author;
            return '-';
        }

        if (column.key === 'type') {
            const typeMap = { movie: '电影', news: '新闻', novel: '小说' };
            return typeMap[item.spider_type] || item.spider_type || '-';
        }

        const isTitle = column.key === 'title';

        if (isTitle) {
            return (
                <span className='title-text' title={item[column.key]}>
                    {item[column.key] || '-'}
                </span>
            );
        }

        return item[column.key] || '-';
    };

    // 计算分页
    const totalPages = Math.ceil(total / pageSize);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <div id='mainContent' className="main-content">
            <div className='content-header'>
                {/* 侧边栏切换按钮 */}
                <div className='collapse-btn'>
                    <button className={`sidebar-toggle-btn ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} onClick={onToggleSidebar}>
                        <i className='fas fa-bars'></i>
                    </button>
                </div>
                <div className='header-title'>
                    <h1 id='pageTitle'>数据查询</h1>
                    <p id='pageSubtitle'>搜索 · 筛选 · 导出数据</p>
                </div>
                <div className='header-actions'>
                    <button className='btn-back-home' onClick={() => navigate('/')}>
                        <i className='fas fa-home'></i>
                        <span>返回首页</span>
                    </button>
                </div>
            </div>

            <div id='rightContent' className={`content-card ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
                <div style={{ padding: '25px' }}>

                    {/* 搜索栏 */}
                    <div className='search-bar'>
                        <div className='search-group'>
                            <input
                                type='text'
                                className='search-input'
                                placeholder='支持标题、作者，导演等，电影名，小说名，新闻标题'
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button className='search-btn' onClick={handleSearch}>
                                <i className='fas fa-search search-icon'></i>
                            </button>
                        </div>

                        <select
                            className='search-select main-filter'
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="all">爬虫运行数据</option>
                            <option value="movie">🎬 电影数据</option>
                            <option value="news">📰 新闻数据</option>
                            <option value="novel">📚 小说数据</option>
                        </select>

                        <button
                            className='btn btn-export'
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <>
                                    <i className='fas fa-spinner fa-spin'></i> 导出中...
                                </>
                            ) : (
                                <>
                                    <i className='fas fa-download'></i> 导出CSV
                                </>
                            )}
                        </button>
                    </div>

                    {/* 级联筛选栏 */}
                    {filterConfigLoading ? (
                        <div className='cascade-filters'>
                            <span className='filter-label'>加载筛选条件中...</span>
                        </div>
                    ) : (
                        selectedType && (filterConfig || defaultFilterConfig)[selectedType] && (
                            <div className='cascade-filters'>
                                <span className='filter-label'>筛选条件：</span>
                                {(filterConfig || defaultFilterConfig)[selectedType].map(filter => (
                                    <select
                                        key={filter.key}
                                        className='search-select cascade-select'
                                        value={cascadeFilters[filter.key] || '全部'}
                                        onChange={(e) => handleCascadeFilterChange(filter.key, e.target.value)}
                                    >
                                        {filter.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ))}
                                <button className='btn btn-filter' onClick={handleApplyFilter}>
                                    <i className='fas fa-search'></i> 筛选
                                </button>
                                <button className='btn btn-reset' onClick={handleResetFilter}>
                                    <i className='fas fa-redo'></i> 重置
                                </button>
                            </div>
                        )
                    )}

                    {/* 当前筛选条件 */}
                    <div className='filter-info'>
                        <span>当前筛选：</span>
                        <span className='filter-tag'>
                            {selectedType ? (
                                { all: '全部', movie: '电影', news: '新闻', novel: '小说' }[selectedType]
                            ) : '全部类型'}
                        </span>
                        {selectedType && Object.entries(appliedCascadeFilters).map(([key, value]) => (
                            value !== '全部' && (
                                <span key={key} className='filter-tag'>
                                    {(filterConfig || defaultFilterConfig)[selectedType].find(f => f.key === key)?.label}: {value}
                                </span>
                            )
                        ))}
                        {keyword && (
                            <span className='filter-tag'>关键词: {keyword}</span>
                        )}
                        <span className='total-count'>共 {total} 条数据</span>
                    </div>

                    {/* 数据表格 */}
                    <div className='table-wrapper'>
                        <div className='data-table-body-wrapper'>
                            <table className='data-table'>
                                <thead className='data-table-header'>
                                    <tr>
                                        {getColumns().map(column => (
                                            <th
                                                key={column.key}
                                                className='table-cell header-cell'
                                                style={{
                                                    width: column.width || 'auto',
                                                    minWidth: column.width || 'auto',
                                                }}
                                            >
                                                {column.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className={isAnimating ? 'fade-out' : 'fade-in'}>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={getColumns().length} className='loading-cell'>
                                                <i className='fas fa-spinner fa-spin'></i> 加载中...
                                            </td>
                                        </tr>
                                    ) : dataList.length > 0 ? (
                                        dataList.map((item, index) => (
                                            <tr key={item.id || index} className={isAnimating ? 'fade-out' : 'fade-in'}>
                                                {getColumns().map(column => (
                                                    <td
                                                        key={column.key}
                                                        className='table-cell'
                                                        style={{ width: column.width || 'auto', minWidth: column.width || 'auto' }}
                                                    >
                                                        {renderTableCell(item, column)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={getColumns().length} className='empty-cell'>
                                                <i className='fas fa-inbox'></i> 暂无数据
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 分页 */}
                    {total > pageSize && (
                        <div className='pagination'>
                            <button
                                className='btn btn-page'
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                <i className='fas fa-chevron-left'></i>
                            </button>

                            {pages.map(page => (
                                <button
                                    key={page}
                                    className={`btn btn-page ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                className='btn btn-page'
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                <i className='fas fa-chevron-right'></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 详情弹窗 */}
            {detailModalVisible && (
                <div className='modal-overlay' onClick={handleCloseDetail}>
                    <div className='modal-content' onClick={(e) => e.stopPropagation()}>
                        <div className='modal-header'>
                            <h2>数据详情</h2>
                            <button className='modal-close' onClick={handleCloseDetail}>
                                <i className='fas fa-times'></i>
                            </button>
                        </div>
                        <div className='modal-body'>
                            {detailLoading ? (
                                <div className='detail-loading'>
                                    <i className='fas fa-spinner fa-spin'></i> 加载中...
                                </div>
                            ) : detailData ? (
                                <div className='detail-content'>
                                    {Object.entries(detailData).map(([key, value]) => {
                                        // 跳过一些不需要显示的字段
                                        if (['id', '__v', '_id'].includes(key)) return null;

                                        // 格式化字段名称
                                        const labelMap = {
                                            'title': '标题',
                                            'name': '名称',
                                            'author': '作者',
                                            'source': '来源',
                                            'category': '分类',
                                            'categories_str': '类别',
                                            'region': '地区',
                                            'rating': '评分',
                                            'score': '评分',
                                            'status': '状态',
                                            'duration': '时长',
                                            'release_date': '上映日期',
                                            'date': '抓取日期',
                                            'spider_type': '数据类型',
                                            'created_at': '创建时间',
                                            'updated_at': '更新时间',
                                            'description': '描述',
                                            'bio': '简介',
                                            "drama": "剧情",
                                            "url": "数据链接",
                                        };

                                        const label = labelMap[key] || key;

                                        // 如果值是数组或对象，转为字符串
                                        const displayValue = typeof value === 'object'
                                            ? JSON.stringify(value)
                                            : value || '-';

                                        return (
                                            <div key={key} className='detail-row'>
                                                <span className='detail-label'>{label}:</span>
                                                <span className='detail-value'>{displayValue}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className='detail-empty'>暂无数据</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataList; 