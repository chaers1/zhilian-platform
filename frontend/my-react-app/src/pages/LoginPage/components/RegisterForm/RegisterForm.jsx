/**
 * RegisterForm 组件
 * 注册表单组件
 * 
 * @param {Object} props - 组件属性
 * @param {Function} props.onRegister - 注册成功回调函数
 * @param {Function} props.onSwitchToLogin - 切换到登录页面回调函数
 * @param {boolean} props.isActive - 是否显示注册表单
 * @param {boolean} props.isLoading - 是否正在加载
 */

import { useState, memo } from 'react';
import './RegisterForm.css';

const RegisterForm = ({ onRegister, onSwitchToLogin, isActive, isLoading }) => {
    // 表单状态
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeTerms: true
    });

    /**
 * 处理输入框变化
 * @param {Object} event - 事件对象
 */

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    /**
     * 处理表单提交
     * @param {Object} event - 事件对象
     */

    const handleSubmit = (event) => {
        event.preventDefault();

        // 表单验证
        if (!formData.firstName || !formData.lastName) {
            alert('请填写姓名');
            return;
        }
        if (!formData.email) {
            alert('请填写邮箱');
            return;
        }
        if (!formData.phone) {
            alert('请填写手机号码');
            return;
        }
        if (!formData.password || formData.password.length < 8) {
            alert('密码至少需要8位字符');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        if (!formData.agreeTerms) {
            alert('请阅读并同意服务条款');
            return;
        }

        // 调用注册回调
        if (onRegister) {
            onRegister({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });
        }
    };

    /**
 * 处理切换到登录页面
 */
    const handleSwitchToLogin = () => {
        if (onSwitchToLogin) {
            onSwitchToLogin();
        }
    };

    return (
        <div className={`RegisterForm ${isActive ? 'RegisterForm-active' : ''}`}>
            <div className="RegisterForm-header">
                <h2>创建新账户</h2>
                <p>
                    已有账号？{' '}
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        handleSwitchToLogin();
                    }}>
                        立即登录
                    </a>
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* 姓名双列布局 */}
                <div className="RegisterForm-row">
                    <div className="RegisterForm-input-group">
                        <label>姓氏</label>
                        <input
                            type="text"
                            name="firstName"
                            placeholder="姓"
                            value={formData.firstName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="RegisterForm-input-group">
                        <label>名字</label>
                        <input
                            type="text"
                            name="lastName"
                            placeholder="名字"
                            value={formData.lastName}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="RegisterForm-input-group">
                    <label>电子邮箱</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="RegisterForm-input-group">
                    <label>手机号码</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="13800138000"
                        value={formData.phone}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="RegisterForm-input-group">
                    <label>密码</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="至少8位字符"
                        value={formData.password}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="RegisterForm-input-group">
                    <label>确认密码</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="请再次输入密码"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                    />
                </div>

                <label className="RegisterForm-terms">
                    <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleInputChange}
                    />
                    我已阅读并同意
                    <a href="#">《用户服务协议》</a> 和
                    <a href="#">《隐私政策》</a>
                </label>

                <button
                    type="submit"
                    className="RegisterForm-btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span>注册中...</span>
                            <i className="fas fa-spinner fa-spin"></i>
                        </>
                    ) : (
                        <>
                            <span>注册</span>
                            <i className="fas fa-user-plus"></i>
                        </>
                    )}
                </button>

                <button
                    type="button"
                    className="RegisterForm-btn-secondary"
                    onClick={handleSwitchToLogin}
                    disabled={isLoading}
                >
                    <i className="fas fa-arrow-left"></i>
                    <span>返回登录</span>
                </button>
            </form>
        </div>
    );

}

export default memo(RegisterForm);