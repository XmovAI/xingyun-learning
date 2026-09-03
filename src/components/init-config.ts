// ============================================
// Init Config Panel — appId / appSecret / gatewayServer form
// (placeholders injected at execution time)
// ============================================

import { store, INIT_CONFIG_STORAGE_KEY, DEFAULT_GATEWAY } from '../state/app-state';
import { makeCollapsible } from './collapsible';
import { syncGatewayToEditors } from './code-editor';

interface InitConfig {
  appId: string;
  appSecret: string;
  gatewayServer: string;
}

function loadConfig(): InitConfig {
  try {
    const raw = localStorage.getItem(INIT_CONFIG_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      appId: data.appId || '',
      appSecret: data.appSecret || '',
      gatewayServer: data.gatewayServer || DEFAULT_GATEWAY,
    };
  } catch {
    return { appId: '', appSecret: '', gatewayServer: DEFAULT_GATEWAY };
  }
}

function saveConfig(config: InitConfig) {
  localStorage.setItem(INIT_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function createInitConfigPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'config-panel';
  panel.innerHTML = `
    <div class="config-panel-header">
      <span class="collapse-title">
        <span class="collapse-chevron" aria-hidden="true"></span>
        <span>应用凭证配置</span>
      </span>
    </div>
    <div class="config-panel-body collapse-body">
      <div class="config-fields" id="init-config-fields"></div>
      <div class="config-actions">
        <button class="action-btn action-btn--primary" id="init-config-save">保存配置</button>
        <button class="action-btn" id="init-config-clear">清空</button>
      </div>
    </div>
  `;

  const header = panel.querySelector('.config-panel-header') as HTMLElement;
  const body = panel.querySelector('.config-panel-body') as HTMLElement;
  makeCollapsible({ header, target: body, root: panel, startCollapsed: false });

  // Render fields
  const fieldsContainer = panel.querySelector('#init-config-fields')!;
  const config = loadConfig();

  const appIdInput = document.createElement('input');
  appIdInput.className = 'config-field-input';
  appIdInput.type = 'text';
  appIdInput.placeholder = '你的 App ID';
  appIdInput.value = config.appId;

  const appSecretInput = document.createElement('input');
  appSecretInput.className = 'config-field-input';
  appSecretInput.type = 'password';
  appSecretInput.placeholder = '你的 App Secret';
  appSecretInput.value = config.appSecret;

  const gatewayInput = document.createElement('input');
  gatewayInput.className = 'config-field-input';
  gatewayInput.type = 'text';
  gatewayInput.placeholder = DEFAULT_GATEWAY;
  gatewayInput.value = config.gatewayServer;

  const fields = [
    { label: 'AppId', input: appIdInput },
    { label: 'AppSecret', input: appSecretInput },
    { label: 'Gateway Server', input: gatewayInput },
  ];

  for (const { label, input } of fields) {
    const row = document.createElement('div');
    row.className = 'config-field-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'config-field-label';
    labelEl.textContent = label;

    row.appendChild(labelEl);
    row.appendChild(input);
    fieldsContainer.appendChild(row);
  }

  // Save — 只持久化配置，不改动编辑器代码。
  // {{appId}} / {{appSecret}} / {{gatewayServer}} 占位符保持原样，点击「执行」时由 code-executor 注入。
  panel.querySelector('#init-config-save')!.addEventListener('click', () => {
    const appId = appIdInput.value.trim();
    const appSecret = appSecretInput.value.trim();
    const gatewayServer = gatewayInput.value.trim() || DEFAULT_GATEWAY;

    if (!appId || !appSecret) {
      store.log('error', '请填写 AppId 和 AppSecret');
      return;
    }

    saveConfig({ appId, appSecret, gatewayServer });
    syncGatewayToEditors();
    store.log('info', '凭证已保存，Gateway 已同步到代码，点击「执行」时自动注入 AppId/AppSecret');
  });

  // Clear
  panel.querySelector('#init-config-clear')!.addEventListener('click', () => {
    appIdInput.value = '';
    appSecretInput.value = '';
    gatewayInput.value = DEFAULT_GATEWAY;
    localStorage.removeItem(INIT_CONFIG_STORAGE_KEY);
    syncGatewayToEditors();
    store.log('info', '凭证已清空（Gateway 已恢复为默认地址）');
  });

  return panel;
}
