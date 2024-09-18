// src/index.ts
import { getAccountInfo, getApps, migrateApps } from './api';
import {
  getAccessToken,
  selectApps,
  confirmMigration,
  retryPrompt,
} from './ui';

async function getValidToken(
  message: string
): Promise<{ token: string; accountInfo: any }> {
  while (true) {
    try {
      const token = await getAccessToken(message);
      const accountInfo = await getAccountInfo(token);
      console.log(`${accountInfo.name} was successfully selected.`);
      return { token, accountInfo };
    } catch (error: any) {
      console.error(
        'Failed to authenticate with the provided token:',
        error.message
      );
      const retry = await retryPrompt(
        'Would you like to try entering the token again?'
      );
      if (!retry) {
        console.log('Migration cancelled.');
        process.exit(0);
      }
    }
  }
}

async function getSelectedApps(
  token: string,
  accountInfo: any
): Promise<any[]> {
  while (true) {
    try {
      const apps = await getApps(token);
      const selectedApps = await selectApps(apps, accountInfo.name);
      if (selectedApps.length > 0) {
        return selectedApps;
      }
      console.log('No apps were selected. Please try again.');
    } catch (error: any) {
      console.error('Failed to fetch or select apps:', error.message);
      const retry = await retryPrompt('Would you like to try again?');
      if (!retry) {
        console.log('Migration cancelled.');
        process.exit(0);
      }
    }
  }
}

async function main() {
  console.log('Starting Ably app migration process...');

  // Get source account token and info
  const { token: sourceToken, accountInfo: sourceAccountInfo } =
    await getValidToken('Enter the Access Token for the source account:');

  // Get apps from source account
  const selectedApps = await getSelectedApps(sourceToken, sourceAccountInfo);
  console.log(`Selected ${selectedApps.length} apps for migration.`);

  // Get target account token and info
  const { token: targetToken, accountInfo: targetAccountInfo } =
    await getValidToken('Enter the Access Token for the target account:');

  // Confirm migration
  const confirmed = await confirmMigration(
    sourceAccountInfo.name,
    targetAccountInfo.name,
    selectedApps.length
  );
  if (!confirmed) {
    console.log('Migration cancelled.');
    process.exit(0);
  }

  // Start migration
  console.log('Starting migration process...');
  try {
    await migrateApps(sourceToken, targetToken, selectedApps);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('An error occurred during migration:', error.message);
    console.log('Migration failed.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('An unexpected error occurred:', error.message);
  process.exit(1);
});
