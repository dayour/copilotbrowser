import json, html as h
from collections import defaultdict

raw = open(r'E:\copilotbrowser\tmp\solutions-augmented.txt','r',encoding='utf-8').read()
start = raw.index('[')
end = raw.rindex(']') + 1
data = json.loads(raw[start:end])

total = len(data)
yes_sol = sum(1 for d in data if d['solution_available']=='Yes')
maybe_sol = sum(1 for d in data if d['solution_available']=='Maybe')
no_sol = sum(1 for d in data if d['solution_available']=='No')
unknown = total - yes_sol - maybe_sol - no_sol
uploaded = sum(1 for d in data if d['uploaded']=='Yes')
customers = sorted(set(d['customer'] for d in data))
has_vendor = sum(1 for d in data if d['vendor'])

by_customer = defaultdict(list)
by_category = defaultdict(list)
by_status = defaultdict(list)
by_bpm = defaultdict(list)
for d in data:
    by_customer[d['customer']].append(d)
    if d['category']: by_category[d['category']].append(d)
    status_key = d['solution_available'] if d['solution_available'] in ('Yes','Maybe','No') else 'Pending'
    by_status[status_key].append(d)
    by_bpm[d['bpm']].append(d)

sorted_customers = sorted(by_customer.items(), key=lambda x: (-len(x[1]), x[0]))
sorted_categories = sorted(by_category.items(), key=lambda x: (-len(x[1]), x[0]))
sorted_bpms = sorted(by_bpm.items(), key=lambda x: (-len(x[1]), x[0]))

def badge(status):
    if status == 'Yes': return '<span class="badge badge-info">Yes</span>'
    if status == 'Maybe': return '<span class="badge badge-medium">Maybe</span>'
    if status == 'No': return '<span class="badge badge-high">No</span>'
    return '<span class="badge badge-closed">--</span>'

def type_badge(t):
    if not t: return ''
    cls = 'badge-purple' if 'Pro' in t else 'badge-low' if 'SDK' in t or 'Multi' in t or 'RPA' in t else 'badge-closed'
    return f'<span class="badge {cls}">{esc(t)}</span>'

def esc(s): return h.escape(str(s)) if s else ''
def cid(c): return c.replace(' ','_').replace('.','').replace(',','').replace('&','and').replace("'","").replace('(','').replace(')','')

# ── Sidebar ──
sidebar_nav = []
# By Status
sidebar_nav.append('<div class="nav-section-label">By Status</div>')
for sk, label, cnt in [('Yes','Ready',yes_sol),('Maybe','In Progress',maybe_sol),('No','Not Available',no_sol),('Pending','Pending',unknown)]:
    sidebar_nav.append(f'<a class="nav-link" onclick="filterByStatus(\'{sk}\')">{label} ({cnt})</a>')

# By Category (top 10)
sidebar_nav.append('<div class="nav-section-label">By Category</div>')
for cat, items in sorted_categories[:10]:
    sidebar_nav.append(f'<a class="nav-link" onclick="filterByCategory(\'{esc(cat)}\')">{esc(cat)} ({len(items)})</a>')

# By BPM (top 8)
sidebar_nav.append('<div class="nav-section-label">By BPM Owner</div>')
for bpm_name, items in sorted_bpms[:8]:
    sidebar_nav.append(f'<a class="nav-link" onclick="filterByBPM(\'{esc(bpm_name)}\')">{esc(bpm_name.split(",")[0].strip())} ({len(items)})</a>')

# Top Customers (3+ agents)
sidebar_nav.append('<div class="nav-section-label">Top Customers</div>')
for cust, items in sorted_customers:
    if len(items) >= 3:
        sidebar_nav.append(f'<a class="nav-link" onclick="showSection(\'{cid(cust)}\')">{esc(cust)} ({len(items)})</a>')

sidebar_html = '\n'.join(sidebar_nav)

