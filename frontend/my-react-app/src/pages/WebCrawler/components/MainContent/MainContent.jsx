/**
 * MainContent.jsx 主内容组件
 * 总体概览页面组件 * 
 * @returns {JSX.Element} 总体概览页面组件
 */

import '@fortawesome/fontawesome-free/css/all.min.css'
import './MainContent.css'
import * as echarts from 'echarts'
import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../../../../api/auth'

const MainContent = ({ sidebarOpen, onToggleSidebar }) => {
    const navigate = useNavigate()
    const lineChartRef = useRef(null)
    const pieChartRef = useRef(null)
    const lineChartInstance = useRef(null)
    const pieChartInstance = useRef(null)

    // 统计数据展示
    const [statsData, setStatsData] = useState({})
    const [loading, setLoading] = useState(true)
    // api获取数据
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await getDashboardStats()
                if (result.success) {
                    const data = result.data
                    setStatsData([
                        { icon: 'fas fa-database', value: data.total_data || '没有接收到后端返回的数据', label: '总数据量' },
                        { icon: 'fas fa-chart-line', value: data.today_new || '0', label: '今日新增' },
                        { icon: 'fas fa-calendar-week', value: data.avg_daily || '没有接收到后端返回的数据', label: '日均抓取' },
                        { icon: 'fas fa-check-circle', value: data.success_rate || '没有接收到后端返回的数据', label: '成功率' },
                    ])
                    console.log(data)
                }
            } catch (error) {
                console.error('获取数据统计失败:', error)
                setStatsData([
                    { icon: 'fas fa-database', value: '0', label: '总数据量' },
                    { icon: 'fas fa-chart-line', value: '0', label: '今日新增' },
                    { icon: 'fas fa-calendar-week', value: '0', label: '日均抓取' },
                    { icon: 'fas fa-check-circle', value: '0%', label: '成功率' },
                ])
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    // 折线图数据（静态数据，移到组件外部更好，这里简化处理）
    const trenData = {
        xAxis: ['03/24', '03/25', '03/26', '03/27', '03/28', '03/29', '03/30'],
        series: [240, 280, 300, 290, 320, 330, 310],
    }
    useEffect(() => {

        if (lineChartRef.current) {
            const chart = echarts.init(lineChartRef.current)
            lineChartInstance.current = chart
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(15, 20, 45, 0.9)',
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                    textStyle: { color: '#fff' }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: trenData.xAxis,
                    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
                    axisLabel: { color: 'rgba(255,255,255,0.6)' }
                },
                yAxis: {
                    type: 'value',
                    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
                    axisLabel: { color: 'rgba(255,255,255,0.6)' },
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
                },
                series: [{
                    data: trenData.series,
                    type: 'line',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#667eea' },
                            { offset: 1, color: '#764ba2' }
                        ])
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(102, 126, 234, 0.4)' },
                            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
                        ])
                    },
                    itemStyle: { color: '#667eea' },
                    symbol: 'circle',
                    symbolSize: 8
                }]
            }
            chart.setOption(option)
            // 响应式
            window.addEventListener('resize', () => chart.resize())
            return () => {
                window.removeEventListener('resize', () => chart.resize())
                chart.dispose()
            }
        }
    }, []) // ✅ 静态数据，依赖数组为空，只执行一次

    // 饼图数据
    const pieData = [
        { value: 4200, name: '电影数据' },
        { value: 3800, name: '新闻数据' },
        { value: 2600, name: '小说数据' },
        { value: 1880, name: '其他数据' },
    ]

    // 初始化饼图
    useEffect(() => {
        if (pieChartRef.current) {
            const chart = echarts.init(pieChartRef.current)
            pieChartInstance.current = chart

            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(15, 20, 45, 0.9)',
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                    textStyle: { color: '#fff' },
                    formatter: '{b}: {c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    right: '5%',
                    top: 'center',
                    textStyle: { color: 'rgba(255,255,255,0.7)' }
                },
                series: [{
                    name: '数据分类',
                    type: 'pie',
                    radius: ['45%', '70%'],
                    center: ['35%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: 'rgba(15, 20, 45, 0.8)',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: '#fff'
                        },
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    },
                    labelLine: { show: false },
                    data: [
                        { value: pieData[0].value, name: pieData[0].name, itemStyle: { color: '#667eea' } },
                        { value: pieData[1].value, name: pieData[1].name, itemStyle: { color: '#764ba2' } },
                        { value: pieData[2].value, name: pieData[2].name, itemStyle: { color: '#f093fb' } },
                        { value: pieData[3].value, name: pieData[3].name, itemStyle: { color: '#4facfe' } },
                    ]
                }]
            }

            chart.setOption(option)

            window.addEventListener('resize', () => chart.resize())

            return () => {
                window.removeEventListener('resize', () => chart.resize())
                chart.dispose()
            }
        }
    }, []) // ✅ 静态数据，依赖数组为空，只执行一次

    // 表格数据
    const tableData = [
        { name: '电影爬虫', status: '空闲', frequency: '每小时', count: 24 },
        { name: '新闻爬虫', status: '已停止', frequency: '每30分钟', count: 0 },
        { name: '小说爬虫', status: '运行中', frequency: '每2小时', count: 12 },
        { name: '图片爬虫', status: '空闲', frequency: '每天', count: 1 },
    ]


    // 侧边栏打开/关闭时，调整图表大小
    useEffect(() => {
        // 延迟一点执行，确保 DOM 已经更新
        const timer = setTimeout(() => {
            if (lineChartInstance.current) {
                lineChartInstance.current.resize()
            }
            if (pieChartInstance.current) {
                pieChartInstance.current.resize()
            }
        }, 100)

        return () => clearTimeout(timer)
    }, [sidebarOpen])


    return (
        <div id='mainContent' className='main-content'>
            <div className='content-header'>
                { /* 侧边栏切换按钮 */}
                <div className='collapse-btn'>
                    <button className={`sidebar-toggle-btn ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} onClick={onToggleSidebar}>
                        <i className='fas fa-bars'></i>
                    </button>
                </div>
                <div className='header-title'>
                    <h1 id='pageTitle'>总体概览</h1>
                    <p id='pageSubtitle'>实时监控 · 智能分析 · 数据管理</p>
                </div>
                <div className='header-actions'>
                    <button className='btn-back-home' onClick={() => navigate('/')}>
                        <i className='fas fa-home'></i>
                        <span>返回首页</span>
                    </button>
                </div>
            </div>
            <div id='rightContent' className='content-card'>
                <div style={{ padding: '25px' }}>
                    <div className='stats-grid'>
                        {loading ? (
                            <>
                                {[1, 2, 3, 4].map((item) => (
                                    <div className='stat-card-glass' key={item}>
                                        <div className='stat-icon'>
                                            <i className="fas fa-spinner fa-spin"></i>
                                        </div>
                                        <div className='stat-value'>--</div>
                                        <div className='stat-label'>加载中...</div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            statsData.map((stat, index) => (
                                <div className='stat-card-glass' key={index}>
                                    <div className='stat-icon'>
                                        <i className={stat.icon}></i>
                                    </div>
                                    <div className='stat-value'>{stat.value}</div>
                                    <div className='stat-label'>{stat.label}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className='chart-card'>
                        <div className='chart-title'>
                            <i className='fas fa-chart-line'></i>
                            7天数据抓取趋势
                        </div>
                        <div ref={lineChartRef} id='overviewTrendChart' className='chart-container'>

                        </div>
                    </div>

                    <div className='two-columns'>
                        <div className='chart-card'>
                            <div className='chart-title'>
                                <i className='fas fa-chart-pie'></i>
                                数据分类分布
                            </div>
                            <div ref={pieChartRef} id='overviewCategoryChart' className='chart-container'></div>
                        </div>

                        <div className='chart-card'>
                            <div className='chart-title'>
                                <i className='fas fa-chart-line'></i>
                                爬虫抓取频率
                            </div>
                            <div className='table-wrapper'>
                                <table className='data-table'>
                                    <thead>
                                        <tr>
                                            <th>爬虫名称</th>
                                            <th>状态</th>
                                            <th>抓取频率</th>
                                            <th>抓取次数/</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.name}</td>
                                                <td>{item.status}</td>
                                                <td>{item.frequency}</td>
                                                <td>{item.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MainContent;