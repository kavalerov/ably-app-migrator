import axios from 'axios';

const API_BASE_URL = 'https://control.ably.net/v1';

export async function getAccountInfo(token: string) {
  try {
    console.log('Fetching account info...');
    const response = await axios.get(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Account info fetched successfully');
    return response.data.account;
  } catch (error: any) {
    console.error(
      'Error fetching account info:',
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function getApps(token: string) {
  try {
    console.log('Fetching apps...');
    const accountInfo = await getAccountInfo(token);
    const response = await axios.get(
      `${API_BASE_URL}/accounts/${accountInfo.id}/apps`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`Fetched ${response.data.length} apps successfully`);
    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching apps:',
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function migrateApps(
  sourceToken: string,
  targetToken: string,
  apps: any[]
) {
  const sourceAccountInfo = await getAccountInfo(sourceToken);
  const targetAccountInfo = await getAccountInfo(targetToken);
  const allApps = await getApps(sourceToken);
  for (const app of apps) {
    try {
      console.log(`\nStarting migration for app: ${app.name} (${app.id})`);
      const sourceAppDetails = await getAppDetails(allApps, app.id);
      console.log('Fetched source app details');
      const newApp = await createApp(
        targetToken,
        targetAccountInfo.id,
        sourceAppDetails
      );
      console.log(
        `Created new app in target account: ${newApp.name} (${newApp.id})`
      );
      await migrateKeys(sourceToken, app.id, targetToken, newApp.id);
      console.log('Migrated keys');
      await migrateNamespaces(sourceToken, app.id, targetToken, newApp.id);
      console.log('Migrated namespaces');
      await migrateRules(sourceToken, app.id, targetToken, newApp.id);
      console.log('Migrated rules');
      console.log(`Completed migration for app: ${app.name} (${app.id})`);
    } catch (error: any) {
      console.error(
        `Error migrating app ${app.name} (${app.id}):`,
        error.response?.data || error.message
      );
    }
  }
}

async function getAppDetails(allApps: any[], appId: string) {
  return allApps.find((app) => app.id === appId);
}

async function createApp(token: string, accountId: string, appDetails: any) {
  try {
    console.log('Creating new app in target account');

    // Filter out properties that shouldn't be sent when creating a new app
    const { name, status, tlsOnly } = appDetails;
    const newAppDetails = { name, status, tlsOnly };

    const response = await axios.post(
      `${API_BASE_URL}/accounts/${accountId}/apps`,
      newAppDetails,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`Created new app: ${response.data.name} (${response.data.id})`);
    return response.data;
  } catch (error: any) {
    console.error(
      'Error creating new app:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function migrateKeys(
  sourceToken: string,
  sourceAppId: string,
  targetToken: string,
  targetAppId: string
) {
  try {
    const keys = await getKeys(sourceToken, sourceAppId);
    for (const key of keys) {
      await createKey(targetToken, targetAppId, key);
    }
  } catch (error: any) {
    console.error(
      'Error migrating keys:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getKeys(token: string, appId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/apps/${appId}/keys`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching keys for app:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createKey(token: string, appId: string, keyDetails: any) {
  try {
    const { name, capability } = keyDetails;
    const response = await axios.post(
      `${API_BASE_URL}/apps/${appId}/keys`,
      { name, capability },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`Created new key: ${response.data.id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      'Error creating key for app:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function migrateNamespaces(
  sourceToken: string,
  sourceAppId: string,
  targetToken: string,
  targetAppId: string
) {
  try {
    const namespaces = await getNamespaces(sourceToken, sourceAppId);
    for (const namespace of namespaces) {
      await createNamespace(targetToken, targetAppId, namespace);
    }
  } catch (error: any) {
    console.error(
      'Error migrating namespaces:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getNamespaces(token: string, appId: string) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/apps/${appId}/namespaces`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching namespaces for app:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createNamespace(
  token: string,
  appId: string,
  namespaceDetails: any
) {
  try {
    const {
      id,
      authenticated,
      persisted,
      persistLast,
      pushEnabled,
      tlsOnly,
      batchingEnabled,
      batchingPolicy,
      batchingInterval,
      exposeTimeserial,
    } = namespaceDetails;

    const response = await axios.post(
      `${API_BASE_URL}/apps/${appId}/namespaces`,
      {
        id,
        authenticated,
        persisted,
        persistLast,
        pushEnabled,
        tlsOnly,
        batchingEnabled,
        batchingPolicy,
        batchingInterval,
        exposeTimeserial,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`Created new namespace: ${response.data.id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      'Error creating namespace for app:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function migrateRules(
  sourceToken: string,
  sourceAppId: string,
  targetToken: string,
  targetAppId: string
) {
  try {
    const rules = await getRules(sourceToken, sourceAppId);
    for (const rule of rules) {
      await createRule(targetToken, targetAppId, rule);
    }
  } catch (error: any) {
    console.error(
      'Error migrating rules:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getRules(token: string, appId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/apps/${appId}/rules`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching rules for app:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createRule(token: string, appId: string, ruleDetails: any) {
  try {
    const { status, ruleType, requestMode, source, target } = ruleDetails;

    const response = await axios.post(
      `${API_BASE_URL}/apps/${appId}/rules`,
      {
        status,
        ruleType,
        requestMode,
        source,
        target,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`Created new rule: ${response.data.id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      'Error creating rule for app:',
      error.response?.data || error.message
    );
    throw error;
  }
}
