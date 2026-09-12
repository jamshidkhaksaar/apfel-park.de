import { expect, it } from 'vitest';
import { isSafeRedirect, isSecureSvg } from '../security';

it.each([
  '<svg xmlns:s="http://www.w3.org/2000/svg"><s:script>alert(1)</s:script></svg>',
  '<svg xmlns:s="http://www.w3.org/2000/svg"><s:foreignObject /></svg>',
  '<svg xmlns:s="http://www.w3.org/2000/svg"><s:animate /></svg>',
  '<svg><a href="https://example.invalid">go</a></svg>',
  '<svg><image href="https://example.invalid/a.png" /></svg>',
  '<svg><style>@import "https://example.invalid/style";</style></svg>',
  '<svg><path style="fill:url(https://example.invalid/a)" /></svg>',
  '<svg><path fill="url(https://example.invalid/a)" /></svg>',
  '<svg><path fill="u&#114;l(https://example.invalid/a)" /></svg>',
  '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>',
  '<?xml-stylesheet href="https://example.invalid"?><svg/>',
  '<svg xmlns="http://www.w3.org/1999/xhtml"><script /></svg>',
  '<svg><g xmlns="http://www.w3.org/1999/xhtml"><a /></g></svg>',
  '<svg><path onload="alert(1)" /></svg>', '<svg><use href="#x" /></svg>',
  '<svg><path d="M0 0" d="M1 1" /></svg>', '<svg><g></svg>',
  '<svg/><svg/>', '<html/>', '<svg>\u0000</svg>',
])('rejects active or unsupported SVG grammar %s', (svg) => expect(isSecureSvg(svg)).toBe(false));
it.each([
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>',
  '<svg width="100" height="100"><rect /></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gold"><stop offset="0%" stop-color="#f0c" /></linearGradient></defs><path d="M0 0L10 10Z" fill="url(#gold)" /></svg>',
  '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"><title>Logo</title><g transform="translate(1 2)"><path fill="#fff" d="M0 0h10v10z" /></g></svg>',
])('preserves static vector logos %s', (svg) => expect(isSecureSvg(svg)).toBe(true));

it.each([
  '/\\example.invalid/a', '/\\\\example.invalid/a', '//example.invalid',
  '/%5cexample.invalid', '/%2fexample.invalid', '/%255cexample.invalid',
  '/admin\n', '/admin%0d%0aLocation:x', '/admin\\x',
])('rejects unsafe redirect %s', (input) => expect(isSafeRedirect(input)).toBe(false));
it.each(['/admin', '/admin/products?query=hello%20world#edit', '/de/store', '/'])('preserves local redirect %s', (input) => expect(isSafeRedirect(input)).toBe(true));
