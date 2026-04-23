# Custom Config Directory

This directory is used for testing the `OPENCODE_CONFIG_DIR` environment variable feature.

## Usage

```bash
# Set the environment variable to use this custom config directory
export OPENCODE_CONFIG_DIR=/path/to/agent-config-studio/custom-config

# Or run with the env variable
OPENCODE_CONFIG_DIR=/path/to/agent-config-studio/custom-config opencode run "list skills"
```

## Structure

```
custom-config/
├── .opencode/
│   ├── agents/
│   │   └── custom-agent.md          # Custom agent
│   └── skills/
│       ├── custom-skill/           # Simple custom skill
│       │   └── SKILL.md
│       └── custom-group/
│           └── custom-nested-skill/ # Nested custom skill
│               └── SKILL.md
└── README.md
```

## Testing

```bash
# Navigate to this directory's parent and run
cd /path/to/agent-config-studio

# List skills with custom config
OPENCODE_CONFIG_DIR=./custom-config opencode run "list skills"

# Should show:
# - custom-skill
# - custom-group/custom-nested-skill
```

## Notes

- The `OPENCODE_CONFIG_DIR` directory is scanned like `.opencode` directory
- Skills, agents, commands, plugins, and modes are discovered from this directory
- This directory takes precedence over global `.opencode` directories