# ── Customer detail sections ──
sections = []
for cust, items in sorted_customers:
    c = cid(cust)
    c_yes = sum(1 for i in items if i['solution_available']=='Yes')
    c_maybe = sum(1 for i in items if i['solution_available']=='Maybe')
    c_no = sum(1 for i in items if i['solution_available']=='No')
    c_unk = len(items) - c_yes - c_maybe - c_no
    
    sec = f'<div id="section-{c}" class="customer-section" style="display:none;">'
    sec += f'<h2 id="cust-{c}">{esc(cust)}</h2>'
    sec += '<div class="stat-grid">'
    sec += f'<div class="stat-card"><div class="stat-number">{len(items)}</div><div class="stat-label">Total Agents</div></div>'
    sec += f'<div class="stat-card"><div class="stat-number" style="color:var(--success-text)">{c_yes}</div><div class="stat-label">Ready</div></div>'
    sec += f'<div class="stat-card"><div class="stat-number" style="color:var(--warning-text)">{c_maybe}</div><div class="stat-label">Maybe</div></div>'
    sec += f'<div class="stat-card"><div class="stat-number" style="color:var(--danger-text)">{c_no + c_unk}</div><div class="stat-label">Not Available</div></div>'
    sec += '</div>'
    
    for item in items:
        sec += '<details><summary>'
        sec += f'{badge(item["solution_available"])} &nbsp;{esc(item["engagement"])}'
        if item['agent_type']:
            sec += f' &nbsp;{type_badge(item["agent_type"])}'
        sec += '</summary><div style="padding:16px 20px;">'
        if item['description']:
            sec += f'<p style="margin-bottom:16px;color:var(--text-primary);line-height:1.7;">{esc(item["description"])}</p>'
        sec += '<div class="identity-card" style="margin-bottom:0;">'
        sec += f'<div class="identity-row"><div class="identity-label">BPM</div><div class="identity-value plain">{esc(item["bpm"])}</div></div>'
        sec += f'<div class="identity-row"><div class="identity-label">Contact</div><div class="identity-value">{esc(item["bpm_emails"])}</div></div>'
        if item['category']:
            sec += f'<div class="identity-row"><div class="identity-label">Category</div><div class="identity-value plain">{esc(item["category"])}</div></div>'
        if item['agent_type']:
            sec += f'<div class="identity-row"><div class="identity-label">Agent Type</div><div class="identity-value plain">{type_badge(item["agent_type"])}</div></div>'
        sec += f'<div class="identity-row"><div class="identity-label">Solution Available</div><div class="identity-value plain">{badge(item["solution_available"])}</div></div>'
        sec += f'<div class="identity-row"><div class="identity-label">Uploaded to Library</div><div class="identity-value plain">{badge(item["uploaded"])}</div></div>'
        if item['comments']:
            sec += f'<div class="identity-row"><div class="identity-label">Comments</div><div class="identity-value plain">{esc(item["comments"])}</div></div>'
        if item['vendor']:
            sec += f'<div class="identity-row"><div class="identity-label">Vendor</div><div class="identity-value plain">{esc(item["vendor"])}</div></div>'
        if item['vendor_instructions']:
            sec += f'<div class="identity-row"><div class="identity-label">Instructions</div><div class="identity-value plain">{esc(item["vendor_instructions"])}</div></div>'
        sec += '</div></div></details>'
    sec += '</div>'
    sections.append(sec)

sections_html = '\n'.join(sections)

# ── Table rows ──
rows = []
for d in data:
    rows.append(
        f'<tr data-customer="{esc(d["customer"])}" data-bpm="{esc(d["bpm"])}" '
        f'data-status="{d["solution_available"]}" data-uploaded="{d["uploaded"]}" '
        f'data-category="{esc(d["category"])}" data-type="{esc(d["agent_type"])}">'
        f'<td>{d["id"]}</td>'
        f'<td>{esc(d["bpm"])}</td>'
        f'<td><strong>{esc(d["customer"])}</strong></td>'
        f'<td>{esc(d["engagement"])}</td>'
        f'<td style="text-align:center">{type_badge(d["agent_type"])}</td>'
        f'<td style="text-align:center">{badge(d["solution_available"])}</td>'
        f'<td style="text-align:center">{badge(d["uploaded"])}</td>'
        f'<td class="comment-cell" title="{esc(d["description"])}">{esc(d["category"])}</td>'
        f'</tr>'
    )
table_rows = '\n'.join(rows)

cust_options = ''.join(f'<option value="{esc(c)}">{esc(c)}</option>' for c in customers)
cat_options = ''.join(f'<option value="{esc(c)}">{esc(c)}</option>' for c,_ in sorted_categories)

# ── Top customers ──
top_rows = []
for cust, items in sorted_customers[:15]:
    c_yes = sum(1 for i in items if i['solution_available']=='Yes')
    c_maybe = sum(1 for i in items if i['solution_available']=='Maybe')
    c_no = sum(1 for i in items if i['solution_available']=='No')
    c_up = sum(1 for i in items if i['uploaded']=='Yes')
    cats = ', '.join(sorted(set(i['category'] for i in items if i['category'])))[:40]
    top_rows.append(
        f'<tr onclick="showSection(\'{cid(cust)}\')" style="cursor:pointer">'
        f'<td><strong>{esc(cust)}</strong></td><td>{len(items)}</td>'
        f'<td>{c_yes}</td><td>{c_maybe}</td><td>{c_no}</td><td>{c_up}</td>'
        f'<td class="comment-cell">{esc(cats)}</td></tr>'
    )
