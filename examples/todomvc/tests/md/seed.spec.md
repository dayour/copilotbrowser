## Seed

- fixtures: ../fixtures

### seed test

- Navigate to 'https://demo.copilotbrowser.dev/todomvc'
  ```ts
  await page.goto('https://demo.copilotbrowser.dev/todomvc');
  ```

- expect: page title contains "TodoMVC"

- expect: The input field 'What needs to be done?' is visible
