import { describe, expect, it } from 'vitest';
import { resolveContext } from '../src/resolve';
import type { PluginManifest } from '@open-design/contracts';

function makeRegistry() {
  return {
    skills: [{ id: 'design-audit', title: 'Design Audit' }],
    designSystems: [],
    craft: [],
    atoms: [],
  };
}

describe('resolveContext', () => {
  it('skips plugin-local skill paths without warnings', () => {
    const manifest: PluginManifest = {
      name: 'example-web-prototype',
      version: '0.1.0',
      od: {
        context: {
          skills: [
            { path: './SKILL.md' },
            { path: 'nested/SKILL.md' },
          ],
        },
      },
    };

    const result = resolveContext(manifest, {
      registry: makeRegistry(),
      warnOnMissing: true,
    });

    expect(result.warnings).toEqual([]);
    expect(result.context.items).toEqual([]);
    expect(result.digestRefs).toEqual([]);
  });

  it('still resolves registry-backed skill ids declared via path', () => {
    const manifest: PluginManifest = {
      name: 'example-web-prototype',
      version: '0.1.0',
      od: {
        context: {
          skills: [{ path: 'design-audit' }],
        },
      },
    };

    const result = resolveContext(manifest, {
      registry: makeRegistry(),
      warnOnMissing: true,
    });

    expect(result.warnings).toEqual([]);
    expect(result.context.items).toEqual([
      { kind: 'skill', id: 'design-audit', label: 'Design Audit' },
    ]);
    expect(result.digestRefs).toEqual([
      { kind: 'skill', ref: 'design-audit' },
    ]);
  });
});