top_table = '\n'.join(top_rows)

# ── Tile detail data (JSON for JS) ──
def tile_item(d):
    return {"id": d["id"], "engagement": d["engagement"], "customer": d["customer"],
            "bpm": d["bpm"], "type": d["agent_type"], "category": d["category"],
            "status": d["solution_available"], "uploaded": d["uploaded"],
            "desc": d["description"], "comments": d["comments"],
            "vendor": d["vendor"]}

tile_data = {
    "all": [tile_item(d) for d in data],
    "ready": [tile_item(d) for d in data if d['solution_available']=='Yes'],
    "maybe": [tile_item(d) for d in data if d['solution_available']=='Maybe'],
    "no": [tile_item(d) for d in data if d['solution_available']=='No'],
    "pending": [tile_item(d) for d in data if d['solution_available'] not in ('Yes','Maybe','No')],
    "uploaded": [tile_item(d) for d in data if d['uploaded']=='Yes'],
    "customers": [{"name": c, "count": len(items)} for c, items in sorted_customers],
    "vendor": [tile_item(d) for d in data if d['vendor']],
}
tile_json = json.dumps(tile_data, ensure_ascii=False)

# Donut
circ = 251.2
y_arc = yes_sol/total*circ
m_arc = maybe_sol/total*circ
n_arc = no_sol/total*circ

