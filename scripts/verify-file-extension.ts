import { validateImageFileExtension } from "../src/lib/security";

const runTests = () => {
  const tests = [
    // Valid cases
    {
      name: "Valid PNG",
      filename: "test.png",
      mimeType: "image/png",
      expected: true,
    },
    {
      name: "Valid JPEG",
      filename: "test.jpg",
      mimeType: "image/jpeg",
      expected: true,
    },
    {
      name: "Valid JPEG (full extension)",
      filename: "test.jpeg",
      mimeType: "image/jpeg",
      expected: true,
    },
    {
      name: "Valid WebP",
      filename: "test.webp",
      mimeType: "image/webp",
      expected: true,
    },
    {
      name: "Valid SVG",
      filename: "test.svg",
      mimeType: "image/svg+xml",
      expected: true,
    },
    {
      name: "Valid Uppercase Extension",
      filename: "TEST.PNG",
      mimeType: "image/png",
      expected: true,
    },

    // Invalid cases (Spoofing attempts)
    {
      name: "HTML masquerading as PNG",
      filename: "malicious.html",
      mimeType: "image/png",
      expected: false,
    },
    {
      name: "EXE masquerading as JPEG",
      filename: "virus.exe",
      mimeType: "image/jpeg",
      expected: false,
    },
    {
      name: "Script masquerading as SVG",
      filename: "script.js",
      mimeType: "image/svg+xml",
      expected: false,
    },
    {
      name: "Double extension (malicious end)",
      filename: "image.png.html",
      mimeType: "image/png",
      expected: false,
    },
    {
      name: "Mismatched image types (PNG as JPEG)",
      filename: "test.png",
      mimeType: "image/jpeg",
      expected: false,
    },
    {
      name: "No extension",
      filename: "test",
      mimeType: "image/png",
      expected: false,
    },
    {
      name: "Unknown MIME type",
      filename: "test.png",
      mimeType: "application/unknown",
      expected: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  console.log("Running File Extension Security Tests...\n");

  tests.forEach((test) => {
    const result = validateImageFileExtension(test.filename, test.mimeType);
    if (result === test.expected) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   File: ${test.filename}, MIME: ${test.mimeType}`);
      console.log(`   Expected: ${test.expected}, Got: ${result}`);
      failed++;
    }
  });

  console.log(`\nTests Completed. Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) process.exit(1);
};

runTests();
