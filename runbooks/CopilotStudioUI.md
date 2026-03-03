# Copilot Studio UI Element Reference Guide

## Complete List of UI Elements and Their Selectors

### Navigation Elements

#### Top-Level Navigation (Home Page / Agents List)
```bash
# Home tab
element='tab:has-text("Home")'
element='[data-testid="LeftMenuBarHomeButton"]'

# Agents tab (top-level list of all agents)
element='tab:has-text("Agents")'
element='[data-testid="LeftMenuBarChatbotButton"]'

# Flows tab
element='tab:has-text("Flows")'

# Tools tab (top-level)
element='tab:has-text("Tools")'

# Explore Power Platform tab
element='tab:has-text("Explore Power Platform")'
```

#### Agent-Level Tabs (inside a specific agent)
> **Note:** Topics, Knowledge, Analytics, and Settings are agent-level — they are NOT top-level navigation tabs.
```bash
# Overview tab
element='tab:has-text("Overview")'
element='[data-testid="TopNavigationBar-Overview"]'

# Knowledge tab
element='tab:has-text("Knowledge")'
element='[data-testid="TopNavigationBar-Knowledge"]'

# Tools tab (agent-level)
element='tab:has-text("Tools")'
element='[data-testid="TopNavigationBar-Tools"]'

# Agents tab (agent-level sub-agents)
element='tab:has-text("Agents")'
element='[data-testid="TopNavigationBar-Agents"]'

# Topics tab (agent-level)
element='tab:has-text("Topics")'
element='[data-testid="TopNavigationBar-Topics"]'

# Activity tab
element='tab:has-text("Activity")'
element='[data-testid="TopNavigationBar-Activity"]'

# Evaluation tab
element='tab:has-text("Evaluation")'
element='[data-testid="TopNavigationBar-Evaluation"]'

# Analytics tab
element='tab:has-text("Analytics")'
element='[data-testid="TopNavigationBar-Analytics"]'

# Channels tab
element='tab:has-text("Channels")'
element='[data-testid="TopNavigationBar-Channels"]'

# Settings (button in agent header — not a tab)
element='button:has-text("Settings")'
```

#### Environment Selector
```bash
# Environment button in top bar (shows current environment name)
element='button:has-text("{env_name}")'

# After clicking, environment options appear in dropdown
element='div[role="option"]:has-text("{env_name}")'
element='li:has-text("{env_name}")'
```

### Agent Creation Elements

#### Create Flow
```bash
# Create blank agent button (on Home and Agents pages)
element='button:has-text("Create blank agent")'

# Clickable card on Home page
element='group:has-text("Create an agent")'

# Agent description input (conversational textbox on Home/new agent page)
element='textbox[placeholder*="Start building by describing"]'
element='div[contenteditable="true"]'

# Send description button (enabled only after typing)
element='button:has-text("Send")'
element='button[aria-label="Send"]'
```

#### Knowledge Source Elements
```bash
# Knowledge URL inputs
element='input[placeholder*="URL"]'
element='input[aria-label="Knowledge source URL"]'
element='input[type="url"]'

# Ownership checkboxes
element='input[type="checkbox"][aria-label*="Confirm"]'
element='input[type="checkbox"][aria-label*="ownership"]'
element='div[class*="checkbox"] input[type="checkbox"]'

# Add knowledge button
element='button:has-text("Add")'
element='button[aria-label="Add knowledge source"]'
```

### Topic Management Elements

#### Topic List
```bash
# Add topic button
element='button:has-text("Add a topic")'
element='button[aria-label="Add new topic"]'
element='div[class*="add-topic"]'

# Topic filters (counts shown in parens, e.g. "Custom (4)")
element='tab:has-text("All")'
element='tab:has-text("Custom")'
element='tab:has-text("System")'

# Topic search
element='input[aria-label="Search custom topics"]'
element='searchbox:has-text("Search custom topics")'  

# Topic rows
element='div[role="row"]:has-text("{topic_name}")'
element='a:has-text("{topic_name}")'
element='tr:has-text("{topic_name}")'

# Topic row actions — click More to reveal Delete/Duplicate in dropdown
element='button:has-text("More")'
element='button[aria-label="More"]'
```

#### Topic Creation
```bash
# Creation options (dropdown menu items after clicking "Add a topic")
element='[role="menuitem"]:has-text("From blank")'
element='menuitem:has-text("From blank")'
element='[role="menuitem"]:has-text("Add from description with Copilot")'
# Note: "From template" does NOT exist in the current UI

# Topic name input
element='input[aria-label="Topic name"]'
element='input[placeholder*="Topic name"]'
element='input[class*="topic-name"]'

# Topic description
element='textarea[aria-label="Description"]'
element='textarea[placeholder*="Describe"]'
element='textarea[class*="description"]'

# Save topic button
element='button:has-text("Save")'
element='button[aria-label="Save topic"]'
element='button[class*="save-topic"]'
```

#### Topic Canvas
```bash
# Add node button
element='button:has-text("Add node")'
element='button[aria-label="Add node"]'
element='div[class*="add-node"]'

# Node types
element='button:has-text("Send a message")'
element='button:has-text("Ask a question")'
element='button:has-text("Call an action")'
element='button:has-text("Condition")'
element='button:has-text("Variable management")'

# Message input
element='textarea[aria-label="Message"]'
element='div[contenteditable="true"][class*="message"]'
element='textarea[placeholder*="Enter a message"]'

# Question input
element='textarea[aria-label="Question"]'
element='input[aria-label="Question text"]'

# Variable inputs
element='input[aria-label="Variable name"]'
element='select[aria-label="Variable type"]'
element='input[aria-label="Default value"]'
```

