#!/bin/bash
set -e

# run-all-verification.sh
# 运行所有验证脚本

# 获取项目根目录（scripts 的父目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Agent Config Studio - All Verifications                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# 1. 类型检查
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[1/4] TypeScript Type Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$PROJECT_DIR"
if npm run typecheck &> /dev/null; then
    echo -e "${GREEN}[✓]${NC} TypeScript types OK"
else
    echo -e "${RED}[✗]${NC} TypeScript types FAILED"
    FAILED=1
fi
echo ""

# 2. 配置格式验证
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[2/4] Config Format Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if bash "$SCRIPT_DIR/verify-config-format.sh"; then
    echo -e "${GREEN}[✓]${NC} Config format OK"
else
    echo -e "${RED}[✗]${NC} Config format FAILED"
    FAILED=1
fi
echo ""

# 3. opencode CLI 验证
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[3/4] OpenCode CLI Discovery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if bash "$SCRIPT_DIR/verify-opencode-discovery.sh"; then
    echo -e "${GREEN}[✓]${NC} OpenCode discovery OK"
else
    echo -e "${YELLOW}[!]${NC} OpenCode discovery issues (may be expected if opencode not configured)"
    # 不算失败，因为 opencode 可能没有 API key
fi
echo ""

# 4. 测试 fixtures 完整性
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[4/4] Test Fixtures Integrity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
WORKSPACE_DIR="$PROJECT_DIR/test/test-workspace"
GLOBAL_CONFIG_DIR="$PROJECT_DIR/test/opencode-config-global"
MISSING=""

# 检查 test-workspace skills fixtures
for skill in "test-skill" "test-group/nested-skill"; do
    SKILL_FILE="$WORKSPACE_DIR/.opencode/skills/$skill/SKILL.md"
    if [ ! -f "$SKILL_FILE" ]; then
        MISSING="$MISSING\n  - test-workspace/.opencode/skills/$skill/SKILL.md"
    fi
done

# 检查 test-workspace agents fixtures
for agent in "test-agent" "test-group/nested-agent"; do
    AGENT_FILE="$WORKSPACE_DIR/.opencode/agents/$agent.md"
    if [ ! -f "$AGENT_FILE" ]; then
        MISSING="$MISSING\n  - test-workspace/.opencode/agents/$agent.md"
    fi
done

# 检查 test-workspace 配置文件
CONFIG_FILE="$WORKSPACE_DIR/opencode.jsonc"
if [ ! -f "$CONFIG_FILE" ]; then
    MISSING="$MISSING\n  - test-workspace/opencode.jsonc"
fi

# 检查 opencode-config-global 目录
if [ ! -d "$GLOBAL_CONFIG_DIR/.opencode" ]; then
    MISSING="$MISSING\n  - opencode-config-global/.opencode/"
fi

if [ -z "$MISSING" ]; then
    echo -e "${GREEN}[✓]${NC} All test fixtures present"
else
    echo -e "${RED}[✗]${NC} Missing fixtures:$MISSING"
    FAILED=1
fi
echo ""

# 总结
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Summary                                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}[✓] All verifications passed${NC}"
    exit 0
else
    echo -e "${RED}[✗] Some verifications failed${NC}"
    exit 1
fi