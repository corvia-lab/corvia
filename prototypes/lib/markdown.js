// A small, safe Markdown subset for text attributes: paragraphs, line breaks,
// headings, bold, italic, inline code, lists and http(s) links. HTML is escaped.

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(text) {
  let out = escape(text);
  const codes = [];
  out = out.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
}

const BULLET = /^\s*[-*]\s+/;
const NUMBER = /^\s*\d+\.\s+/;
const kindOf = (line) => (BULLET.test(line) ? "ul" : NUMBER.test(line) ? "ol" : "p");

function renderBlock(block) {
  const heading = /^(#{1,3})\s+(.*)$/.exec(block);
  if (heading && !block.includes("\n")) return `<h${heading[1].length + 3}>${inline(heading[2])}</h${heading[1].length + 3}>`;
  // Split the block into runs of text lines and list lines, so a list may follow a text line directly.
  const runs = [];
  for (const line of block.split("\n")) {
    const kind = kindOf(line);
    if (runs.length && runs[runs.length - 1].kind === kind) runs[runs.length - 1].lines.push(line);
    else runs.push({ kind, lines: [line] });
  }
  return runs.map(({ kind, lines }) => {
    if (kind === "p") return `<p>${lines.map(inline).join("<br>")}</p>`;
    const marker = kind === "ul" ? BULLET : NUMBER;
    return `<${kind}>${lines.map((l) => `<li>${inline(l.replace(marker, ""))}</li>`).join("")}</${kind}>`;
  }).join("\n");
}

export function renderMarkdown(text) {
  if (!text) return "";
  return String(text).replace(/\r\n/g, "\n").split(/\n{2,}/).map(renderBlock).filter((b) => b && b !== "<p></p>").join("\n");
}
