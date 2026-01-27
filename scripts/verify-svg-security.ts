import { isSecureSvg } from "../src/lib/security";

const runTests = () => {
  const tests = [
    {
      name: "Valid SVG",
      input: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>`,
      expected: true
    },
    {
      name: "SVG with Script Tag",
      input: `<svg><script>alert(1)</script></svg>`,
      expected: false
    },
    {
      name: "SVG with Script Tag (Case Insensitive)",
      input: `<svg><SCRIPT>alert(1)</SCRIPT></svg>`,
      expected: false
    },
    {
      name: "SVG with onload handler",
      input: `<svg onload="alert(1)"></svg>`,
      expected: false
    },
    {
      name: "SVG with onclick handler",
      input: `<svg><rect onclick="alert(1)" /></svg>`,
      expected: false
    },
    {
      name: "SVG with javascript: href",
      input: `<svg><a href="javascript:alert(1)">link</a></svg>`,
      expected: false
    },
    {
      name: "SVG with foreignObject",
      input: `<svg><foreignObject><iframe></iframe></foreignObject></svg>`,
      expected: false
    },
    {
      name: "SVG with spaced event handler",
      input: `<svg><rect onmouseover  =  "alert(1)" /></svg>`,
      expected: false
    },
    {
      name: "SVG with data:image/svg+xml",
      input: `<svg><image href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoMSk8L3NjcmlwdD48L3N2Zz4=" /></svg>`,
      expected: false
    },
    {
      name: "SVG with entity-encoded javascript:",
      input: `<svg><a href="j&#97;vascript:alert(1)">link</a></svg>`,
      expected: false
    },
    {
      name: "SVG with hex entity-encoded javascript:",
      input: `<svg><a href="j&#x61;vascript:alert(1)">link</a></svg>`,
      expected: false
    }
  ];

  let passed = 0;
  let failed = 0;

  console.log("Running SVG Security Tests...\n");

  tests.forEach(test => {
    const result = isSecureSvg(test.input);
    if (result === test.expected) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Input: ${test.input}`);
      console.log(`   Expected: ${test.expected}, Got: ${result}`);
      failed++;
    }
  });

  console.log(`\nTests Completed. Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) process.exit(1);
};

runTests();