HTML = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FDE Solution Library Tracker</title>
<style>
:root {{
    --bg-primary:#0d1117;--bg-secondary:#161b22;--bg-tertiary:#1c2128;
    --bg-hover:#21262d;--border-primary:#30363d;--border-accent:#58a6ff;
    --text-primary:#c9d1d9;--text-secondary:#8b949e;--text-link:#58a6ff;
    --text-link-hover:#79c0ff;--accent-primary:#58a6ff;--accent-secondary:#1f6feb;
    --warning-bg:rgba(187,128,9,.15);--warning-border:#bb8009;--warning-text:#e3b341;
    --info-bg:rgba(56,139,253,.15);--info-border:#388bfd;--info-text:#58a6ff;
    --success-bg:rgba(46,160,67,.15);--success-border:#2ea043;--success-text:#3fb950;
    --danger-bg:rgba(248,81,73,.15);--danger-border:#f85149;--danger-text:#f85149;
    --purple-bg:rgba(163,113,247,.15);--purple-border:#a371f7;--purple-text:#a371f7;
}}
*{{margin:0;padding:0;box-sizing:border-box}}
html{{scroll-behavior:smooth}}
body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;line-height:1.6;color:var(--text-primary);background:var(--bg-primary);overflow-x:hidden}}
.wiki-wrapper{{display:flex;min-height:100vh}}
.sidebar{{position:fixed;left:0;top:0;width:260px;height:100vh;background:var(--bg-secondary);border-right:1px solid var(--border-primary);overflow-y:auto;z-index:100}}
.sidebar::-webkit-scrollbar{{width:6px}}
.sidebar::-webkit-scrollbar-track{{background:var(--bg-secondary)}}
.sidebar::-webkit-scrollbar-thumb{{background:var(--border-primary);border-radius:3px}}
.sidebar-header{{padding:20px 16px;border-bottom:1px solid var(--border-primary);background:var(--bg-tertiary)}}
.sidebar-title{{font-size:1em;font-weight:600;color:var(--text-primary);letter-spacing:.5px;text-transform:uppercase}}
.sidebar-subtitle{{font-size:.75em;color:var(--text-secondary);margin-top:4px;font-family:"Cascadia Code","Fira Code",monospace}}
.nav-menu{{padding:12px 0}}
.nav-section-label{{padding:14px 16px 4px;font-size:.65em;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1.2px}}
.nav-link{{display:block;padding:6px 16px;color:var(--text-secondary);text-decoration:none;transition:all .15s;border-left:3px solid transparent;font-size:.8em;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.nav-link:hover{{background:var(--bg-hover);color:var(--text-primary);border-left-color:var(--accent-primary)}}
.nav-link.active{{background:var(--bg-hover);color:var(--accent-primary);border-left-color:var(--accent-primary);font-weight:500}}
.main-content{{margin-left:260px;flex:1;padding:32px 48px 60px;max-width:1400px}}
header{{margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid var(--border-primary)}}
h1{{font-size:2em;font-weight:700;color:var(--text-primary);margin-bottom:8px}}
.subtitle{{font-size:.95em;color:var(--text-secondary);line-height:1.5}}
h2{{font-size:1.6em;font-weight:600;color:var(--text-primary);margin-top:40px;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border-primary);scroll-margin-top:20px}}
h2::before{{content:"//";color:var(--accent-primary);margin-right:10px;font-weight:400}}
h3{{font-size:1.2em;font-weight:600;color:var(--text-primary);margin-top:28px;margin-bottom:12px}}
.stat-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px}}
.stat-card{{background:var(--bg-secondary);border:1px solid var(--border-primary);border-radius:8px;padding:16px;text-align:center;transition:border-color .2s;cursor:pointer}}
.stat-card:hover{{border-color:var(--accent-primary)}}
.stat-card.active{{border-color:var(--accent-primary);box-shadow:0 0 10px rgba(88,166,255,.15)}}
.stat-number{{font-size:2em;font-weight:700;color:var(--accent-primary)}}
.stat-label{{font-size:.8em;color:var(--text-secondary);margin-top:2px}}
.badge{{display:inline-block;padding:2px 8px;border-radius:10px;font-size:.7em;font-weight:600;text-transform:uppercase;letter-spacing:.4px;vertical-align:middle}}
.badge-high{{background:var(--danger-bg);color:var(--danger-text);border:1px solid var(--danger-border)}}
.badge-medium{{background:var(--warning-bg);color:var(--warning-text);border:1px solid var(--warning-border)}}
.badge-info{{background:var(--success-bg);color:var(--success-text);border:1px solid var(--success-border)}}
.badge-closed{{background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border-primary)}}
.badge-low{{background:var(--info-bg);color:var(--info-text);border:1px solid var(--info-border)}}
.badge-purple{{background:var(--purple-bg);color:var(--purple-text);border:1px solid var(--purple-border)}}
table{{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:.85em}}
th{{background:var(--bg-tertiary);color:var(--text-primary);font-weight:600;text-align:left;padding:8px 12px;border:1px solid var(--border-primary);cursor:pointer;user-select:none;position:sticky;top:0;z-index:10}}
th:hover{{background:var(--bg-hover)}}
td{{padding:7px 12px;border:1px solid var(--border-primary);color:var(--text-primary);vertical-align:top}}
tr:nth-child(even){{background:var(--bg-secondary)}}
tr:hover{{background:var(--bg-hover)}}
.comment-cell{{max-width:200px;font-size:.85em;color:var(--text-secondary)}}
.filter-bar{{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:flex-end}}
.filter-bar select,.filter-bar input{{background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-primary);border-radius:5px;padding:6px 10px;font-size:.85em}}
.filter-bar select:focus,.filter-bar input:focus{{outline:none;border-color:var(--accent-primary)}}
.filter-bar label{{color:var(--text-secondary);font-size:.75em;font-weight:600;display:block;margin-bottom:2px}}
.identity-card{{background:var(--bg-secondary);border:1px solid var(--border-primary);border-radius:8px;padding:20px;margin-bottom:20px}}
.identity-row{{display:flex;padding:7px 0;border-bottom:1px solid var(--border-primary)}}
.identity-row:last-child{{border-bottom:none}}
.identity-label{{width:160px;flex-shrink:0;color:var(--text-secondary);font-weight:500;font-size:.85em}}
.identity-value{{color:var(--text-primary);font-family:"Cascadia Code","Fira Code",monospace;font-size:.85em;word-break:break-all}}
.identity-value.plain{{font-family:inherit;font-size:.9em}}
details{{background:var(--bg-secondary);border:1px solid var(--border-primary);border-radius:8px;margin-bottom:10px}}
summary{{padding:12px 16px;cursor:pointer;font-weight:500;color:var(--text-primary);user-select:none;font-size:.9em}}
summary:hover{{background:var(--bg-hover);border-radius:8px}}
details[open] summary{{border-bottom:1px solid var(--border-primary);border-radius:8px 8px 0 0}}
.customer-section{{animation:fadeIn .25s ease}}
@keyframes fadeIn{{from{{opacity:0;transform:translateY(6px)}}to{{opacity:1;transform:translateY(0)}}}}
.donut-container{{display:flex;gap:28px;align-items:center;justify-content:center;margin:20px 0;flex-wrap:wrap}}
.donut{{position:relative;width:180px;height:180px}}
.donut svg{{transform:rotate(-90deg)}}
.donut-center{{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}}
.donut-center .num{{font-size:1.8em;font-weight:700;color:var(--text-primary)}}
.donut-center .lbl{{font-size:.75em;color:var(--text-secondary)}}
.legend{{display:flex;flex-direction:column;gap:6px}}
.legend-item{{display:flex;align-items:center;gap:6px;font-size:.85em;color:var(--text-primary)}}
.legend-dot{{width:10px;height:10px;border-radius:50%;flex-shrink:0}}
.progress-bar{{width:100%;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;margin-top:6px}}
.progress-fill{{height:100%;border-radius:3px;transition:width .5s ease}}
.active-filter{{background:var(--accent-secondary);color:white;border:none;border-radius:4px;padding:4px 10px;font-size:.75em;margin-right:6px;cursor:pointer;display:inline-flex;align-items:center;gap:4px}}
.active-filter:hover{{background:var(--danger-border)}}
#activeFilters{{margin-bottom:12px;min-height:24px}}
.mobile-toggle{{display:none;position:fixed;top:12px;left:12px;z-index:200;background:var(--bg-secondary);border:1px solid var(--border-primary);border-radius:6px;padding:6px 10px;color:var(--text-primary);cursor:pointer;font-size:1.1em}}
@media(max-width:1024px){{.sidebar{{transform:translateX(-100%);transition:transform .3s ease}}.sidebar.open{{transform:translateX(0)}}.main-content{{margin-left:0;padding:20px 16px 40px}}.mobile-toggle{{display:block}}}}
footer{{margin-top:48px;padding-top:20px;border-top:1px solid var(--border-primary);color:var(--text-secondary);font-size:.8em}}
</style>
</head>
<body>
<button class="mobile-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">Menu</button>
<div class="wiki-wrapper">
<aside class="sidebar" id="sidebar">
<div class="sidebar-header">
<div class="sidebar-title">Solution Library</div>
<div class="sidebar-subtitle">FDE Agent Tracker v2</div>
</div>
<nav class="nav-menu">
<div class="nav-section-label">Views</div>
<a class="nav-link active" onclick="showMainView('dashboard')">Dashboard</a>
<a class="nav-link" onclick="showMainView('table')">Full Table</a>
{sidebar_html}
</nav>
</aside>
<div class="main-content">
<header>
<h1>FDE Solution Library Tracker</h1>
<div class="subtitle">{total} agent solutions across {len(customers)} customers &middot; Generated from Loop workspace &middot; 2026-03-09</div>
</header>

