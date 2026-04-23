#!/bin/bash
set -e

# verify-config-format.sh
# 验证 opencode.jsonc 配置文件格式

# 获取项目根目录（scripts 的父目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WORKSPACE_DIR="$PROJECT_DIR/test/test-workspace"
GLOBAL_CONFIG_DIR="$PROJECT_DIR/test/opencode-config-global"
CONFIG_FILE="$WORKSPACE_DIR/opencode.jsonc"

echo "=== OpenCode Config Format Verification ==="
echo ""

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "[✗] Config file not found: $CONFIG_FILE"
    exit 1
fi

echo "Config file: $CONFIG_FILE"
echo ""

# 1. 检查 JSONC 基本语法
echo "[*] Checking JSONC syntax..."

# 使用 node 检查 JSON 语法（如果可用）
# 注意：这个简单的校验不处理注释，仅检查基本 JSON 结构
if command -v node &> /dev/null; then
    NODE_SCRIPT='
const fs = require("fs");
const content = fs.readFileSync(process.argv[1], "utf8");
try {
    JSON.parse(content);
    console.log("JSON: valid");
} catch (e) {
    // 尝试移除注释后再试
    const noSingleLine = content.replace(/\/\/[^\n]*/g, "");
    const noMultiLine = noSingleLine.replace(/\/\*[\s\S]*?\*\//g, "");
    try {
        JSON.parse(noMultiLine);
        console.log("JSONC: valid (comments stripped)");
    } catch (e2) {
        console.error("JSON: invalid - " + e2.message);
        process.exit(1);
    }
}
'
    node -e "$NODE_SCRIPT" "$CONFIG_FILE"
    echo "[✓] JSON/JSONC syntax valid"
else
    echo "[!] node not found, skipping syntax check"
fi

echo ""

# 2. 检查必要字段
echo "[*] Checking required fields..."
echo ""

# 检查 $schema
if grep -q '"$schema"' "$CONFIG_FILE"; then
    echo "[✓] Has \$schema field"
else
    echo "[✗] Missing \$schema field"
fi

# 检查 permission.skill
if grep -q '"permission"' "$CONFIG_FILE" && grep -q '"skill"' "$CONFIG_FILE"; then
    echo "[✓] Has permission.skill section"
else
    echo "[✗] Missing permission.skill section"
fi

# 检查 permission.agent
if grep -q '"permission"' "$CONFIG_FILE" && grep -q '"agent"' "$CONFIG_FILE"; then
    echo "[✓] Has permission.agent section"
else
    echo "[✗] Missing permission.agent section"
fi

# 检查 catch-all (*)
if grep -q '"\*": "deny"' "$CONFIG_FILE" || grep -q '"\*":"deny"' "$CONFIG_FILE"; then
    echo "[✓] Has catch-all (*:deny) for skills"
else
    echo "[!] Missing catch-all (*:deny) - may be intentionally omitted"
fi

echo ""

# 3. 检查 skills 配置使用 name 而非 fullPath
echo "[*] Checking skills config format..."

# 期望的 skills: test-skill, test-group/nested-skill (使用 / 分隔)
EXPECTED_SKILLS=("test-skill" "test-group/nested-skill")

for skill in "${EXPECTED_SKILLS[@]}"; do
    # 检查是否使用 name 作为 key
    if grep -q "\"$skill\":" "$CONFIG_FILE"; then
        echo "[✓] Skill '$skill' uses name as key"
    else
        echo "[✗] Skill '$skill' not found or uses wrong key"
    fi
done

echo ""

# 4. 验证 opencode.jsonc 能被 opencode 加载
echo "[*] Testing config loading with opencode..."

# 使用 opencode debug config 验证
DEBUG_OUTPUT=$(OPENCODE_CONFIG_DIR="$GLOBAL_CONFIG_DIR" opencode debug config 2>&1 || true)

if echo "$DEBUG_OUTPUT" | grep -q "error\|Error\|ERROR"; then
    echo "[!] Config may have issues:"
    echo "$DEBUG_OUTPUT" | grep -i "error" | head -5
else
    echo "[✓] Config loaded without errors"
fi

echo ""
echo "=== Verification Complete ==="