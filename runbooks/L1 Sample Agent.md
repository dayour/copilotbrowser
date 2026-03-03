# MCP Commands for Extending L1-Customer-Agent-Audit in darbottest Environment
# Generated: 2025-06-15

# Execute these commands in VS Code with MCP copilotbrowser tools:

# Step 1: Navigate to Copilot Studio
mcp_copilotbrowser_browser_navigate(url='https://copilotstudio.microsoft.com')
mcp_copilotbrowser_browser_wait_for(time=3)
mcp_copilotbrowser_browser_take_screenshot(filename='initial-page.png')

# Step 2: Select darbottest Environment
mcp_copilotbrowser_browser_click(element='Environment selector')
mcp_copilotbrowser_browser_click(element='darbottest option')
mcp_copilotbrowser_browser_wait_for(time=2)
mcp_copilotbrowser_browser_take_screenshot(filename='environment-selected.png')

# Step 3: Access L1-Customer-Agent-Audit
mcp_copilotbrowser_browser_click(element='Agents tab')
mcp_copilotbrowser_browser_click(element='L1-Customer-Agent-Audit agent')
mcp_copilotbrowser_browser_wait_for(time=2)
mcp_copilotbrowser_browser_take_screenshot(filename='l1-agent-opened.png')

# Step 4: Verify Dataverse MCP Server Tool
mcp_copilotbrowser_browser_click(element='Tools tab')
mcp_copilotbrowser_browser_wait_for(time=2)
mcp_copilotbrowser_browser_take_screenshot(filename='tools-section.png')

# Step 5: Navigate to Topics Section
mcp_copilotbrowser_browser_click(element='Topics tab')
mcp_copilotbrowser_browser_wait_for(time=2)
mcp_copilotbrowser_browser_take_screenshot(filename='topics-section.png')

# Step 6: Add Check Order Status Topic
mcp_copilotbrowser_browser_click(element='Add a topic button')
mcp_copilotbrowser_browser_click(element='From blank option')
mcp_copilotbrowser_browser_type(element='Topic name input', text='Check Order Status')
mcp_copilotbrowser_browser_type(element='Description input', text='Helps customers check the status of their orders with order number or confirmation code.')
mcp_copilotbrowser_browser_click(element='Add node button')
mcp_copilotbrowser_browser_click(element='Send a message option')
mcp_copilotbrowser_browser_type(element='Message input', text='I can help you check the status of your order. Please provide me with your order number or confirmation code, and I\'ll look up the current status, tracking information, and estimated delivery date for you. I can also help with shipping details and any questions about your order\'s progress.')
mcp_copilotbrowser_browser_click(element='Save button')
mcp_copilotbrowser_browser_wait_for(time=3)
mcp_copilotbrowser_browser_take_screenshot(filename='check-order-status-created.png')

# Step 7: Add Update Customer Information Topic
mcp_copilotbrowser_browser_click(element='Add a topic button')
mcp_copilotbrowser_browser_click(element='From blank option')
mcp_copilotbrowser_browser_type(element='Topic name input', text='Update Customer Information')
mcp_copilotbrowser_browser_type(element='Description input', text='Assists customers with updating their account details, contact information, and preferences.')
mcp_copilotbrowser_browser_click(element='Add node button')
mcp_copilotbrowser_browser_click(element='Send a message option')
mcp_copilotbrowser_browser_type(element='Message input', text='I\'m happy to help you update your customer information. I can assist with changing your contact details, billing address, shipping preferences, or account settings. Please let me know what information you\'d like to update, and I\'ll guide you through the process to ensure your profile is accurate and up-to-date.')
mcp_copilotbrowser_browser_click(element='Save button')
mcp_copilotbrowser_browser_wait_for(time=3)
mcp_copilotbrowser_browser_take_screenshot(filename='update-customer-info-created.png')

# Step 8: Add Report a Problem Topic
mcp_copilotbrowser_browser_click(element='Add a topic button')
mcp_copilotbrowser_browser_click(element='From blank option')
mcp_copilotbrowser_browser_type(element='Topic name input', text='Report a Problem')
mcp_copilotbrowser_browser_type(element='Description input', text='Helps customers report issues or problems with their orders or services.')
mcp_copilotbrowser_browser_click(element='Add node button')
mcp_copilotbrowser_browser_click(element='Send a message option')
mcp_copilotbrowser_browser_type(element='Message input', text='I\'m sorry to hear that you\'re experiencing a problem. I can help you report and resolve issues with your order, product, or service. Please provide details about the problem, including any relevant order numbers, dates, or descriptions of the issue, and I\'ll assist in getting this resolved quickly. If needed, I can escalate complex issues to a human agent for further assistance.')
mcp_copilotbrowser_browser_click(element='Save button')
mcp_copilotbrowser_browser_wait_for(time=3)
mcp_copilotbrowser_browser_take_screenshot(filename='report-problem-created.png')

