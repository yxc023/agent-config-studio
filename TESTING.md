# 测试验证方法

## 快速验证命令

```bash
# 运行所有验证（推荐）
npm run verify

# 或手动运行
./scripts/run-all-verification.sh

# 1. 类型检查
npm run typecheck

# 2. 启动开发服务器
npm run dev

# 3. 打包构建
npm run build
```

---

## 自动化验证脚本

### 脚本位置

```
scripts/
├── run-all-verification.sh       # 一键运行所有验证
├── verify-config-format.sh      # 验证配置文件格式
└── verify-opencode-discovery.sh # 验证 opencode CLI 发现能力
```

### run-all-verification.sh

一键运行所有验证：

```bash
./scripts/run-all-verification.sh
```

输出示例：

```
╔════════════════════════════════════════════════════════════╗
║  Agent Config Studio - All Verifications                  ║
╚════════════════════════════════════════════════════════════╝

[1/4] TypeScript Type Check
[✓] TypeScript types OK

[2/4] Config Format Verification
[✓] Config format OK

[3/4] OpenCode CLI Discovery
[✓] OpenCode discovery OK

[4/4] Test Fixtures Integrity
[✓] All test fixtures present

╔════════════════════════════════════════════════════════════╗
║  Summary                                                  ║
╚════════════════════════════════════════════════════════════╝
[✓] All verifications passed
```

### verify-config-format.sh

验证 `opencode.jsonc` 配置文件格式：

```bash
./scripts/verify-config-format.sh
```

检查项：
- JSONC 语法正确性
- 必要字段存在 (`$schema`, `permission.skill`, `permission.agent`)
- catch-all `*: deny` 设置
- skills/agents 使用 name 作为 key

### verify-opencode-discovery.sh

验证 opencode CLI 能发现 test-workspace 中的 skills/agents：

```bash
./scripts/verify-opencode-discovery.sh
```

使用 `OPENCODE_CONFIG_DIR` 环境变量指定全局配置目录（opencode-config-global），然后调用：
- `opencode run "list skills"`
- `opencode agent list`

---

## 测试目录

### test/ - 测试目录

```
test/
├── test-workspace/              # 工作区目录（模拟用户项目）
│   ├── opencode.jsonc           # 测试配置
│   └── .opencode/
│       ├── agents/
│       │   ├── test-agent.md           # 简单 agent
│       │   └── test-group/
│       │       └── nested-agent.md     # 嵌套 agent
│       └── skills/
│           ├── test-skill/
│           │   └── SKILL.md           # 简单 skill
│           └── test-group/
│               └── nested-skill/
│                   └── SKILL.md       # 嵌套 skill
│
└── opencode-config-global/     # 全局配置目录（替换 ~/.config/opencode）
    └── .opencode/
        ├── agents/
        │   └── custom-agent.md
        └── skills/
            ├── custom-skill/
            │   └── SKILL.md
            └── custom-group/
                └── custom-nested-skill/
                    └── SKILL.md
```

**目录说明：**

| 目录 | 用途 | OPENCODE_CONFIG_DIR |
|------|------|-------------------|
| `test-workspace` | 作为工作区目录，App 添加此目录作为 workspace | 不使用 |
| `opencode-config-global` | 作为全局配置目录，测试 `OPENCODE_CONFIG_DIR` 功能 | 使用 |

**使用方法：**

1. App 中添加 `test/test-workspace` 作为 workspace
2. 验证 skills 和 agents 的显示、切换、分组等功能

---

## 功能测试清单

### 1. Workspace 管理

- [ ] **添加 Workspace**
  - 点击 "+ Add Workspace"
  - 选择 `test/test-workspace` 目录
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
# 打开 test/test-workspace/opencode.jsonc
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
    "*": "deny"  # ✅ 存在
  }
}
```

---

### 7. opencode run 验证

在 `test/test-workspace` 目录中运行：

```bash
cd test/test-workspace

# 使用 opencode-config-global 作为全局配置
OPENCODE_CONFIG_DIR=../opencode-config-global opencode run "list skills"

# 验证输出包含所有测试 skills
# 应该显示:
# - test-skill
# - test-group/nested-skill
```

---

### 8. OPENCODE_CONFIG_DIR 验证

```bash
# 使用 opencode-config-global 作为全局配置目录
OPENCODE_CONFIG_DIR=./test/opencode-config-global opencode run "list skills"

# 验证输出包含
# - custom-skill
# - custom-group/custom-nested-skill
```

---

### 9. 边界条件测试

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
9. ✅ Global skills/agents 正确发现
10. ✅ `OPENCODE_CONFIG_DIR` 环境变量正确处理

---

## 预期配置文件示例

**test/test-workspace/opencode.jsonc**
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

---

## npm verify 命令

在 `package.json` 中添加了 `verify` 脚本：

```json
{
  "scripts": {
    "verify": "bash scripts/run-all-verification.sh"
  }
}
```

运行 `npm run verify` 等同于直接运行 `./scripts/run-all-verification.sh`