<div id="view-dashboard" class="main-view">
<div class="stat-grid">
<div class="stat-card" onclick="toggleTile('all')"><div class="stat-number">{total}</div><div class="stat-label">Total Solutions</div></div>
<div class="stat-card" onclick="toggleTile('ready')"><div class="stat-number" style="color:var(--success-text)">{yes_sol}</div><div class="stat-label">Solution Ready</div></div>
<div class="stat-card" onclick="toggleTile('maybe')"><div class="stat-number" style="color:var(--warning-text)">{maybe_sol}</div><div class="stat-label">Maybe Available</div></div>
<div class="stat-card" onclick="toggleTile('no')"><div class="stat-number" style="color:var(--danger-text)">{no_sol}</div><div class="stat-label">Not Available</div></div>
<div class="stat-card" onclick="toggleTile('pending')"><div class="stat-number" style="color:var(--text-secondary)">{unknown}</div><div class="stat-label">Pending</div></div>
<div class="stat-card" onclick="toggleTile('uploaded')"><div class="stat-number" style="color:var(--success-text)">{uploaded}</div><div class="stat-label">Uploaded</div></div>
<div class="stat-card" onclick="toggleTile('customers')"><div class="stat-number">{len(customers)}</div><div class="stat-label">Customers</div></div>
<div class="stat-card" onclick="toggleTile('vendor')"><div class="stat-number">{has_vendor}</div><div class="stat-label">Vendor Assigned</div></div>
</div>
<div id="tile-detail" style="display:none;margin-bottom:24px;"></div>

