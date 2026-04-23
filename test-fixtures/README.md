# Test Fixtures

This directory contains test fixtures for regression testing of the Agent Config Studio app.

## Structure

```
test-fixtures/
├── opencode.jsonc                    # Test configuration
└── .opencode/
    ├── agents/
    │   ├── test-agent.md           # Simple agent
    │   └── test-group/
    │       └── nested-agent.md     # Nested agent (tests multi-level discovery)
    └── skills/
        ├── test-skill/             # Simple skill
        │   └── SKILL.md
        └── test-group/
            └── nested-skill/      # Nested skill (tests multi-level discovery)
                └── SKILL.md
```

## Usage

1. Open the app
2. Add `test-fixtures` directory as a workspace
3. Verify:
   - Skills display with directory grouping
   - Agents display with directory grouping
   - Toggle skills (allow/deny) works and updates config
   - Toggle agents (enable/disable) works and updates config
   - View mode toggle (compact/detailed) works
   - GroupedSection collapse/expand works

## Regenerating the config

If you need to reset the config after testing:

```bash
cat > test-fixtures/opencode.jsonc << 'EOF'
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
EOF
```
