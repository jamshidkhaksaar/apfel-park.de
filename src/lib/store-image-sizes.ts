// Match StoreCatalogClient's 1/2/3/4/5-column grid, 48px page gutters,
// 12px grid gaps, 256px sidebar + 24px gap at lg, 2px card borders,
// and the image's 32px horizontal padding. Page container caps at 1728px.
export const catalogCardImageSizes = [
  '(max-width: 359px) calc(100vw - 82px)',
  '(max-width: 767px) calc((100vw - 128px) / 2)',
  '(max-width: 1023px) calc((100vw - 174px) / 3)',
  '(max-width: 1279px) calc((100vw - 454px) / 3)',
  '(max-width: 1535px) calc((100vw - 500px) / 4)',
  '(max-width: 1727px) calc((100vw - 546px) / 5)',
  '237px',
].join(', ');

// Header CSS uses a 60px mobile bar and an 88px desktop bar. Scrolling
// shrinks these, so reserving the unscrolled size avoids a second download.
export const headerLogoSizes = '(max-width: 1023px) 60px, 88px';