# Step 9: Add Request a Refund Topic
mcp_copilotbrowser_browser_click(element='Add a topic button')
mcp_copilotbrowser_browser_click(element='From blank option')
mcp_copilotbrowser_browser_type(element='Topic name input', text='Request a Refund')
mcp_copilotbrowser_browser_type(element='Description input', text='Assists customers with requesting refunds or returns for their purchases.')
mcp_copilotbrowser_browser_click(element='Add node button')
mcp_copilotbrowser_browser_click(element='Send a message option')
mcp_copilotbrowser_browser_type(element='Message input', text='I can help you request a refund or process a return for your purchase. Please provide me with your order number or confirmation code, and let me know the reason for the refund request. I\'ll check our refund policy, verify eligibility, and guide you through the next steps to ensure a smooth process. If you have any supporting information or photos, I can help with that too.')
mcp_copilotbrowser_browser_click(element='Save button')
mcp_copilotbrowser_browser_wait_for(time=3)
mcp_copilotbrowser_browser_take_screenshot(filename='request-refund-created.png')

# Step 10: Add Product Inquiry Topic
mcp_copilotbrowser_browser_click(element='Add a topic button')
mcp_copilotbrowser_browser_click(element='From blank option')
mcp_copilotbrowser_browser_type(element='Topic name input', text='Product Inquiry')
mcp_copilotbrowser_browser_type(element='Description input', text='Provides information and answers questions about products and services.')
mcp_copilotbrowser_browser_click(element='Add node button')
mcp_copilotbrowser_browser_click(element='Send a message option')
mcp_copilotbrowser_browser_type(element='Message input', text='I\'m happy to help with any questions or inquiries about our products and services. I can provide detailed information about features, specifications, pricing, availability, and more. Please let me know which product or service you\'re interested in, and I\'ll be glad to assist. If you have specific needs or use cases, I can offer recommendations too!')
mcp_copilotbrowser_browser_click(element='Save button')
mcp_copilotbrowser_browser_wait_for(time=3)
mcp_copilotbrowser_browser_take_screenshot(filename='product-inquiry-created.png')

# Step 11: Add Technical Support Topic
mcp_copilotbrowser_browser_click(element='Add a topic button')
mcp_copilotbrowser_browser_click(element='From blank option')
mcp_copilotbrowser_browser_type(element='Topic name input', text='Technical Support')
mcp_copilotbrowser_browser_type(element='Description input', text='Offers technical assistance and troubleshooting for product or service issues.')
mcp_copilotbrowser_browser_click(element='Add node button')
mcp_copilotbrowser_browser_click(element='Send a message option')
mcp_copilotbrowser_browser_type(element='Message input', text='I\'m here to help with any technical issues or questions you might have about our products or services. I can assist with troubleshooting, setup guidance, software or hardware problems, and more. Please describe the technical issue or question in detail, including any error messages or symptoms, and I\'ll provide step-by-step assistance. If needed, I can escalate complex issues to a specialized support team.')
mcp_copilotbrowser_browser_click(element='Save button')
mcp_copilotbrowser_browser_wait_for(time=3)
mcp_copilotbrowser_browser_take_screenshot(filename='technical-support-created.png')

# Step 12: Publish Agent with New Topics
mcp_copilotbrowser_browser_click(element='Publish button')
mcp_copilotbrowser_browser_click(element='Confirm publish button')
mcp_copilotbrowser_browser_wait_for(time=10)
mcp_copilotbrowser_browser_take_screenshot(filename='l1-agent-published.png')

# Step 13: Test Technical Support Topic
mcp_copilotbrowser_browser_type(element='Test chat input', text='I need help with a technical issue')
mcp_copilotbrowser_browser_click(element='Send button in test chat')
mcp_copilotbrowser_browser_wait_for(time=5)
mcp_copilotbrowser_browser_take_screenshot(filename='test-technical-support.png')

# Step 14: Test Check Order Status Topic
mcp_copilotbrowser_browser_type(element='Test chat input', text='I need to check my order status')
mcp_copilotbrowser_browser_click(element='Send button in test chat')
mcp_copilotbrowser_browser_wait_for(time=5)
mcp_copilotbrowser_browser_take_screenshot(filename='test-check-order-status.png')

# Step 15: Test Product Inquiry Topic
mcp_copilotbrowser_browser_type(element='Test chat input', text='I have questions about your products')
mcp_copilotbrowser_browser_click(element='Send button in test chat')
mcp_copilotbrowser_browser_wait_for(time=5)
mcp_copilotbrowser_browser_take_screenshot(filename='test-product-inquiry.png')

# Step 16: Final Documentation
mcp_copilotbrowser_browser_take_screenshot(filename='final-l1-agent-config.png')