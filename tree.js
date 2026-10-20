// Lays a ruling's consequence tree out in columns by time horizon (depth).
export const COL = 200, ROW = 84, NW = 168, PAD = 16, TOP = 34;

export function layout(root) {
  const nodes = [], links = [];
  let row = 0, maxD = 0;
  (function walk(n, d, parent) {
    n._d = d; maxD = Math.max(maxD, d); nodes.push(n);
    if (parent) links.push([parent, n]);
    if (!n.children || !n.children.length) { n._r = row++; return; }
    n.children.forEach(c => walk(c, d + 1, n));
    n._r = n.children.reduce((s, c) => s + c._r, 0) / n.children.length;
  })(root, 0, null);
  nodes.forEach(n => { n._x = PAD + n._d * COL; n._y = TOP + PAD + 30 + n._r * ROW; });
  return { root, nodes, links, maxD, w: PAD * 2 + (maxD + 1) * COL, h: TOP + PAD * 2 + Math.max(row, 1) * ROW + 40 };
}
