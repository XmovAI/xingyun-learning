// ============================================
// Agent Config Panel — Credential form (placeholders injected at execution time)
// ============================================

import { store } from '../state/app-state';
import type { AgentConfigKey } from '../types';
import { makeCollapsible } from './collapsible';
import { executeCode } from '../core/code-executor';

const FIELDS: { key: AgentConfigKey; label: string; type: 'text' | 'password' | 'select'; placeholder?: string; options?: { label: string; value: string }[] }[] = [
  { key: 'baseUrl',        label: 'Base URL',                     type: 'text',     placeholder: 'https://ark.cn-beijing.volces.com/api/v3' },
  { key: 'apiKey',         label: 'API Key',                      type: 'password' },
  { key: 'modelId',        label: '模型 ID',                      type: 'text',     placeholder: 'doubao-seed-2-0-mini-260428' },
  { key: 'asrSecretId',    label: 'ASR SecretId',                 type: 'text' },
  { key: 'asrSecretKey',   label: 'ASR SecretKey',                type: 'password' },
  { key: 'asrAppId',       label: 'ASR AppId',                    type: 'text' },
  { key: 'asrEngineModel', label: 'ASR 引擎模型',                 type: 'select',   options: [
    { label: '16k_zh（中文通用，推荐）', value: '16k_zh' },
    { label: '16k_zh_en（中英大模型）', value: '16k_zh_en' },
    { label: '8k_zh（电话场景）',       value: '8k_zh' },
    { label: '16k_en（英文通用）',      value: '16k_en' },
  ]},
];

export function createAgentConfigPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'config-panel';
  panel.innerHTML = `
    <div class="config-panel-header">
      <span class="collapse-title">
        <span class="collapse-chevron" aria-hidden="true"></span>
        <span>API 凭证配置</span>
      </span>
    </div>
    <div class="config-panel-body collapse-body">
      <div class="config-fields" id="config-fields"></div>
      <div class="config-actions">
        <button class="action-btn action-btn--primary" id="config-save">保存配置</button>
        <button class="action-btn" id="config-test">测试大模型连接</button>
      </div>
    </div>
  `;

  const header = panel.querySelector('.config-panel-header') as HTMLElement;
  const body = panel.querySelector('.config-panel-body') as HTMLElement;
  makeCollapsible({ header, target: body, root: panel, startCollapsed: false });

  // Render form fields
  const fieldsContainer = panel.querySelector('#config-fields')!;
  const config = store.getAgentConfig();
  const inputs: Record<AgentConfigKey, HTMLInputElement | HTMLSelectElement> = {} as any;

  for (const field of FIELDS) {
    const row = document.createElement('div');
    row.className = 'config-field-row';

    const label = document.createElement('label');
    label.className = 'config-field-label';
    label.textContent = field.label;

    let input: HTMLInputElement | HTMLSelectElement;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.className = 'config-field-select';
      for (const opt of (field.options || [])) {
        const op = document.createElement('option');
        op.value = opt.value;
        op.textContent = opt.label;
        input.appendChild(op);
      }
    } else {
      input = document.createElement('input');
      input.className = 'config-field-input';
      input.type = field.type === 'password' ? 'password' : 'text';
      input.placeholder = field.placeholder || '';
    }

    input.value = config[field.key] || '';
    inputs[field.key] = input;

    // Auto-save on change
    input.addEventListener('change', () => {
      store.setAgentConfig({ [field.key]: input.value });
    });

    row.appendChild(label);
    row.appendChild(input);
    fieldsContainer.appendChild(row);
  }

  // Save button — 只持久化配置，不改动编辑器代码。
  // {{placeholder}} 占位符保持原样，点击「执行」时才由 code-executor 注入。
  const saveBtn = panel.querySelector('#config-save') as HTMLButtonElement;
  saveBtn.addEventListener('click', () => {
    const collected: Record<string, string> = {};
    for (const field of FIELDS) {
      collected[field.key] = inputs[field.key].value;
    }
    store.setAgentConfig(collected as any);
    store.log('info', '凭证已保存，点击「执行」时自动注入到代码');
  });

  // Test Connection button
  const testBtn = panel.querySelector('#config-test') as HTMLButtonElement;
  testBtn.addEventListener('click', async () => {
    const cfg = store.getAgentConfig();
    const baseUrl = cfg.baseUrl || 'https://ark.cn-beijing.volces.com/api/v3';
    if (!cfg.apiKey) {
      store.log('error', '请先填写 API Key');
      return;
    }
    if (!cfg.modelId) {
      store.log('error', '请先填写模型 ID');
      return;
    }
    const code = `
      const resp = await fetch('${baseUrl}/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ${cfg.apiKey}' },
        body: JSON.stringify({ model: '${cfg.modelId}', messages: [{ role: 'user', content: 'Hello!' }] })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error('HTTP ' + resp.status + ': ' + text.slice(0, 200));
      }
      const data = await resp.json();
      log('连接测试通过！');
      log('Base URL:', '${baseUrl}');
      log('模型:', '${cfg.modelId}');
      log('回复:', data.choices[0].message.content);
    `;
    store.log('info', '正在测试大模型连接...');
    await executeCode(code);
  });

  return panel;
}