<div class="donut-container">
<div class="donut">
<svg viewBox="0 0 100 100">
<circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-primary)" stroke-width="12"/>
<circle cx="50" cy="50" r="40" fill="none" stroke="var(--success-border)" stroke-width="12" stroke-dasharray="{y_arc:.1f} {circ-y_arc:.1f}" stroke-dashoffset="0"/>
<circle cx="50" cy="50" r="40" fill="none" stroke="var(--warning-border)" stroke-width="12" stroke-dasharray="{m_arc:.1f} {circ-m_arc:.1f}" stroke-dashoffset="{-y_arc:.1f}"/>
<circle cx="50" cy="50" r="40" fill="none" stroke="var(--danger-border)" stroke-width="12" stroke-dasharray="{n_arc:.1f} {circ-n_arc:.1f}" stroke-dashoffset="{-(y_arc+m_arc):.1f}"/>
</svg>
<div class="donut-center"><div class="num">{yes_sol+uploaded}</div><div class="lbl">Ready</div></div>
</div>
<div class="legend">
<div class="legend-item"><div class="legend-dot" style="background:var(--success-border)"></div>Ready ({yes_sol}) -- {yes_sol/total*100:.0f}%</div>
<div class="legend-item"><div class="legend-dot" style="background:var(--warning-border)"></div>Maybe ({maybe_sol}) -- {maybe_sol/total*100:.0f}%</div>
<div class="legend-item"><div class="legend-dot" style="background:var(--danger-border)"></div>Not Available ({no_sol}) -- {no_sol/total*100:.0f}%</div>
<div class="legend-item"><div class="legend-dot" style="background:var(--border-primary)"></div>Pending ({unknown}) -- {unknown/total*100:.0f}%</div>
</div>
</div>

<h3>Upload Progress</h3>
<div style="margin-bottom:20px;">
<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:.9em"><span>Uploaded to Solution Library</span><span style="color:var(--success-text);font-weight:600">{uploaded}/{total} ({uploaded/total*100:.0f}%)</span></div>
<div class="progress-bar"><div class="progress-fill" style="width:{uploaded/total*100:.1f}%;background:var(--success-border)"></div></div>
</div>
<div style="margin-bottom:20px;">
<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:.9em"><span>Solution File Available (Yes+Maybe)</span><span style="color:var(--warning-text);font-weight:600">{yes_sol+maybe_sol}/{total} ({(yes_sol+maybe_sol)/total*100:.0f}%)</span></div>
<div class="progress-bar"><div class="progress-fill" style="width:{(yes_sol+maybe_sol)/total*100:.1f}%;background:var(--warning-border)"></div></div>
</div>

<h3>Top Customers</h3>
<table>
<thead><tr><th>Customer</th><th>Agents</th><th>Ready</th><th>Maybe</th><th>No</th><th>Uploaded</th><th>Categories</th></tr></thead>
<tbody>
{top_table}
</tbody></table>
</div>

<div id="view-table" class="main-view" style="display:none;">
<h2>All Solutions</h2>
<div id="activeFilters"></div>
<div class="filter-bar">
<div><label>Search</label><input type="text" id="searchInput" placeholder="Search..." oninput="filterTable()" style="width:180px"></div>
<div><label>Customer</label><select id="filterCustomer" onchange="filterTable()"><option value="">All</option>{cust_options}</select></div>
<div><label>Category</label><select id="filterCategory" onchange="filterTable()"><option value="">All</option>{cat_options}</select></div>
<div><label>Status</label><select id="filterStatus" onchange="filterTable()"><option value="">All</option><option value="Yes">Ready</option><option value="Maybe">Maybe</option><option value="No">Not Available</option><option value="Pending">Pending</option></select></div>
<div><label>Uploaded</label><select id="filterUploaded" onchange="filterTable()"><option value="">All</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
<div style="margin-left:auto"><button onclick="resetFilters()" style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-primary);border-radius:5px;padding:6px 14px;cursor:pointer;font-size:.85em">Reset</button></div>
</div>
<div style="overflow-x:auto;">
<table id="mainTable">
<thead><tr>
<th onclick="sortTable(0)">#</th>
<th onclick="sortTable(1)">BPM</th>
<th onclick="sortTable(2)">Customer</th>
<th onclick="sortTable(3)">Engagement</th>
<th onclick="sortTable(4)">Type</th>
<th onclick="sortTable(5)">Status</th>
<th onclick="sortTable(6)">Uploaded</th>
<th onclick="sortTable(7)">Category</th>
</tr></thead>
<tbody>
{table_rows}
</tbody>
</table>
</div>
<div id="rowCount" style="color:var(--text-secondary);font-size:.8em;margin-top:6px;">Showing {total} of {total}</div>
</div>

<div id="view-customer" class="main-view" style="display:none;">
{sections_html}
</div>

<footer>
<p>FDE Solution Library Tracker &middot; 2026-03-09 &middot; {total} solutions, {len(customers)} customers &middot; Source: Loop Dogfood</p>
</footer>
</div>
</div>

