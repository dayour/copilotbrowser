copilotbrowser Agent Builder

This folder contains tools and documentation for building and extending agents in Microsoft Copilot Studio using MCP (Model Context Protocol) commands for UI automation. The focus is on creating agents, topics, adding tools, and publishing agents with comprehensive configurations.

## Overview

The copilotbrowser Agent Builder provides a structured approach to automate the creation and enhancement of Copilot Studio agents. It includes conceptual MCP commands for browser automation, UI interaction details, and sample scripts for specific scenarios.

## MCP Commands Used

The following conceptual MCP commands were used during the agent creation and extension process:

- `mcp_copilotbrower_navigate(url)`: Navigate to specific URLs or pages within Copilot Studio.
- `mcp_copilotbrower_click(element)`: Click UI elements like tabs, buttons, and menu options.
- `mcp_copilotbrower_type(element, text)`: Input text into fields such as topic names, descriptions, and messages.
- `mcp_copilotbrower_wait_for(time)`: Wait for UI operations to complete (e.g., saving, publishing).
- `mcp_copilotbrower_take_screenshot(filename)`: Capture screenshots for documentation and validation.

## UI Fields Interacted With

During the process, the following UI elements in Copilot Studio were interacted with:

- **Topic Name Input**: Field to set the name of a new or existing topic.
- **Topic Description Input**: Field to describe the purpose or functionality of a topic.
- **Message Input Box**: Text area to define the response or content for a topic.
- **Add Node Button**: Button to add functional nodes (e.g., message, question) to a topic.
- **Save Button**: Button to save changes made to a topic.
- **Publish Button**: Button to publish the agent with all configured changes.
- **Test Chat Input**: Field to input test messages to validate agent responses.
- **Send Button in Test Chat**: Button to send test messages in the test panel.

## Step-by-Step Process for Agent Extension

The process for extending an agent in Copilot Studio using MCP commands includes the following phases:

### Phase 1: Environment Setup and Navigation
- Navigate to the Copilot Studio home page.
- Select the target environment (e.g., darbottest).
- Access the desired agent from the "Agents" tab.

### Phase 2: Tool Validation and Addition
- Navigate to the "Tools" tab.
- Verify existing tools (e.g., Dataverse MCP Server).
- Add new tools if necessary.

### Phase 3: Topic Creation and Configuration
- Navigate to the "Topics" tab.
- Add new topics using "Add a topic" > "From blank".
- Set topic name and description.
- Add message nodes with user-friendly content.
- Save each topic.

### Phase 4: Publishing and Testing
- Publish the agent to apply changes.
- Test topics using the test chat panel with relevant messages.
- Validate responses to ensure functionality.

## Sample Scripts

Sample scripts for specific agent creation and extension scenarios are located in the "samples" subfolder. These include detailed MCP commands for reference.

## Usage

To use this builder, adapt the MCP commands and steps to your specific agent and environment. Replace variables (e.g., `{agent_name}`, `{topic_name}`) with your specific values. Use the Playwright MCP tools in Visual Studio Code to execute commands.

## Notes

- The MCP commands listed are conceptual and based on UI interactions observed during the process. Actual execution may require adjustments to match the real MCP framework syntax.
- Screenshots are recommended at each major step for documentation and validation.
- Ensure the agent is published after significant changes to make them live.
