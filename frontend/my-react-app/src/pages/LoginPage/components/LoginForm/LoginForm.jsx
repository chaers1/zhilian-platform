/**
 * LoginForm 组件
 * 登录表单组件
 * 
 * @param {Object} props - 组件属性
 * @param {Function} props.onLogin - 登录成功回调函数
 * @param {Function} props.onSwitchToRegister - 切换到注册页面回调函数
 * @param {boolean} props.isActive - 是否显示登录表单
 * @param {boolean} props.isLoading - 是否正在加载
 */

import { useState, memo } from 'react';
import './LoginForm.css';

const LoginForm = ({ onLogin, onSwitchToRegister, isActive, isLoading }) => {

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: true
    });

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!formData.email || !formData.password) {
            alert('请输入邮箱和密码');
            return;
        }

        if (onLogin) {
            onLogin({
                email: formData.email,
                password: formData.password,
                rememberMe: formData.rememberMe
            });
        }
    };

    const handleSwitchToRegister = () => {
        if (onSwitchToRegister) {
            onSwitchToRegister();
        }
    };

    return (
        <div className={`LoginForm ${isActive ? 'LoginForm-active' : 'LoginForm-hidden'}`}>
            <div className="LoginForm-header">
                <h2>登录您的账户</h2>
                <p>
                    还没有账号？{' '}
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        handleSwitchToRegister();
                    }}>
                        立即注册
                    </a>
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="LoginForm-input-group">
                    <label>账号 / 邮箱</label>
                    <input
                        type="text"
                        name="email"
                        placeholder="请输入账号或邮箱"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="LoginForm-input-group">
                    <label>密码</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="请输入密码"
                        value={formData.password}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="LoginForm-options">
                    <label className="LoginForm-remember">
                        <input
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleInputChange}
                        />
                        记住登录
                    </label>
                    <a href="#" className="LoginForm-forgot">
                        忘记密码？
                    </a>
                </div>

                <button
                    type="submit"
                    className="LoginForm-btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span>登录中...</span>
                            <i className="fas fa-spinner fa-spin"></i>
                        </>
                    ) : (
                        <>
                            <span>登录</span>
                            <i className="fas fa-arrow-right"></i>
                        </>
                    )}
                </button>
            </form>

            <div className="LoginForm-divider"></div>

            <div className="LoginForm-social">
                <i className="fab fa-weixin" title="微信登录"></i>
                <i className="fab fa-github" title="GitHub登录"></i>
                <i className="fas fa-qrcode" title="扫码登录"></i>
            </div>
        </div>
    );
};
export default memo(LoginForm);