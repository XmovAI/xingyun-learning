// ============================================
// Guide Tour — First-visit onboarding overlay
// ============================================

/**
 * Shown once on first load. Introduces the page's regions one by one with a
 * spotlight; finishing (or skipping) persists a localStorage marker so the
 * tour is not shown again.
 */

const GUIDE_KEY = 'xingyun_guide_seen_v1';

interface GuideStep {
  /** CSS selector of the element to spotlight. Omit for a centered card. */
  target?: string | null;
  title: string;
  body: string;
  /** Optional small muted line shown under the body. */
  note?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: '欢迎使用魔珐星云 SDK 教学',
    body: '这是一个动手实践平台，带你从零认识「魔珐星云 XingyunAvatarAgent」端到端 SDK——创建具身交互智能体实例、连接与渲染、SSML 播报、动作表情控制，最后搭一个能对话的具身智能体。',
  },
  {
    target: '.sidebar',
    title: '功能导航',
    body: '右侧标签栏（手机上在底部）按「初始化 → 表达 → 感知&大脑」组织学习路径。点击标签，对应的功能面板就会展开。',
    note: '「表达」，以及「感知&大脑」需要先创建实例并连接成功后才能使用（未连接时对应 Tab 会置灰、不可点击）。',
  },
  {
    target: '.avatar-panel',
    title: '具身智能体展示区',
    body: '这里是主舞台，3D 具身智能体会在这里实时渲染。执行代码后的对话、动作、表情，都会在这一侧直观呈现。',
    note: '左上角的圆点显示连接状态：灰色=未连接，黄色=连接中，绿色=已连接。',
  },
  {
    target: '.sidebar-help',
    title: '使用说明',
    body: '遇到不明白的地方，随时点击「❓」打开完整使用说明——占位符替换、async 执行、预置方法等约定都在里面。',
  },
  {
    title: '准备好了吗？',
    body: '从「初始化」开始：先看「前置准备」注册账号并获取 App ID / App Secret，再到「创建实例」填入凭证并执行代码；之后到「感知&大脑」用文本 / 语音对话跑通端到端交互，你的第一个具身智能体就要登场了。',
    note: '本引导只出现一次，之后可随时在「❓ 使用说明」里回顾。',
  },
];

const MARGIN = 16;

export function maybeShowGuide(): void {
  try {
    if (localStorage.getItem(GUIDE_KEY)) return;
  } catch {
    return; // storage unavailable — don't block the app on a tour
  }
  replayGuide();
}

/**
 * Replay the onboarding tour on demand (e.g. from the help tab), bypassing the
 * first-visit marker. Finishing a replay still (re)writes the marker.
 */
export function replayGuide(): void {
  new GuideTour().start();
}

class GuideTour {
  private root: HTMLElement;
  private spotlight: HTMLElement;
  private backdrop: HTMLElement;
  private card: HTMLElement;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private noteEl: HTMLElement;
  private dotsEl: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private step = 0;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'guide-root';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', '新手引导');

    this.root.innerHTML = `
      <div class="guide-backdrop"></div>
      <div class="guide-spotlight"></div>
      <div class="guide-card guide-pop">
        <div class="guide-card-title"></div>
        <div class="guide-card-body"></div>
        <div class="guide-card-note"></div>
        <div class="guide-footer">
          <button type="button" class="guide-btn guide-skip">跳过</button>
          <div class="guide-dots"></div>
          <button type="button" class="guide-btn guide-prev">上一步</button>
          <button type="button" class="guide-btn guide-btn--primary guide-next">下一步</button>
        </div>
      </div>
    `;

    this.spotlight = this.root.querySelector<HTMLElement>('.guide-spotlight')!;
    this.backdrop = this.root.querySelector<HTMLElement>('.guide-backdrop')!;
    this.card = this.root.querySelector<HTMLElement>('.guide-card')!;
    this.titleEl = this.root.querySelector<HTMLElement>('.guide-card-title')!;
    this.bodyEl = this.root.querySelector<HTMLElement>('.guide-card-body')!;
    this.noteEl = this.root.querySelector<HTMLElement>('.guide-card-note')!;
    this.dotsEl = this.root.querySelector<HTMLElement>('.guide-dots')!;
    this.prevBtn = this.root.querySelector<HTMLButtonElement>('.guide-prev')!;
    this.nextBtn = this.root.querySelector<HTMLButtonElement>('.guide-next')!;
    const skipBtn = this.root.querySelector<HTMLButtonElement>('.guide-skip')!;

