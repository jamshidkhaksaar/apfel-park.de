/**
 * Code 128 (code set B) encoder for product labels. Covers printable ASCII,
 * which is everything our SKUs use (e.g. "AP-APP-00035"). Returns the bar and
 * space widths in modules, starting with a bar; render them as an SVG.
 */

const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

const START_B = 104;
const STOP = 106;

export const isCode128BText = (value: string): boolean => /^[\x20-\x7e]+$/.test(value);

/** Bar/space widths (in modules) for `value`, including start, checksum and stop. */
export function encodeCode128B(value: string): number[] {
  if (!value || !isCode128BText(value)) throw new Error("Code 128 B supports printable ASCII only");
  const codes = [START_B];
  let checksum = START_B;
  [...value].forEach((char, index) => {
    const code = char.charCodeAt(0) - 32;
    codes.push(code);
    checksum += code * (index + 1);
  });
  codes.push(checksum % 103, STOP);
  return codes.flatMap((code) => [...PATTERNS[code]].map(Number));
}

/** Total width in modules (without quiet zones). */
export const code128Width = (widths: number[]): number => widths.reduce((sum, width) => sum + width, 0);
