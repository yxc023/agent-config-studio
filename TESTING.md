# 测试验证方法

## 快速验证命令

```bash
# 1. 启动开发服务器
npm run dev

# 2. 类型检查
npm run typecheck

# 3. 打包构建
npm run build
```

---

## 功能测试清单

### 1. Workspace 管理

- [ ] **添加 Workspace**
  - 点击 "+ Add Workspace"
  - 选择 `test-fixtures` 目录
  - 验证目录被添加到侧边栏

- [ ] **删除 Workspace**
  - 鼠标悬浮在 workspace 条目上
  - 点击出现的 × 按钮
  - 确认删除对话框
  - 验证 workspace 被移除

- [ ] **切换 Workspace**
  - 点击不同的 workspace
  - 验证内容区域更新

---

### 2. Skills 功能

**Skills 列表显示**
- [ ] 显示 skills 列表（按目录分组）
- [ ] 显示 `test-skill` (根目录)
- [ ] 显示 `test-group/nested-skill` (子目录)

**Skills 权限切换**
- [ ] 点击 skill 卡片在 allow/deny 之间切换
- [ ] 验证 `opencode.jsonc` 配置更新
- [ ] 验证 `*` catch-all 设置为 deny

**Skills 分组**
- [ ] 验证按目录分组显示
- [ ] 点击分组标题可折叠/展开

**Detailed 模式**
- [ ] 切换到 Detailed 模式
- [ ] 验证显示 directory 路径
- [ ] 验证显示 description
- [ ] 验证高度增加（显示更多内容）

**Compact 模式**
- [ ] 切换到 Compact 模式
- [ ] 验证只显示名称和状态
- [ ] 验证卡片高度缩小

---

### 3. Agents 功能

**Agents 列表显示**
- [ ] 显示 agents 列表（按目录分组）
- [ ] 显示 `test-agent` (根目录)
- [ ] 显示 `test-group/nested-agent` (子目录)

**Agents 启用/禁用**
- [ ] 点击 agent 卡片切换 enabled/disabled
- [ ] 验证 `opencode.jsonc` 配置更新

**Agents 分组**
- [ ] 验证按目录分组显示
- [ ] 点击分组标题可折叠/展开

---

### 4. 多级目录支持

**Skills 多级目录**
- [ ] `test-skill` → 目录显示为 `root`
- [ ] `test-group/nested-skill` → 目录显示为 `test-group`

**Agents 多级目录**
- [ ] `test-agent` → 目录显示为 `root`
- [ ] `test-group/nested-agent` → 目录显示为 `test-group`

---

### 5. Global Skills/Agents

**Global Skills 发现**
- [ ] `~/.config/opencode/skills/` 下的 skills 被发现
- [ ] `compound-engineering-plugin/*` 显示在 `compound-engineering-plugin` 分组

**Global Agents 发现**
- [ ] `~/.config/opencode/agents/` 下的 agents 被发现

---

### 6. 配置文件格式

**验证 skills 配置格式**
```bash
# 打开 test-fixtures/opencode.jsonc
# 验证 skills 使用 name 作为 key（非 fullPath）
"test-skill": "allow"        # ✅ 正确
"test-group/nested-skill": "allow"  # ✅ 正确
```

**验证 agents 配置格式**
```jsonc
"test-agent": { "disable": false }   // ✅ 正确
```

**验证 catch-all 设置**
```jsonc
"permission": {
  "skill": {
    "*": "deny"  // ✅ 存在
  }
}
```

---

### 7. opencode run 验证

在 `test-fixtures` 目录中运行：

```bash
cd test-fixtures

# 列出 skills
opencode run "list skills"

# 验证输出包含所有测试 skills
# 应该显示:
# - test-skill
# - test-group/nested-skill
```

---

### 8. 边界条件测试

**不存在的目录**
- [ ] 扫描不存在的目录不会报错
- [ ] 只会显示实际存在的 skills/agents

**空目录**
- [ ] 处理空的 skills 目录
- [ ] 处理空的 agents 目录

**配置文件缺失**
- [ ] 新目录没有 opencode.jsonc 时正确处理
- [ ] 提示需要有效的配置文件

---

## 回归测试检查点

每次代码变更后，验证以下核心功能：

1. ✅ Skills 列表正确显示（分组、名称、状态）
2. ✅ Skills 点击切换 allow/deny 正确更新配置
3. ✅ Agents 列表正确显示
4. ✅ Agents 点击切换 enabled/disabled 正确更新配置
5. ✅ View mode toggle 正常工作
6. ✅ 多级目录（嵌套目录）正确发现和分组
7. ✅ 配置文件中使用 name 而非 fullPath 作为 key
8. ✅ `*` catch-all 正确设置为 deny

---

## 手动测试脚本

```bash
#!/bin/bash
set -e

echo "=== Agent Config Studio 手动测试 ==="

# 启动开发服务器
echo "1. 启动开发服务器..."
npm run dev &
DEV_PID=$!
sleep 5

echo "2. 等待用户测试..."

# 等待用户按 Enter 结束
read -p "测试完成后按 Enter 继续..."

# 清理
kill $DEV_PID 2>/dev/null || true

echo "=== 测试完成 ==="
```

---

## 预期配置文件示例

**test-fixtures/opencode.jsonc**
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "skill": {
      "*": "deny",
      "test-skill": "allow",
      "test-group/nested-skill": "allow"
    }
  },
  "agent": {
    "test-agent": {
      "disable": false
    },
    "test-group/nested-agent": {
      "disable": false
    }
  }
}
```
