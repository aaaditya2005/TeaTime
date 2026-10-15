const MarkdownIt = require("markdown-it");
const sanitizeHtml = require("sanitize-html");

const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });

module.exports = function renderSafeMarkdown(content) {
    return sanitizeHtml(markdown.render(content));
};