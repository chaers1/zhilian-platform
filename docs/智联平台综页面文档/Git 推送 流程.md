# 首次推送
```bash
# 1. 进入项目目录
cd E:\前后端分离项目\智联平台

# 2. 初始化 Git
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "首次提交"

# 5. 添加远程仓库
git remote add origin git@github.com:chaers1/zhilian-platform.git

# 6. 推送
git push -u origin main
```
# 日常推送（以后每次更新）
```bash
# 1. 进入项目目录
cd E:\前后端分离项目\智联平台

# 2. 查看修改了哪些文件（可选）
git status

# 3. 添加所有修改
git add .

# 4. 提交（写清楚改了什么）
git commit -m "描述你修改的内容"

# 5. 推送到 GitHub
git push
```

# 常用命令速查
|命令|说明|
|---|---|
|`git status`|查看哪些文件被修改了|
|`git add .`|添加所有修改的文件|
|`git add 文件名`|添加单个文件|
|`git commit -m "说明"`|提交到本地仓库|
|`git push`|推送到 GitHub|
|`git pull`|拉取远程更新|
|`git log`|查看提交历史|

---

## 四、典型工作流

bash

# 开始一天的工作
cd E:\前后端分离项目\智联平台
git pull              # 先拉取最新代码（多人协作时）
# 写代码... 改 bug...
# 结束一天的工作
git status            # 看看改了哪些
git add .             # 添加所有修改
git commit -m "完成了xxx功能"
git push              # 推送到 GitHub

---

## 五、提交信息规范

bash

# 好的提交信息示例
git commit -m "修复登录接口的 token 验证问题"
git commit -m "添加爬虫实时日志功能"
git commit -m "优化 Dashboard 页面加载速度"
# 避免的提交信息
git commit -m "修改"
git commit -m "fix"
git commit -m "更新"

---

## 六、如果遇到冲突

bash

# 拉取远程更新
git pull
# 如果有冲突，手动解决后
git add .
git commit -m "解决冲突"
git push

---

## 七、快速推送（一行命令）

如果你只想快速推送，可以写一个脚本：

bash

# 创建 push.bat 文件
echo git add . > push.bat
echo git commit -m "快速更新" >> push.bat
echo git push >> push.bat
# 以后直接双击 push.bat

---

## 总结

|场景|命令|
|---|---|
|首次推送|`git push -u origin main`|
|日常推送|`git add .` → `git commit -m "说明"` → `git push`|
|查看状态|`git status`|
|拉取更新|`git pull`|

**以后每次更新代码，记住三步：`add` → `commit` → `push`！**