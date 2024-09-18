import inquirer from 'inquirer';

export async function getAccessToken(message: string): Promise<string> {
  const { token } = await inquirer.prompt([
    {
      type: 'password',
      name: 'token',
      message: message,
      validate: (input: string) =>
        input.length > 0 || 'Please enter a valid token',
    },
  ]);
  return token;
}

export async function selectApps(apps: any[], accountName: string) {
  const choices = apps.map((app) => ({
    name: `${app.name} (${app.id})`,
    value: app,
  }));

  const { selectedApps } = await inquirer.prompt({
    type: 'checkbox',
    name: 'selectedApps',
    message: `Select apps from ${accountName} to migrate (use space to select, enter to confirm):`,
    choices,
    validate: (answer: readonly unknown[]) => {
      if (answer.length < 1) {
        return 'You must choose at least one application.';
      }
      return true;
    },
  });

  return selectedApps;
}

export async function confirmMigration(
  sourceAccountName: string,
  targetAccountName: string,
  appCount: number
): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Are you sure you want to migrate ${appCount} app(s) from ${sourceAccountName} to ${targetAccountName}?`,
      default: false,
    },
  ]);
  return confirmed;
}

export async function retryPrompt(message: string): Promise<boolean> {
  const { retry } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'retry',
      message: message,
      default: true,
    },
  ]);
  return retry;
}
