/**
 * ProfilePage 组件
 * 个人资料页面组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.user - 用户信息对象
 * @param {boolean} props.isActive - 是否显示个人资料页面
 * @param {Function} props.onSave - 保存修改回调函数
 * @param {Function} props.onBack - 返回首页回调函数
 */

import { useState, useMemo, memo, useEffect } from 'react';
import './ProfilePage.css';

const ProfilePage = ({ user, isActive, onSave, onBack }) => {
    // 表单数据状态
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        email: '',
        phone: '',
        bio: ''
    });
    // 头像状态
    const [avatar, setAvatar] = useState(null);

    const [avatarPreview, setAvatarPreview] = useState(null);

    // 当 user 数据从后端获取后，同步更新 formData
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                department: user.department || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || ''
            });
            // 不设置avatarPreview，让头像显示逻辑直接从user对象中获取
            setAvatar(null);
        } else {
            // 用户退出登录时，重置所有状态
            setFormData({
                name: '',
                department: '',
                email: '',
                phone: '',
                bio: ''
            });
            setAvatar(null);
            setAvatarPreview(null);
        }
    }, [user]);
    /**
     * 处理输入框变化
     * @param {Object} event - 事件对象
     */
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /**
     * 处理保存修改
     */
    const handleSave = () => {
        if (!formData.name) {
            alert('请填写姓名');
            return;
        }
        if (!formData.email) {
            alert('请填写邮箱');
            return;
        }
        if (!formData.phone) {
            alert('请填写手机号');
            return;
        }

        if (onSave) {
            onSave({
                ...formData,
                avatar
            });
        }
    };

    /**
     * 处理返回首页
     */
    const handleBack = () => {
        if (onBack) {
            onBack();
        }
    };

    /**
     * 处理头像上传（模拟）
     */
    const handleAvatarChange = (event) => {
        const file = event.target.files[0];

        // 验证文件大小
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('头像大小不能超过 2MB');
                return;
            }

            //验证文件类型
            if (!file.type.startsWith('image/')) {
                alert('请上传 JPG、PNG 格式的图片');
                return;
            }
            // 生成预览
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target.result);
            };
            reader.readAsDataURL(file);
            setAvatar(file);
        }
    };

    return (
        <div className={`ProfilePage ${isActive ? 'ProfilePage-active' : ''}`}>
            <div className="ProfilePage-header">
                <h2>个人资料</h2>
                <p>管理你的个人信息和账户设置</p>
            </div>

            <div className="ProfilePage-form">
                {/* 头像上传区域 */}
                <div className="ProfilePage-avatar-upload">
                    <div className="ProfilePage-avatar-large">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="头像预览"
                            />
                        ) : (user?.avatar_url && user.avatar_url !== null && user.avatar_url !== 'none' && user.avatar_url !== '') ? (
                            <img
                                src={user.avatar_url.startsWith('/') ? `http://127.0.0.1:8000${user.avatar_url}` : user.avatar_url}
                                alt="用户头像"
                            />
                        ) : (
                            <span>{user?.initial || 'U'}</span>
                        )}
                    </div>
                    <div>
                        <input
                            type="file"
                            id="avatar-input"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleAvatarChange}
                        >
                        </input>
                    </div>
                    <div>
                        <button
                            className="ProfilePage-upload-btn"
                            onClick={() => document.getElementById('avatar-input').click()}
                        >
                            <i className="fas fa-camera"></i> 更换头像
                        </button>
                        <p className="ProfilePage-upload-hint">
                            支持 JPG、PNG 格式，小于 2MB
                        </p>
                    </div>
                </div>

                {/* 姓名和部门双列布局 */}
                <div className="ProfilePage-row">
                    <div className="ProfilePage-input-group">
                        <label>姓名</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="ProfilePage-input-group">
                        <label>部门</label>
                        <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                {/* 邮箱和手机双列布局 */}
                <div className="ProfilePage-row">
                    <div className="ProfilePage-input-group">
                        <label>电子邮箱</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="ProfilePage-input-group">
                        <label>手机号码</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                {/* 个人简介 */}
                <div className="ProfilePage-input-group">
                    <label>个人简介</label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        style={{
                            width: '100%',
                            background: '#1e2a3a',
                            border: '1px solid #2d3a4a',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            fontSize: '14px',
                            color: 'white',
                            fontFamily: 'Inter, sans-serif',
                            resize: 'vertical'
                        }}
                    />
                </div>

                {/* 保存按钮 */}
                <button className="ProfilePage-btn-primary" onClick={handleSave}>
                    <i className="fas fa-save"></i> 保存修改
                </button>

                {/* 返回按钮 */}
                <button className="ProfilePage-btn-secondary" onClick={handleBack}>
                    <i className="fas fa-arrow-left"></i> 返回首页
                </button>
            </div>
        </div>
    );
};

export default memo(ProfilePage);