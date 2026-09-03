// ============================================
// Type stand-in for `@xmov/avatar/agent`
// ============================================
//
// The package ships its E2E Agent types as raw .ts source (`exports.types` →
// `./src/agent/index.ts`), which our strict tsconfig would fully type-check
// and reject on its bundled dependencies (pako / @msgpack/msgpack /
// socket.io-client / global protobuf, none typed).
//
// The teaching app only needs the class value to expose on `window` for the
// sandboxed executor, so TypeScript routes the import here via tsconfig
// `paths`. Runtime bundling is unaffected — Vite resolves through node's
// exports map and loads the real package.

declare const XingyunAvatarAgent: {
  new (options: Record<string, unknown>): Record<string, unknown>;
};

export default XingyunAvatarAgent;