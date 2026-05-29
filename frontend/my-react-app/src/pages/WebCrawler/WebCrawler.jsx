/**
 * webcrawler.jsx 爬虫首页页面组件
 * 整个爬虫项目中的组件
 * 
 * @returns {JSX.Element} 爬虫主页面组件
 */
import './WebCrawler.css';
import { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import MainContent from './components/MainContent/MainContent.jsx';
import Layout from '../../components/Layout/Layout.jsx';
import Crawler from './components/Crawler/Crawler.jsx';
import { getSpiderStatus, getSpiderLogs } from '../../api/auth';



const WebCrawler = () => {
    const [activeItem, setActiveItem] = useState('overview'); // 当前选中项
    const [sidebarOpen, setSidebarOpen] = useState(true); // 侧边栏开关状态
    const [spiderStatus, setSpiderStatus] = useState({
        'movie-crawler': 'idle',
        'news-crawler': 'idle',
        'novel-crawler': 'idle',
    });


    // 记录每个爬虫最后运行时长
    const [spiderLastRunTimes, setSpiderLastRunTimes] = useState({
        'movie-crawler': '00:00:00',
        'news-crawler': '00:00:00',
        'novel-crawler': '00:00:00',
    });
    // 记录每个爬虫最后一次用户操作的时间
    const [spiderLastActionTimes, setSpiderLastActionTimes] = useState({
        'movie-crawler': 0,
        'news-crawler': 0,
        'novel-crawler': 0,
    });

    // 记录每个爬虫的启动时间
    const [spiderStartTimes, setSpiderStartTimes] = useState({
        'movie-crawler': null,
        'news-crawler': null,
        'novel-crawler': null,
    });
    // 记录每个爬虫当前的运行时长（实时更新）
    const [spiderRunTimes, setSpiderRunTimes] = useState({
        'movie-crawler': '00:00:00',
        'news-crawler': '00:00:00',
        'novel-crawler': '00:00:00',
    });
    // 记录每个爬虫当前的抓取数量
    const [spiderCurrentCounts, setSpiderCurrentCounts] = useState({
        'movie-crawler': 0,
        'news-crawler': 0,
        'novel-crawler': 0,
    });
    // 记录每个爬虫需要抓取的总数
    const [spiderTotalExpected, setSpiderTotalExpected] = useState({
        'movie-crawler': 0,
        'news-crawler': 0,
        'novel-crawler': 0,
    });
    // 记录每个爬虫的抓取进度百分比
    const [spiderProgressPercent, setSpiderProgressPercent] = useState({
        'movie-crawler': '0%',
        'news-crawler': '0%',
        'novel-crawler': '0%',
    });

    // 记录爬虫的实时日志（最多50条）
    const [spiderLogs, setSpiderLogs] = useState({
        'movie-crawler': [],
        'news-crawler': [],
        'novel-crawler': [],
    });

    // 使用 ref 保存最新状态（避免无限循环）
    const spiderStatusRef = useRef(spiderStatus);
    const spiderStartTimesRef = useRef(spiderStartTimes);
    const spiderRunTimesRef = useRef(spiderRunTimes);
    const spiderCurrentCountsRef = useRef(spiderCurrentCounts);
    const spiderTotalExpectedRef = useRef(spiderTotalExpected);
    const spiderProgressPercentRef = useRef(spiderProgressPercent);
    const spiderLogsRef = useRef(spiderLogs);

    // 定时器 ref（用于防止重复轮询）
    const statusIntervalRef = useRef(null);   // 状态轮询定时器
    const logsIntervalRef = useRef(null);     // 日志轮询定时器

    // 同步状态到 ref
    useEffect(() => {
        spiderStatusRef.current = spiderStatus;
    }, [spiderStatus]);
    useEffect(() => {
        spiderStartTimesRef.current = spiderStartTimes;
    }, [spiderStartTimes]);
    useEffect(() => {
        spiderRunTimesRef.current = spiderRunTimes;
    }, [spiderRunTimes]);
    useEffect(() => {
        spiderCurrentCountsRef.current = spiderCurrentCounts;
    }, [spiderCurrentCounts]);
    useEffect(() => {
        spiderTotalExpectedRef.current = spiderTotalExpected;
    }, [spiderTotalExpected]);
    useEffect(() => {
        spiderProgressPercentRef.current = spiderProgressPercent;
    }, [spiderProgressPercent]);
    useEffect(() => {
        spiderLogsRef.current = spiderLogs;
    }, [spiderLogs]);

    // 全局计时器：实时更新 running 状态的爬虫的运行时长
    useEffect(() => {
        const interval = setInterval(() => {
            setSpiderRunTimes(prev => {
                const newRunTimes = { ...prev };
                let hasChange = false;
                // 用 ref 来获取最新状态
                const currentStatus = spiderStatusRef.current;
                const currentStartTimes = spiderStartTimesRef.current;

                Object.keys(currentStatus).forEach(itemId => {
                    if (currentStatus[itemId] === 'running' && currentStartTimes[itemId]) {
                        const elapsed = Date.now() - currentStartTimes[itemId];
                        const hours = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
                        const minutes = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
                        const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
                        const timeStr = `${hours}:${minutes}:${seconds}`;

                        if (newRunTimes[itemId] !== timeStr) {
                            newRunTimes[itemId] = timeStr;
                            hasChange = true;
                        }
                    }
                });

                return hasChange ? newRunTimes : prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []); // 移除依赖，用 ref 来获取最新状态

    // 记录每个爬虫的实时日志（最多50条）
    useEffect(() => {
        spiderLogsRef.current = spiderLogs;
    }, [spiderLogs]);

    // 定时获取爬虫日志（只在 running 时轮询）
    useEffect(() => {
        if (activeItem === 'overview') {
            return;
        }

        const fetchLogs = async () => {
            const spiderName = spiderNameMap[activeItem];
            if (!spiderName) return;

            try {
                const result = await getSpiderLogs(spiderName, 50);
                console.log('日志获取结果:', result);
                if (result.success) {
                    const logs = result.data || [];
                    const currentLogs = spiderLogsRef.current[activeItem] || [];
                    if (JSON.stringify(logs) !== JSON.stringify(currentLogs)) {
                        setSpiderLogs(prev => ({
                            ...prev,
                            [activeItem]: logs
                        }));
                    }
                }
            } catch (error) {
                console.error('获取日志失败:', error);
            }
        };

        // 立即执行一次
        fetchLogs();

        // 先清除旧的定时器（防止重复）
        if (logsIntervalRef.current) {
            clearInterval(logsIntervalRef.current);
            logsIntervalRef.current = null;
        }

        // 只有 running 状态时才定时轮询
        if (spiderStatus[activeItem] === 'running') {
            logsIntervalRef.current = setInterval(fetchLogs, 1500);
        }

        return () => {
            if (logsIntervalRef.current) {
                clearInterval(logsIntervalRef.current);
                logsIntervalRef.current = null;
            }
        };
    }, [activeItem, spiderStatus]);
    // 爬虫状态变化时，更新日志定时器

    // 菜单项点击处理
    const handleItemClick = useCallback((itemId) => {
        setActiveItem(itemId);
    }, []);

    // 侧边栏开关处理
    const toggleSidebar = useCallback(() => {
        setSidebarOpen((prev) => !prev);
    }, []);

    // 更新爬虫状态（统一处理，确保最后运行时长被保存）
    const updateSpiderStatus = useCallback((itemId, newStatus, isUserAction = false, optStartTime = null, optCurrentCount = null, optTotalExpected = null, optProgressPercent = null) => {
        // 如果是用户操作，记录操作时间
        if (isUserAction) {
            setSpiderLastActionTimes(prev => ({
                ...prev,
                [itemId]: Date.now()
            }));
        }

        // 用 ref 获取最新状态
        const currentStatus = spiderStatusRef.current[itemId];
        const currentRunTimes = spiderRunTimesRef.current;
        const currentStartTimes = spiderStartTimesRef.current;
        const currentCounts = spiderCurrentCountsRef.current;

        if (newStatus === 'running' && currentStatus !== 'running') {
            // 只有从非 running 状态变成 running 状态时，才重置启动时间和运行时长
            const startTimeToUse = optStartTime ? new Date(optStartTime).getTime() : Date.now();
            setSpiderStartTimes(prev => ({
                ...prev,
                [itemId]: startTimeToUse
            }));
            setSpiderRunTimes(prev => ({
                ...prev,
                [itemId]: '00:00:00'
            }));
            // 重置抓取数量（如果后端有值就用后端的，否则用 0）
            setSpiderCurrentCounts(prev => ({
                ...prev,
                [itemId]: optCurrentCount || 0
            }));
            // 设置总数（如果后端有值就用后端的，否则用默认值 200）
            setSpiderTotalExpected(prev => ({
                ...prev,
                [itemId]: optTotalExpected || 200
            }));
        } else if (newStatus !== 'running' && currentStatus === 'running') {
            // 只有从 running 状态变成非 running 状态时，才保存最后运行时长
            setSpiderLastRunTimes(prevLast => ({
                ...prevLast,
                [itemId]: currentRunTimes[itemId]
            }));
            // 清空启动时间
            setSpiderStartTimes(prev => ({
                ...prev,
                [itemId]: null
            }));
        } else if (optStartTime && newStatus === 'running') {
            // 如果是 running 状态，并且有后端传来的 start_time，检查是否需要更新
            const existingStartTime = currentStartTimes[itemId];
            const newStartTime = new Date(optStartTime).getTime();
            if (!existingStartTime || Math.abs(existingStartTime - newStartTime) > 1000) {
                // 只有当现有时间不存在，或者相差超过1秒时，才更新
                setSpiderStartTimes(prev => ({
                    ...prev,
                    [itemId]: newStartTime
                }));
            }
        }

        // 更新抓取数量（只在数量增加时更新，避免回退）
        if (optCurrentCount !== null && optCurrentCount !== undefined) {
            const existingCount = currentCounts[itemId] || 0;
            if (optCurrentCount > existingCount) {
                const increase = optCurrentCount - existingCount;
                console.log(`爬虫 ${itemId} 新增 ${increase} 条数据，当前总数: ${optCurrentCount}`);
                setSpiderCurrentCounts(prev => ({
                    ...prev,
                    [itemId]: optCurrentCount
                }));
            }
        }

        // 更新总数
        if (optTotalExpected !== null && optTotalExpected !== undefined) {
            setSpiderTotalExpected(prev => ({
                ...prev,
                [itemId]: optTotalExpected
            }));
        }

        // 更新进度百分比
        if (optProgressPercent !== null && optProgressPercent !== undefined) {
            setSpiderProgressPercent(prev => ({
                ...prev,
                [itemId]: optProgressPercent
            }));
        }

        // 更新状态
        setSpiderStatus(prev => ({
            ...prev,
            [itemId]: newStatus
        }));
    }, []); // 移除依赖，用 ref 来获取最新状态

    // 爬虫名称映射（用于API）
    const spiderNameMap = {
        'movie-crawler': 'movie',
        'news-crawler': 'news',
        'novel-crawler': 'novel'
    };

    // 爬虫组件映射表
    const crawlerNames = {
        'movie-crawler': '电影爬虫',
        'news-crawler': '新闻爬虫',
        'novel-crawler': '小说爬虫'
    }

    // 渲染对应的内容
    const renderContent = () => {
        const isRunning = spiderStatus[activeItem] === 'running';
        const displayTime = isRunning ? spiderRunTimes[activeItem] : spiderLastRunTimes[activeItem];

        const commonProps = {
            sidebarOpen: sidebarOpen,
            onToggleSidebar: toggleSidebar,
            crawlerName: crawlerNames[activeItem] || '爬虫页面',
            spiderType: spiderTypeMap[activeItem] || 'movie',
            currentStatus: spiderStatus[activeItem] || 'idle',
            runTime: displayTime, // 直接传计算好的运行时长
            startTime: spiderStartTimes[activeItem], // 启动时间戳
            currentCount: spiderCurrentCounts[activeItem] || 0, // 抓取数量
            totalExpected: spiderTotalExpected[activeItem] || 0, // 需要抓取的总数
            progressPercent: spiderProgressPercent[activeItem] || '0%', // 抓取进度百分比
            logs: spiderLogs[activeItem] || [],// 爬虫实时日志

            onStatusChange: (status) => {
                // true 表示这是用户操作，5秒内轮询不应该覆盖
                updateSpiderStatus(activeItem, status, true);
            }
        };

        switch (activeItem) {
            case 'overview':
                return <MainContent {...commonProps} />;
            case 'movie-crawler':
            case 'news-crawler':
            case 'novel-crawler':
                return (
                    <Crawler {...commonProps} />
                );
            default:
                return <MainContent {...commonProps} />;
        }
    };

    // 添加用户信息状态
    const [userInfo, setUserInfo] = useState(null);
    // 挂载组件的时候从存储获取用户信息
    useEffect(() => {
        const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
        if (userInfoStr) {
            try {
                const user = JSON.parse(userInfoStr);
                setUserInfo(user);
            } catch (error) {
                console.error('解析用户信息失败:', error);
            }
        }
    }, []);

    // 爬虫启动停止映射表
    const spiderTypeMap = {
        'movie-crawler': 'movie',      // 电影爬虫
        'news-crawler': 'news',        // 新闻爬虫
        'novel-crawler': 'novel'       // 小说爬虫
    };

    // 定时轮询当前查看的爬虫状态（优化：只在 running 时轮询）
    useEffect(() => {
        // 如果是概览页面，或者当前爬虫不是 running 状态，不轮询
        if (activeItem === 'overview' || spiderStatus[activeItem] !== 'running') {
            return;
        }

        const fetchCurrentStatus = async () => {
            const spiderName = spiderNameMap[activeItem];
            if (!spiderName) return;

            try {
                const result = await getSpiderStatus(spiderName);
                console.log(`爬虫 ${spiderName} 状态:`, result.data);

                if (result.success) {
                    // 从后端获取数据
                    const backendStatus = result.data.status || 'idle';
                    const backendStartTime = result.data.start_time;
                    const backendCurrentCount = result.data.current_count;
                    const backendTotalExpected = result.data.total_expected;
                    const backendProgressPercent = result.data.progress_percent;

                    // 调试日志
                    console.log(`后端返回 current_count: ${backendCurrentCount}, total_expected: ${backendTotalExpected}`);

                    const timeSinceLastAction = Date.now() - spiderLastActionTimes[activeItem];
                    if (timeSinceLastAction > 5000) {
                        // 把后端数据传给 updateSpiderStatus 统一处理
                        updateSpiderStatus(activeItem, backendStatus, false, backendStartTime, backendCurrentCount, backendTotalExpected, backendProgressPercent);
                    } else {
                        // 用户刚操作过，只更新抓取数量和进度，不更新状态
                        // 直接更新状态而不经过 updateSpiderStatus 的状态判断
                        if (backendCurrentCount !== null && backendCurrentCount !== undefined) {
                            console.log(`爬虫 ${activeItem} 当前总数: ${backendCurrentCount}`);
                            setSpiderCurrentCounts(prev => ({
                                ...prev,
                                [activeItem]: backendCurrentCount
                            }));
                        }
                        if (backendTotalExpected !== null && backendTotalExpected !== undefined) {
                            setSpiderTotalExpected(prev => ({
                                ...prev,
                                [activeItem]: backendTotalExpected
                            }));
                        }
                        if (backendProgressPercent !== null && backendProgressPercent !== undefined) {
                            setSpiderProgressPercent(prev => ({
                                ...prev,
                                [activeItem]: backendProgressPercent
                            }));
                        }
                    }
                }
            } catch (error) {
                console.error('获取爬虫状态失败:', error);
            }
        };

        // 立即执行一次
        fetchCurrentStatus();

        // 先清除旧的定时器（防止重复）
        if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
            statusIntervalRef.current = null;
        }

        // 每2秒轮询一次（只有 running 时才轮询）
        statusIntervalRef.current = setInterval(fetchCurrentStatus, 2000);

        return () => {
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
            }
        };
    }, [activeItem, spiderStatus]); // ✅ 状态变化时重新创建

    return (
        <Layout sidebarOpen={sidebarOpen}>
            <div className="web-crawler">
                <Sidebar
                    activeItem={activeItem}
                    onItemClick={handleItemClick}
                    isOpen={sidebarOpen}
                    user={userInfo}
                    spiderStatus={spiderStatus}
                />
                <div className={`web-crawler-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                    {renderContent()}
                </div>
            </div>
        </Layout>
    );
};

export default WebCrawler;
