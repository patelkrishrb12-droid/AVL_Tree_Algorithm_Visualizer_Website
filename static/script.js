// State and decloration
let tree_data = null;
let node_map = {};      // val -> {x, y, tx, ty, alpha, scale, color}
let high_lighted = {};  // val -> color
let anim_frame = null;
const r = 22;
 // API
async function api_call(endpoint, body = {}) {
    const method = endpoint === 'tree' ? 'GET' : 'POST';
    const t0 = performance.now();
    try {
        const res = await fetch('/api/' + endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'POST' ? JSON.stringify(body) : undefined
        });
        const data = await res.json();
        const ms = Math.round(performance.now() - t0);
        log_api(method, '/api/' + endpoint, res.status, ms);
        return data;
    } catch (e) {
        log_api(method, '/api/' + endpoint, 'ERR', 0);
        set_log('Cannot reach Flask server. Make sure app.py is running.', 'err');
        return null;
    }
}
 // Operator 
async function op(type) {
    const input = document.getElementById('val-input');
    const val = parseInt(input.value);
 
    if (type === 'clear') {
        const r = await api_call('clear');
        if (!r) return;
        tree_data = r.tree;
        node_map = {};
        high_lighted = {};
        set_log('Tree cleared.', 'warn');
        process_log(r.log);
        draw();
        return;
    }
    if (isNaN(val)) {
        set_log('Enter valid integer.', 'err');
        return;
    }
    high_lighted = {};
    const r = await api_call(type, { val });
    if (!r) return;
    tree_data = r.tree;
    input.value = '';
 
    if (type === 'insert') {
        const dup = r.log.find(l => l.action === 'duplicate');
        if (dup) {
            set_log(`${val} already exists in tree.`, 'warn');
        } else {
            high_lighted[val] = '#2ec4a9';
            const rot = r.log.find(l => l.rotation);
            set_log(`Inserted ${val}. Rotation: ${rot ? rot.rotation + ' at node ' + rot.at : 'none needed.'}.`, 'ok');
            update_state_rot(rot ? rot.rotation : '-');
            setTimeout(() => { delete high_lighted[val]; draw(); }, 1400);
        }
    } else if (type === 'delete') {
        const nf = r.log.find(l => l.action === 'not_found');
        if (nf) {
            set_log(`${val} not found in tree.`, 'err');
        } else {
            const rot = r.log.find(l => l.rotation);
            set_log(`Deleted ${val}. Rotation: ${rot ? rot.rotation + ' at node ' + rot.at : 'none needed'}.`, 'ok');
            update_state_rot(rot ? rot.rotation : '-');
        }
    } else if (type === 'search') {
        if (r.found) {
            r.path.forEach(v => high_lighted[v] = '#f5a623');
            draw();
            set_log(`Found ${val}. Path: ${r.path.join(' -> ')}.`, 'ok');
            setTimeout(() => { high_lighted = {};
            draw();
         }, 1800);
        } else {
            set_log(`${val} not found in tree.`, 'err');
        }
    }
 
    process_log(r.log);
    draw();
}
 
function process_log(log) {
    const rot = log && log.find(l => l.rotation);
    if (rot) update_state_rot(rot.rotation);
}
 
async function load_demo() {
    await api_call('clear');
    tree_data = null;
    node_map = {};
    high_lighted = {};
    const vals = [40, 20, 60, 10, 30, 50, 70, 5, 15];
    for (const v of vals) {
        await new Promise(res => setTimeout(res, 380));
        const result = await api_call('insert', { val: v });
        if (!result) break;
        tree_data = result.tree;
        high_lighted = { [v]: '#2ec4a9' };
        const rot = result.log.find(l => l.rotation);
        set_log(`Inserted ${v}. Rotation: ${rot ? rot.rotation : 'none'}.`, 'ok');
        if (rot) update_state_rot(rot.rotation);
        draw();
        await new Promise(res => setTimeout(res, 300));
        delete high_lighted[v];
        draw();
    }
    set_log('Demo tree loaded!', 'ok');
}
 
document.getElementById('val-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') op('insert');
});
 // Canvas drawing
const canvas = document.getElementById('cvs');
const ctx = canvas.getContext('2d');
 
function resize_canvas() {
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = wrap.clientWidth * dpr;
    canvas.height = wrap.clientHeight * dpr;
    canvas.style.width = wrap.clientWidth + 'px';
    canvas.style.height = wrap.clientHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    draw();
}
 
window.addEventListener('resize', resize_canvas);
setTimeout(resize_canvas, 0);
 
function count_node(n) { return n ? 1 + count_node(n.left) + count_node(n.right) : 0; }
function tree_height(n) { return n ? n.Height : 0; }
 
