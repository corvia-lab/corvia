import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../lib/markdown.js";

test("paragraphs and line breaks", () => {
  assert.equal(renderMarkdown("one\ntwo\n\nthree"), "<p>one<br>two</p>\n<p>three</p>");
});

test("headings, bold, italic and code", () => {
  assert.equal(renderMarkdown("# Title"), "<h4>Title</h4>");
  assert.equal(renderMarkdown("**b** and *i* and `c`"), "<p><strong>b</strong> and <em>i</em> and <code>c</code></p>");
});

test("bullet and numbered lists", () => {
  assert.equal(renderMarkdown("- a\n- b"), "<ul><li>a</li><li>b</li></ul>");
  assert.equal(renderMarkdown("1. a\n2. b"), "<ol><li>a</li><li>b</li></ol>");
});

test("http links are kept, other schemes are not", () => {
  assert.equal(renderMarkdown("[docs](https://example.org)"), '<p><a href="https://example.org" target="_blank" rel="noopener">docs</a></p>');
  assert.equal(renderMarkdown("[x](javascript:alert(1))"), "<p>[x](javascript:alert(1))</p>");
});

test("HTML is escaped", () => {
  assert.equal(renderMarkdown('<script>alert("x")</script>'), "<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>");
});

test("empty input gives empty output", () => {
  assert.equal(renderMarkdown(""), "");
  assert.equal(renderMarkdown(null), "");
});

test("a list directly after a text line is still a list", () => {
  assert.equal(renderMarkdown("**Important**\n- one\n- two"), "<p><strong>Important</strong></p>\n<ul><li>one</li><li>two</li></ul>");
});
