import { createElement, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useState: vi.fn(() => [false, vi.fn()]),
}));

import CopyAddressButton from '../CopyAddressButton';

const address = { street: 'Wilhelm-Strauß-Weg 2b', postalCode: '21109', city: 'Hamburg' };

afterEach(() => {
  vi.mocked(useState).mockReset().mockReturnValue([false, vi.fn()]);
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('copy address accessibility', () => {
  it.each([
    ['Adresse kopieren', 'Kopiert!'],
    ['Copy address', 'Copied!'],
  ])('includes the visible address in the %s accessible name', (label, copiedLabel) => {
    const html = renderToStaticMarkup(createElement(CopyAddressButton, { address, label, copiedLabel }));
    expect(html).toContain(`aria-label="Wilhelm-Strauß-Weg 2b, 21109 Hamburg – ${label}"`);
    expect(html).toContain('type="button"');
    expect(html).toContain('role="status" aria-live="polite" aria-atomic="true"');
    expect(html.indexOf('role="status"')).toBeGreaterThan(html.indexOf('</button>'));
    expect(html).not.toContain(copiedLabel);
  });

  it('announces localized success separately from the stable button name', () => {
    vi.mocked(useState).mockReturnValueOnce([true, vi.fn()]);
    const html = renderToStaticMarkup(createElement(CopyAddressButton, { address, label: 'Adresse kopieren', copiedLabel: 'Kopiert!' }));
    expect(html.split('</button>')[0]).not.toContain('Kopiert!');
    expect(html.split('</button>')[1]).toContain('Kopiert!');
  });

  it('copies the unchanged full address and only then announces success', async () => {
    vi.useFakeTimers();
    const setCopied = vi.fn();
    vi.mocked(useState).mockReturnValueOnce([false, setCopied]);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const element = CopyAddressButton({ address });
    await element.props.children[0].props.onClick();
    expect(writeText).toHaveBeenCalledWith('Wilhelm-Strauß-Weg 2b, 21109 Hamburg');
    expect(setCopied).toHaveBeenCalledWith(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(setCopied).toHaveBeenLastCalledWith(false);
  });

  it('does not announce success when the clipboard write fails', async () => {
    const setCopied = vi.fn();
    vi.mocked(useState).mockReturnValueOnce([false, setCopied]);
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const element = CopyAddressButton({ address });
    await element.props.children[0].props.onClick();
    expect(setCopied).not.toHaveBeenCalled();
  });
});