function assign_positions(n, depth, lo, hi, out) {
    if (!n) return;
    const mid = (lo + hi) / 2;
    const tx = mid;
    const ty = 54 + depth * 72;
    out[n.Value] = { tx, ty, val: n.Value, height: n.Height, bf: n.bf };
    assign_positions(n.left, depth + 1, lo, mid, out);
    assign_positions(n.right, depth + 1, mid, hi, out);
}
 
function lerp(a, b, t) { return a + (b - a) * t; }
 
function draw() {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
 
    document.getElementById('empty-state').style.display = tree_data ? 'none' : 'block';
    // update declorations
    const n = count_node(tree_data);
    document.getElementById('stat-n').textContent = n;
    document.getElementById('stat-h').textContent = tree_height(tree_data);
 
    const position = {};
    assign_positions(tree_data, 0, 0, W, position);
    // animate node position
    for (const [val, pos] of Object.entries(position)) {
        const v = parseInt(val);
        if (!node_map[v]) {
            node_map[v] = { x: pos.tx, y: pos.ty, alpha: 0, scale: 0.1 };
        }
        node_map[v].tx = pos.tx;
        node_map[v].ty = pos.ty;
        node_map[v].height = pos.height;
        node_map[v].bf = pos.bf;
    }

    // remove nodes
    for (const val of Object.keys(node_map)) {
        if (!position[val]) delete node_map[val];
    }
 
    if (anim_frame) cancelAnimationFrame(anim_frame);
    anim_frame = requestAnimationFrame(() => animate_step(position, W, H));
}
 
function animate_step(position, W, H) {
    ctx.clearRect(0, 0, W, H);
 
    let moving = false;
    for (const [val, nd] of Object.entries(node_map)) {
        nd.x = lerp(nd.x, nd.tx, 0.16);
        nd.y = lerp(nd.y, nd.ty, 0.16);
        nd.alpha = lerp(nd.alpha, 1, 0.14);
        nd.scale = lerp(nd.scale, 1, 0.14);
        if (Math.abs(nd.x - nd.tx) > 0.5 || Math.abs(nd.y - nd.ty) > 0.5 || nd.alpha < 0.98) moving = true;
    }
    draw_edges(tree_data);

    // draw nodes
    for (const [val, nd] of Object.entries(node_map)) {
        draw_node(parseInt(val), nd);
    }
 
    if (moving) anim_frame = requestAnimationFrame(() => animate_step(position, W, H));
}
 
function draw_edges(n) {
    if (!n) return;
    ['left', 'right'].forEach(side => {
        const child = n[side];
        if (!child) return;
        const p = node_map[n.Value];
        const c = node_map[child.Value];
        if (!p || !c) return;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(c.x, c.y);
        ctx.strokeStyle = '#2a2d3a';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 1;
        ctx.stroke();
        draw_edges(child);
    });
}
 
function draw_node(val, nd) {
    ctx.save();
    ctx.translate(nd.x, nd.y);
    ctx.scale(nd.scale, nd.scale);
    ctx.globalAlpha = nd.alpha;
 
    const hcol = high_lighted[val];
    const color = hcol || '#7c6ff7';
    const fill_map = {
        '#7c6ff7': '#1a1830',
        '#2ec4a9': '#0d2420',
        '#e24b4a': '#2a1010',
        '#f5a623': '#2a1e08',
    };
 
    const fill = fill_map[color] || '#1a1830';
    const bf = nd.bf !== undefined ? nd.bf : 0;
    const bf_color = Math.abs(bf) > 1 ? '#e24b4a' : bf !== 0 ? '#f5a623' : '#6b6d80';

    // circle
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    //value
    ctx.fillStyle = color;
    ctx.font = `600 13px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val, 0, 0);
    // BF
    ctx.font = `400 9px 'JetBrains Mono', monospace`;
    ctx.fillStyle = bf_color;
    ctx.textAlign = 'left';
    ctx.fillText(`bf:${bf}`, r + 3, -r + 4);
    // Height
    ctx.fillStyle = '#6b6d80';
    ctx.textAlign = 'right';
    ctx.fillText(`h:${nd.height || 1}`, -r - 3, -r + 4);
 
    ctx.restore();
}
 // log
function set_log(msg, type = 'entry') {
    const el = document.getElementById('log');
    el.innerHTML = `<span class="${type}">${msg}</span>`;
}
 
function log_api(method, url, status, ms) {
    const el = document.getElementById('api-trace');
    const ok = status >= 200 && status < 300;
    const line = `<span class="method">${method}</span> ${url} <span class="${ok ? 'status-ok' : 'status-err'}">${status}</span> ${ms}ms\n`;
    el.innerHTML = line + el.innerHTML.slice(0, 600);
}
 
function update_state_rot(rot) {
    document.getElementById('stat-r').textContent = rot || '-';
}
 
