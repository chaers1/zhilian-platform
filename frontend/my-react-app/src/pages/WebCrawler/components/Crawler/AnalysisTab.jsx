/**
 * AnalysisTab.jsx - 数据分析标签页
 */
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useState, useEffect, useRef } from 'react';
import { getSpiderAnalysis, getSpiderTrent } from '../../../../api/auth';
import * as echarts from 'echarts';

export const AnalysisTab = ({ spiderType = 'movie' }) => {
    const getSpiderTypeName = (type) => {
        const names = {
            'movie': '电影',
            'news': '新闻',
            'novel': '小说',
        }
        return names[type] || names['movie'] || '电影';
    }
    const [analysisData, setAnalysisData] = useState({
        totalCount: 0,
        todayCount: 0,
        crawlFrequency: '0小时',
        successRate: '0%'
    });

    // 数据加载状态
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysisData = async () => {
            setLoading(true);
            const result = await getSpiderAnalysis(spiderType);
            console.log('111111数据分析返回:', result)
            if (result.success) {
                const data = result.data;

                setAnalysisData({
                    totalCount: data.total_items || 0,
                    todayCount: data.today_items || 0,
                    crawlFrequency: data.speed || '0小时',
                    successRate: data.success_rate || '0%'
                });
            }
            setLoading(false);
        };
        fetchAnalysisData();
    }, [spiderType])


    // 七天数据分析-折线图数据
    const [trendData, setTrendData] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        const trendAnalysisData = async () => {
            setLoading(true);
            // 请求
            const result = await getSpiderTrent(spiderType);
            console.log('222222七天内数据分析返回:', result)
            if (result.success) {
                const data = result.data;
                setTrendData(data);
            }
            setLoading(false);
        };
        trendAnalysisData();
    }, [spiderType]);

    useEffect(() => {
        if (!chartRef.current || trendData.length === 0)
            return;
        let chart = chartInstance.current;

        // 如果已有实例，先销毁
        if (chart && !chart.isDisposed()) {
            chart.dispose();
        }
        chartInstance.current = echarts.init(chartRef.current);
        chart = chartInstance.current;

        // 配置图表格数据
        const dates = trendData.map(item => item.date);
        const totals = trendData.map(item => item.total);
        const speeds = trendData.map(item => item.speed);
        const successRates = trendData.map(item => item.success_rate);

        // 配置图表格选项
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#999'
                    }
                },
                backgroundColor: 'rgba(255, 255, 255, 255)',
                borderColor: '#ccc',
                borderWidth: 1,
                padding: [12, 16],
                textStyle: {
                    color: '#333',
                    fontSize: 14
                },
                formatter: function (params) {
                    let result = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>`;
                    params.forEach(item => {
                        result += `<div style="display: flex; align-items: center; margin: 4px 0;">`;
                        result += `<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${item.color}; margin-right: 8px;"></span>`;
                        result += `<span style="flex: 1;">${item.seriesName}:</span>`;
                        result += `<span style="font-weight: bold; margin-left: 12px;">${item.value}`;
                        if (item.seriesName.includes('速度')) {
                            result += ' 条/分钟';
                        } else if (item.seriesName.includes('成功率')) {
                            result += '%';
                        }
                        result += `</span>`;
                        result += `</div>`;
                    });
                    return result;
                }
            },
            legend: {
                data: ['抓取总数', '抓取速度(条/分钟)', '成功率(%)'],
                top: 10
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: 60,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLabel: {
                    color: '#666'
                },
                axisLine: {
                    lineStyle: {
                        color: '#ddd'
                    }
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '数量',
                    min: 0,
                    axisLabel: {
                        color: '#666'
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#ddd'
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#eee'
                        }
                    }
                },
                {
                    type: 'value',
                    name: '速度/成功率',
                    min: 0,
                    max: 100,
                    axisLabel: {
                        color: '#666'
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#ddd'
                        }
                    },
                    splitLine: {
                        show: false
                    }
                }
            ],
            series: [
                {
                    name: '抓取总数',
                    type: 'line',
                    smooth: true,
                    data: totals,
                    lineStyle: {
                        width: 3,
                        color: '#5470c6'
                    },
                    itemStyle: {
                        color: '#5470c6'
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
                            { offset: 1, color: 'rgba(84, 112, 198, 0.05)' }
                        ])
                    }
                },
                {
                    name: '抓取速度(条/分钟)',
                    type: 'line',
                    yAxisIndex: 1,
                    smooth: true,
                    data: speeds,
                    lineStyle: {
                        width: 2,
                        color: '#91cc75'
                    },
                    itemStyle: {
                        color: '#91cc75'
                    }
                },
                {
                    name: '成功率(%)',
                    type: 'line',
                    yAxisIndex: 1,
                    smooth: true,
                    data: successRates,
                    lineStyle: {
                        width: 2,
                        color: '#fac858'
                    },
                    itemStyle: {
                        color: '#fac858'
                    }
                }
            ]
        };

        chartInstance.current.setOption(option);

        const handleResize = () => {
            chartInstance.current?.resize();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };

    }, [trendData])


    return (
        <div>
            <div className='stats-grid'>
                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-database'></i>
                    </div>
                    <div className='stat-value'>
                        {loading ? '加载中...' : analysisData.totalCount.toLocaleString()}
                    </div>
                    <div className='stat-label'>{getSpiderTypeName(spiderType)}
                        爬虫数据量
                    </div>
                </div>

                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-chart-line'></i>
                    </div>
                    <div className='stat-value'>
                        {loading ? '加载中...' : analysisData.todayCount.toLocaleString()}
                    </div>
                    <div className='stat-label'>今日新增</div>
                </div>

                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-clock'></i>
                    </div>
                    <div className='stat-value'>
                        {loading ? '加载中...' : analysisData.crawlFrequency}
                    </div>
                    <div className='stat-label'>今日抓取频率（小时/分钟）</div>
                </div>

                <div className='stat-card-glass'>
                    <div className='stat-icon'>
                        <i className='fas fa-check-circle'></i>
                    </div>
                    <div className='stat-value'>
                        {loading ? '加载中...' : analysisData.successRate}
                    </div>
                    <div className='stat-label'>成功率</div>
                </div>
            </div>
            <div className='chart-card'>

                <div className='chart-title'>
                    <i className='fas fa-chart-line'></i>
                    {getSpiderTypeName(spiderType)} - 近7天抓取趋势
                </div>
                <div ref={chartRef} className='chart-container'></div>

            </div>
        </div>
    );
}

export default AnalysisTab;