    this.prevBtn.addEventListener('click', () => {
      if (this.step > 0) this.go(this.step - 1);
    });
    this.nextBtn.addEventListener('click', () => {
      if (this.step >= GUIDE_STEPS.length - 1) this.finish();
      else this.go(this.step + 1);
    });
    skipBtn.addEventListener('click', () => this.finish());

    // Clicking anywhere outside the card advances the tour.
    this.root.addEventListener('click', (e) => {
      if (e.target instanceof Node && this.card.contains(e.target)) return;
      if (this.step >= GUIDE_STEPS.length - 1) this.finish();
      else this.go(this.step + 1);
    });
  }

  start(): void {
    document.body.appendChild(this.root);
    this.go(0);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('keydown', this.onKeydown);
  }

  private go(index: number): void {
    this.step = index;
    const step = GUIDE_STEPS[index];

    this.titleEl.textContent = step.title;
    this.bodyEl.textContent = step.body;
    if (step.note) {
      this.noteEl.textContent = step.note;
      this.noteEl.style.display = '';
    } else {
      this.noteEl.textContent = '';
      this.noteEl.style.display = 'none';
    }

    const isLast = index === GUIDE_STEPS.length - 1;
    this.prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    this.nextBtn.textContent = isLast ? '开始使用' : '下一步';

    this.dotsEl.innerHTML = '';
    GUIDE_STEPS.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = i === index ? 'guide-dot guide-dot--active' : 'guide-dot';
      this.dotsEl.appendChild(dot);
    });

    // Restart the card's entrance animation for the new step.
    this.card.classList.remove('guide-pop');
    void this.card.offsetWidth;
    this.card.classList.add('guide-pop');

    // Measure & position once the new content has been laid out.
    requestAnimationFrame(() => {
      this.layout();
      this.nextBtn.focus();
    });
  }

  /** Position the spotlight + card for the current step (also on resize). */
  private layout(): void {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const target = this.currentTarget();
    const cardRect = this.card.getBoundingClientRect();
    const cardW = cardRect.width;
    const cardH = cardRect.height;

    if (!target) {
      this.spotlight.style.display = 'none';
      this.backdrop.style.display = 'block';
      this.card.style.left = `${Math.round((vw - cardW) / 2)}px`;
      this.card.style.top = `${Math.round(Math.max(MARGIN, (vh - cardH) / 2))}px`;
      return;
    }

    this.backdrop.style.display = 'none';
    this.spotlight.style.display = 'block';

    const r = target.getBoundingClientRect();
    const pad = 8;
    this.spotlight.style.left = `${Math.round(r.left - pad)}px`;
    this.spotlight.style.top = `${Math.round(r.top - pad)}px`;
    this.spotlight.style.width = `${Math.round(r.width + pad * 2)}px`;
    this.spotlight.style.height = `${Math.round(r.height + pad * 2)}px`;

    // Side of the target the card fits beside best.
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const candidates: { left: number; top: number }[] = [
      { left: r.right + MARGIN, top: cy - cardH / 2 }, // right
      { left: r.left - MARGIN - cardW, top: cy - cardH / 2 }, // left
      { left: cx - cardW / 2, top: r.bottom + MARGIN }, // below
      { left: cx - cardW / 2, top: r.top - MARGIN - cardH }, // above
    ];

    let best = candidates[0];
    let bestScore = -Infinity;
    for (const c of candidates) {
      let score = 0;
      if (c.left >= MARGIN && c.left + cardW <= vw - MARGIN) score += 2;
      if (c.top >= MARGIN && c.top + cardH <= vh - MARGIN) score += 2;
      score -= Math.max(0, MARGIN - c.left) + Math.max(0, c.left + cardW - (vw - MARGIN));
      score -= Math.max(0, MARGIN - c.top) + Math.max(0, c.top + cardH - (vh - MARGIN));
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }

    const left = Math.min(Math.max(best.left, MARGIN), vw - MARGIN - cardW);
    const top = Math.min(Math.max(best.top, MARGIN), vh - MARGIN - cardH);
    this.card.style.left = `${Math.round(left)}px`;
    this.card.style.top = `${Math.round(top)}px`;
  }

  private currentTarget(): HTMLElement | null {
    const sel = GUIDE_STEPS[this.step].target;
    return sel ? document.querySelector<HTMLElement>(sel) : null;
  }

  private onResize = (): void => {
    requestAnimationFrame(() => this.layout());
  };

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.finish();
      return;
    }
    // Trap Tab within the tour so focus can't wander behind the overlay.
    if (e.key === 'Tab') {
      const focusables = Array.from(this.root.querySelectorAll<HTMLElement>('button'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  private finish(): void {
    try {
      localStorage.setItem(GUIDE_KEY, '1');
    } catch {}
    this.root.remove();
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('keydown', this.onKeydown);
  }
}