<script>
var currentSort={{col:-1,asc:true}};
var tileData={tile_json};
var activeTile=null;
function badgeHtml(s){{if(s==='Yes')return'<span class="badge badge-info">Yes</span>';if(s==='Maybe')return'<span class="badge badge-medium">Maybe</span>';if(s==='No')return'<span class="badge badge-high">No</span>';return'<span class="badge badge-closed">--</span>';}}
function toggleTile(key){{
  var el=document.getElementById('tile-detail');
  if(activeTile===key){{el.style.display='none';activeTile=null;document.querySelectorAll('.stat-card').forEach(function(c){{c.classList.remove('active')}});return;}}
  activeTile=key;
  document.querySelectorAll('.stat-card').forEach(function(c){{c.classList.remove('active')}});
  var cards=document.querySelectorAll('.stat-card');
  var idx={{'all':0,'ready':1,'maybe':2,'no':3,'pending':4,'uploaded':5,'customers':6,'vendor':7}};
  if(idx[key]!==undefined&&cards[idx[key]])cards[idx[key]].classList.add('active');
  var items=tileData[key];
  if(!items||!items.length){{el.innerHTML='<div class="identity-card"><p style="color:var(--text-secondary)">No items</p></div>';el.style.display='block';return;}}
  var html='<h3 style="margin-top:12px">'+key.charAt(0).toUpperCase()+key.slice(1)+' ('+items.length+')</h3>';
  if(key==='customers'){{
    html+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">';
    items.forEach(function(c){{
      var cid=c.name.replace(/[ .,&\\'()]/g,'_');
      html+='<div class="stat-card" onclick="showSection(\\''+cid+'\\')" style="min-width:160px;padding:12px 16px"><div class="stat-number" style="font-size:1.4em">'+c.count+'</div><div class="stat-label" style="font-size:.75em">'+c.name+'</div></div>';
    }});
    html+='</div>';
  }}else{{
    items.forEach(function(d){{
      var cid=d.customer.replace(/[ .,&\\'()]/g,'_');
      html+='<details><summary>'+badgeHtml(d.status)+' &nbsp;<strong>'+d.customer+'</strong> &mdash; '+d.engagement+'</summary>';
      html+='<div style="padding:14px 16px">';
      if(d.desc)html+='<p style="margin-bottom:12px;color:var(--text-primary);line-height:1.6">'+d.desc+'</p>';
      html+='<div class="identity-card" style="margin-bottom:0">';
      html+='<div class="identity-row"><div class="identity-label">BPM</div><div class="identity-value plain">'+d.bpm+'</div></div>';
      if(d.category)html+='<div class="identity-row"><div class="identity-label">Category</div><div class="identity-value plain">'+d.category+'</div></div>';
      if(d.type)html+='<div class="identity-row"><div class="identity-label">Type</div><div class="identity-value plain">'+d.type+'</div></div>';
      html+='<div class="identity-row"><div class="identity-label">Solution</div><div class="identity-value plain">'+badgeHtml(d.status)+'</div></div>';
      html+='<div class="identity-row"><div class="identity-label">Uploaded</div><div class="identity-value plain">'+badgeHtml(d.uploaded)+'</div></div>';
      if(d.comments)html+='<div class="identity-row"><div class="identity-label">Comments</div><div class="identity-value plain">'+d.comments+'</div></div>';
      if(d.vendor)html+='<div class="identity-row"><div class="identity-label">Vendor</div><div class="identity-value plain">'+d.vendor+'</div></div>';
      html+='</div></div></details>';
    }});
  }}
  html+='<div style="margin-top:12px"><button onclick="filterByStatus(\\''+(key==='ready'?'Yes':key==='maybe'?'Maybe':key==='no'?'No':key==='pending'?'Pending':'all')+'\\')" style="background:var(--bg-tertiary);color:var(--accent-primary);border:1px solid var(--border-primary);border-radius:5px;padding:6px 14px;cursor:pointer;font-size:.85em">View in full table</button></div>';
  el.innerHTML=html;
  el.style.display='block';
  el.scrollIntoView({{behavior:'smooth',block:'nearest'}});
}}
function showMainView(v){{
  document.querySelectorAll('.main-view').forEach(function(el){{el.style.display='none'}});
  document.querySelectorAll('.nav-link').forEach(function(l){{l.classList.remove('active')}});
  if(v==='dashboard'){{document.getElementById('view-dashboard').style.display='block';document.querySelectorAll('.nav-link')[0].classList.add('active')}}
  else if(v==='table'){{document.getElementById('view-table').style.display='block';document.querySelectorAll('.nav-link')[1].classList.add('active')}}
  document.querySelectorAll('.customer-section').forEach(function(s){{s.style.display='none'}});
}}
function showSection(c){{
  document.querySelectorAll('.main-view').forEach(function(el){{el.style.display='none'}});
  document.getElementById('view-customer').style.display='block';
  document.querySelectorAll('.customer-section').forEach(function(s){{s.style.display='none'}});
  var sec=document.getElementById('section-'+c);
  if(sec)sec.style.display='block';
  document.querySelectorAll('.nav-link').forEach(function(l){{l.classList.remove('active')}});
  document.querySelectorAll('.nav-link').forEach(function(l){{
    var oc=l.getAttribute('onclick');
    if(oc&&oc.indexOf(c)>=0)l.classList.add('active');
  }});
}}
function filterTable(){{
  var s=document.getElementById('searchInput').value.toLowerCase();
  var fc=document.getElementById('filterCustomer').value;
  var fcat=document.getElementById('filterCategory').value;
  var fs=document.getElementById('filterStatus').value;
  var fu=document.getElementById('filterUploaded').value;
  var shown=0;
  document.querySelectorAll('#mainTable tbody tr').forEach(function(r){{
    var txt=r.textContent.toLowerCase();
    var rc=r.dataset.customer,rs=r.dataset.status,ru=r.dataset.uploaded,rcat=r.dataset.category;
    var isPending=rs==='';
    var matchS=!s||txt.indexOf(s)>=0;
    var matchC=!fc||rc===fc;
    var matchCat=!fcat||rcat===fcat;
    var matchSt=!fs||(fs==='Pending'?isPending:rs===fs);
    var matchU=!fu||ru===fu;
    var show=matchS&&matchC&&matchCat&&matchSt&&matchU;
    r.style.display=show?'':'none';
    if(show)shown++;
  }});
  document.getElementById('rowCount').textContent='Showing '+shown+' of {total}';
  updateActiveFilters();
}}
function updateActiveFilters(){{
  var chips=[];
  var fc=document.getElementById('filterCustomer').value;
  var fcat=document.getElementById('filterCategory').value;
  var fs=document.getElementById('filterStatus').value;
  var fu=document.getElementById('filterUploaded').value;
  var s=document.getElementById('searchInput').value;
  if(s)chips.push('<button class="active-filter" onclick="document.getElementById(\\'searchInput\\').value=\\'\\';filterTable()">Search: '+s+' x</button>');
  if(fc)chips.push('<button class="active-filter" onclick="document.getElementById(\\'filterCustomer\\').value=\\'\\';filterTable()">Customer: '+fc+' x</button>');
  if(fcat)chips.push('<button class="active-filter" onclick="document.getElementById(\\'filterCategory\\').value=\\'\\';filterTable()">Category: '+fcat+' x</button>');
  if(fs)chips.push('<button class="active-filter" onclick="document.getElementById(\\'filterStatus\\').value=\\'\\';filterTable()">Status: '+fs+' x</button>');
  if(fu)chips.push('<button class="active-filter" onclick="document.getElementById(\\'filterUploaded\\').value=\\'\\';filterTable()">Uploaded: '+fu+' x</button>');
  document.getElementById('activeFilters').innerHTML=chips.join('');
}}
function filterByStatus(s){{
  showMainView('table');
  document.getElementById('filterStatus').value=s==='all'?'':s;
  filterTable();
}}
function filterByCategory(c){{
  showMainView('table');
  document.getElementById('filterCategory').value=c;
  filterTable();
}}
function filterByBPM(b){{
  showMainView('table');
  resetFilters();
  document.getElementById('searchInput').value=b;
  filterTable();
}}
function resetFilters(){{
  document.getElementById('searchInput').value='';
  document.getElementById('filterCustomer').value='';
  document.getElementById('filterCategory').value='';
  document.getElementById('filterStatus').value='';
  document.getElementById('filterUploaded').value='';
  filterTable();
}}
function sortTable(col){{
  var table=document.getElementById('mainTable');
  var rows=Array.from(table.querySelectorAll('tbody tr'));
  var asc=currentSort.col===col?!currentSort.asc:true;
  currentSort={{col:col,asc:asc}};
  rows.sort(function(a,b){{
    var va=a.cells[col].textContent.trim(),vb=b.cells[col].textContent.trim();
    if(col===0)return asc?(+va)-(+vb):(+vb)-(+va);
    return asc?va.localeCompare(vb):vb.localeCompare(va);
  }});
  var tbody=table.querySelector('tbody');
  rows.forEach(function(r){{tbody.appendChild(r)}});
}}
</script>
</body>
</html>'''

out = r'C:\Users\dayour\OneDrive - Microsoft\0core0\FDE-Solution-Library-Tracker.html'
with open(out, 'w', encoding='utf-8') as f:
    f.write(HTML)
print(f'Written {len(HTML):,} bytes to {out}')
