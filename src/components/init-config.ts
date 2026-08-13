// ============================================
// Init Config Panel — appId / appSecret form (placeholders injected at execution time)
// ============================================

import { store, INIT_CONFIG_STORAGE_KEY } from '../state/app-state';
import { makeCollapsible } from './collapsible';

function loadConfig(): { appId: string; appSecret: string } {
  try {
    const raw = localStorage.getItem(INIT_CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { appId: '', appSecret: '' };
  } catch {
    return { appId: '', appSecret: '' };
  }
}

function saveConfig(appId: string, appSecret: string) {
  localStorage.setItem(INIT_CONFIG_STORAGE_KEY, JSON.stringify({ appId, appSecret }));
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

  const fields = [
    { label: 'AppId', input: appIdInput },
    { label: 'AppSecret', input: appSecretInput },
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
  // {{appId}} / {{appSecret}} 占位符保持原样，点击「执行」时由 code-executor 注入。
  panel.querySelector('#init-config-save')!.addEventListener('click', () => {
    const appId = appIdInput.value.trim();
    const appSecret = appSecretInput.value.trim();

    if (!appId || !appSecret) {
      store.log('error', '请填写 AppId 和 AppSecret');
      return;
    }

    saveConfig(appId, appSecret);
    store.log('info', '凭证已保存，点击「执行」时自动注入到代码');
  });

  // Clear
  panel.querySelector('#init-config-clear')!.addEventListener('click', () => {
    appIdInput.value = '';
    appSecretInput.value = '';
    localStorage.removeItem(INIT_CONFIG_STORAGE_KEY);
    store.log('info', '凭证已清空');
  });

  return panel;
}
