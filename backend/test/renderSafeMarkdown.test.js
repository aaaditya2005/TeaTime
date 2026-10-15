const test = require("node:test");
const assert = require("node:assert/strict");
const renderSafeMarkdown = require("../src/utils/renderSafeMarkdown.js");

test("renders Markdown formatting", () => {
    const html = renderSafeMarkdown("**Three hearts**\n\n- One systemic heart\n- Two branchial hearts");

    assert.match(html, /<strong>Three hearts<\/strong>/);
    assert.match(html, /<ul>/);
    assert.match(html, /<li>One systemic heart<\/li>/);
});

test("strips unsafe HTML from generated content", () => {
    const html = renderSafeMarkdown("Safe text<script>alert(1)</script>");

    assert.doesNotMatch(html, /<script/i);
});