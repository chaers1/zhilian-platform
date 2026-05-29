/**
 * 布局组件
 * 包含主要内容区域和固定底部footer
 *
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件内容，将显示在主内容区域
 *
 * @returns {JSX.Element} 返回布局的 JSX 元素
 */
// Layout.jsx
import "./Layout.css";

const Layout = ({ children, showFooter = true, sidebarOpen = true }) => {
  return (
    <div className="Layout">
      <main className={`Layout-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>{children}</main>

      {showFooter && (
        <footer className={`Layout-footer ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <div className="footer-content">
            <div className="footer-copyright">
              <span>Copyright © 2026-2026</span>
              <span className="footer-divider">|</span>
              <a
                href="https://chaers1.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="张志刚个人主页"
                className="personal-link"
              >
                张志刚个人主页
              </a>
              <span className="footer-divider">|</span>
              <span>版权所有·张志刚</span>
              <span className="footer-divider">|</span>
              <span>本项目基于 django, fastapi + react 开发</span>
            </div>

            <div className="footer-badge">
              <span className="badge-item">
                <i>🔒</i> 企业级安全
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;