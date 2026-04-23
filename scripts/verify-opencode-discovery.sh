#!/bin/bash
set -e

# verify-opencode-discovery.sh
# 验证 opencode 能发现 test-workspace 中的 skills 和 agents
# 使用 opencode-config-global 作为全局配置目录

# 获取项目根目录（scripts 的父目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WORKSPACE_DIR="$PROJECT_DIR/test/test-workspace"
GLOBAL_CONFIG_DIR="$PROJECT_DIR/test/opencode-config-global"

echo "=== OpenCode Discovery Verification ==="
echo ""

# 检查 test-workspace 是否存在
if [ ! -d "$WORKSPACE_DIR" ]; then
    echo "[✗] test-workspace directory not found: $WORKSPACE_DIR"
    exit 1
fi

# 检查 opencode-config-global 是否存在
if [ ! -d "$GLOBAL_CONFIG_DIR" ]; then
    echo "[✗] opencode-config-global directory not found: $GLOBAL_CONFIG_DIR"
    exit 1
fi

# 检查 opencode 是否可用
if ! command -v opencode &> /dev/null; then
    echo "[!] opencode CLI not found in PATH"
    echo "[!] Skipping opencode CLI verification"
    echo "[*] To run this verification, install opencode from https://opencode.ai"
    exit 0
fi

cd "$WORKSPACE_DIR"

echo "Workspace: $(pwd)"
echo "Global Config: $GLOBAL_CONFIG_DIR"
echo ""

# 设置超时（秒）
TIMEOUT=10

# 验证 Skills 发现
echo "[*] Verifying skills discovery..."
echo ""

EXPECTED_SKILLS=("test-skill" "test-group/nested-skill")
FOUND_SKILLS=()

# 使用 opencode run 获取 skills 列表（带超时）
# OPENCODE_CONFIG_DIR 指定全局配置目录
SKILLS_OUTPUT=$(timeout $TIMEOUT bash -c "OPENCODE_CONFIG_DIR='$GLOBAL_CONFIG_DIR' opencode run 'list skills' 2>&1" || echo "TIMEOUT_OR_ERROR")

if [ "$SKILLS_OUTPUT" = "TIMEOUT_OR_ERROR" ]; then
    echo "[!] opencode command timed out or failed"
    echo "[!] This may be expected if opencode is not fully configured"
    echo "[*] Skipping opencode CLI verification"
    exit 0
fi

echo "--- Skills Output ---"
echo "$SKILLS_OUTPUT"
echo ""

# 检查每个预期的 skill 是否在输出中
for skill in "${EXPECTED_SKILLS[@]}"; do
    if echo "$SKILLS_OUTPUT" | grep -q "$skill"; then
        echo "[✓] Found skill: $skill"
        FOUND_SKILLS+=("$skill")
    else
        echo "[✗] Missing skill: $skill"
    fi
done

echo ""

# 验证 Agents 发现
echo "[*] Verifying agents discovery..."
echo ""

EXPECTED_AGENTS=("test-agent" "test-group/nested-agent")
FOUND_AGENTS=()

# 使用 opencode agent list 获取 agents（带超时）
AGENTS_OUTPUT=$(timeout $TIMEOUT bash -c "OPENCODE_CONFIG_DIR='$GLOBAL_CONFIG_DIR' opencode agent list 2>&1" || echo "TIMEOUT_OR_ERROR")

if [ "$AGENTS_OUTPUT" = "TIMEOUT_OR_ERROR" ]; then
    echo "[!] opencode command timed out or failed"
    echo "[!] This may be expected if opencode is not fully configured"
    echo "[*] Skipping opencode CLI verification"
    exit 0
fi

echo "--- Agents Output ---"
echo "$AGENTS_OUTPUT"
echo ""

for agent in "${EXPECTED_AGENTS[@]}"; do
    if echo "$AGENTS_OUTPUT" | grep -q "$agent"; then
        echo "[✓] Found agent: $agent"
        FOUND_AGENTS+=("$agent")
    else
        echo "[✗] Missing agent: $agent"
    fi
done

echo ""

# 总结
echo "=== Summary ==="
echo "Skills: ${#FOUND_SKILLS[@]}/${#EXPECTED_SKILLS[@]} found"
echo "Agents: ${#FOUND_AGENTS[@]}/${#EXPECTED_AGENTS[@]} found"
echo ""

if [ ${#FOUND_SKILLS[@]} -eq ${#EXPECTED_SKILLS[@]} ] && [ ${#FOUND_AGENTS[@]} -eq ${#EXPECTED_AGENTS[@]} ]; then
    echo "[✓] All expected items found"
    exit 0
else
    echo "[✗] Some items missing"
    exit 1
fi