### Tool Integration Elements

#### Tool Management
```bash
# Add tool button
element='button:has-text("Add a tool")'
element='button[aria-label="Add new tool"]'
element='div[class*="add-tool"]'

# Tool search
element='input[placeholder*="Search"]'
element='input[aria-label="Search tools"]'
element='input[class*="tool-search"]'

# Tool cards
element='div:has-text("Dataverse MCP Server")'
element='div[class*="tool-card"]:has-text("{tool_name}")'
element='button[aria-label="{tool_name}"]'

# Add to agent button
element='button:has-text("Add to agent")'
element='button[aria-label="Add tool to agent"]'
element='button[class*="add-tool-button"]'

# Tool toggle
element='input[type="checkbox"][aria-label*="Enable"]'
element='div[role="switch"]'
element='button[aria-label="Toggle tool"]'

# Tool settings
element='button:has-text("More")'
element='button[aria-label="Tool settings"]'
element='button:has-text("Configure")'
```

### Publishing Elements

```bash
# Publish button
element='button:has-text("Publish")'
element='button[aria-label="Publish agent"]'
element='button[class*="publish"]'

# Publish dialog
element='div[role="dialog"]'
element='div[class*="publish-dialog"]'

# Confirm publish
element='div[role="dialog"] button:has-text("Publish")'
element='button[aria-label="Confirm publish"]'

# Publishing status
element='div:has-text("Publishing...")'
element='div:has-text("Your agent is being published")'
element='div[class*="progress"]'

# Close dialog
element='button:has-text("Close")'
element='button[aria-label="Close dialog"]'
element='button[class*="dialog-close"]'
```

### Testing Elements

```bash
# Test panel
element='div[class*="test-panel"]'
element='div[aria-label="Test your agent"]'

# Test input
element='textarea[placeholder="Type your message"]'
element='input[aria-label="Type a message"]'
element='div[contenteditable="true"][class*="test-input"]'

# Send test message
element='button[aria-label="Send"]'
element='button[class*="test-send"]'

# Test response area
element='div[class*="test-response"]'
element='div[aria-label="Agent response"]'

# Clear conversation
element='button:has-text("Clear")'
element='button[aria-label="Clear conversation"]'
element='button:has-text("Start over")'
```

### Common UI Patterns

#### Buttons
```bash
# Primary buttons
element='button[class*="primary"]'
element='button[class*="cta"]'

# Secondary buttons
element='button[class*="secondary"]'
element='button[class*="default"]'

# Icon buttons
element='button[aria-label*="Edit"]'
element='button[aria-label*="Delete"]'
element='button[aria-label*="Settings"]'

# Disabled state
element='button:not([disabled])'
element='button[disabled]'
element='button[aria-disabled="true"]'
```

#### Inputs
```bash
# Text inputs
element='input[type="text"]'
element='input[class*="text-input"]'

# Textareas
element='textarea'
element='textarea[rows]'

# Select dropdowns
element='select'
element='div[role="combobox"]'

# Checkboxes
element='input[type="checkbox"]'
element='div[class*="checkbox"]'

# Radio buttons
element='input[type="radio"]'
element='div[role="radio"]'
```

#### Loading States
```bash
# Loading indicators
element='div:has-text("Loading...")'
element='div[class*="spinner"]'
element='div[class*="progress"]'

# Saving states
element='div:has-text("Saving...")'
element='div:has-text("Saving topic...")'
element='div:has-text("Publishing...")'
```

#### Notifications
```bash
# Success messages
element='div:has-text("Topic Saved!")'
element='div:has-text("Published successfully")'
element='div[class*="success"]'

# Error messages
element='div:has-text("Error")'
element='div[class*="error"]'
element='div[role="alert"]'

# Info messages
element='div[class*="info"]'
element='div[class*="notification"]'
```

### Advanced Selectors

#### Attribute-based
```bash
# Data attributes
element='[data-testid="{test_id}"]'
element='[data-automation-id="{automation_id}"]'

# ARIA attributes
element='[aria-label="{label}"]'
element='[aria-describedby="{id}"]'
element='[role="{role}"]'

# Class contains
element='[class*="{partial_class}"]'
element='[id*="{partial_id}"]'
```

#### Pseudo-selectors
```bash
# Position-based
element=':nth-child(n)'
element=':first-child'
element=':last-child'

# State-based
element=':enabled'
element=':disabled'
element=':checked'
element=':focus'
```

#### Combined selectors
```bash
# Multiple conditions
element='button[class*="primary"]:has-text("Save"):not([disabled])'
element='div[role="dialog"] button:has-text("Confirm")'
element='input[type="checkbox"][aria-label*="ownership"]:not(:checked)'
```

## Usage Tips

1. **Selector Priority**:
   - Prefer `aria-label` for accessibility and stability
   - Use `:has-text()` for user-visible content
   - Fallback to class/id selectors when needed

2. **Waiting Strategies**:
   - Always wait after navigation
   - Wait for loading states to disappear
   - Use explicit waits for dynamic content

3. **Error Handling**:
   - Check element state before interaction
   - Capture screenshots on failures
   - Log element not found errors

4. **Performance**:
   - Use specific selectors over generic ones
   - Avoid deep nesting in selectors
   - Cache frequently used elements