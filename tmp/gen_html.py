import json, html as h
from collections import defaultdict

# Parse augmented data
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
for d in data:
    by_customer[d['customer']].append(d)
sorted_customers = sorted(by_customer.items(), key=lambda x: (-len(x[1]), x[0]))

def badge(status):
    if status == 'Yes': return '<span class="badge badge-info">Yes</span>'
    if status == 'Maybe': return '<span class="badge badge-medium">Maybe</span>'
    if status == 'No': return '<span class="badge badge-high">No</span>'
    return '<span class="badge badge-closed">\u2014</span>'

def esc(s): return h.escape(str(s)) if s else ''

def cust_id(c): return c.replace(' ','_').replace('.','').replace(',','').replace('&','and').replace("'","")

# Build sidebar nav
sidebar_items = []
for cust, items in sorted_customers:
    cid = cust_id(cust)
    sidebar_items.append(f'<a class="nav-link" onclick="showSection(\'{cid}\')">\U0001f3e2 {esc(cust)} ({len(items)})</a>')
sidebar_html = '\n'.join(sidebar_items)

# Build customer sections
sections = []
for cust, items in sorted_customers:
    cid = cust_id(cust)
    c_yes = sum(1 for i in items if i['solution_available']=='Yes')
    c_maybe = sum(1 for i in items if i['solution_available']=='Maybe')
    c_no = sum(1 for i in items if i['solution_available']=='No')
    c_unk = len(items) - c_yes - c_maybe - c_no
    
    sec = f'<div id="section-{cid}" class="customer-section" style="display:none;">'
    sec += f'<h2 id="cust-{cid}">{esc(cust)}</h2>'
    sec += '<div class="stat-grid">'
    sec += f'<div class="stat-card"><div class="stat-number">{len(items)}</div><div class="stat-label">Total Agents</div></div>'
    sec += f'<div class="stat-card"><div class="stat-number" style="color:var(--success-text)">{c_yes}</div><div class="stat-label">Solution Ready</div></div>'
    sec += f'<div class="stat-card"><div class="stat-number" style="color:var(--warning-text)">{c_maybe}</div><div class="stat-label">Maybe</div></div>'
    sec += f'<div class="stat-card"><div class="stat-number" style="color:var(--danger-text)">{c_no + c_unk}</div><div class="stat-label">Not Available</div></div>'
    sec += '</div>'
    
    for item in items:
        sec += '<details><summary>'
        sec += f'{badge(item["solution_available"])} {esc(item["engagement"])}'
        sec += '</summary><div style="padding:16px 20px;">'
        sec += '<div class="identity-card" style="margin-bottom:0;">'
        sec += f'<div class="identity-row"><div class="identity-label">BPM</div><div class="identity-value plain">{esc(item["bpm"])}</div></div>'
        sec += f'<div class="identity-row"><div class="identity-label">Contact</div><div class="identity-value">{esc(item["bpm_emails"])}</div></div>'
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

# Build table rows
rows = []
for d in data:
    rows.append(
        f'<tr data-customer="{esc(d["customer"])}" data-bpm="{esc(d["bpm"])}" data-status="{d["solution_available"]}" data-uploaded="{d["uploaded"]}">'
        f'<td>{d["id"]}</td>'
        f'<td>{esc(d["bpm"])}</td>'
        f'<td><strong>{esc(d["customer"])}</strong></td>'
        f'<td>{esc(d["engagement"])}</td>'
        f'<td style="text-align:center">{badge(d["solution_available"])}</td>'
        f'<td style="text-align:center">{badge(d["uploaded"])}</td>'
        f'<td class="comment-cell">{esc(d["comments"])}</td>'
        f'</tr>'
    )
table_rows = '\n'.join(rows)

cust_options = ''.join(f'<option value="{esc(c)}">{esc(c)}</option>' for c in customers)

# Top customers table
top_rows = []
for cust, items in sorted_customers[:15]:
    c_yes = sum(1 for i in items if i['solution_available']=='Yes')
    c_maybe = sum(1 for i in items if i['solution_available']=='Maybe')
    c_no = sum(1 for i in items if i['solution_available']=='No')
    c_up = sum(1 for i in items if i['uploaded']=='Yes')
    top_rows.append(
        f'<tr><td><strong>{esc(cust)}</strong></td><td>{len(items)}</td>'
        f'<td>{badge("Yes") + " " + str(c_yes) if c_yes else "0"}</td>'
        f'<td>{badge("Maybe") + " " + str(c_maybe) if c_maybe else "0"}</td>'
        f'<td>{c_no}</td><td>{c_up}</td></tr>'
    )
top_table = '\n'.join(top_rows)

# Donut chart values
circ = 251.2
y_arc = yes_sol/total*circ
m_arc = maybe_sol/total*circ
n_arc = no_sol/total*circ

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FDE Solution Library Tracker</title>
<style>
:root {{
    --bg-primary: #0d1117; --bg-secondary: #161b22; --bg-tertiary: #1c2128;
    --bg-hover: #21262d; --border-primary: #30363d; --border-accent: #58a6ff;
    --text-primary: #c9d1d9; --text-secondary: #8b949e; --text-link: #58a6ff;
    --text-link-hover: #79c0ff; --accent-primary: #58a6ff; --accent-secondary: #1f6feb;
    --code-bg: #161b22; --code-text: #79c0ff;
    --warning-bg: rgba(187,128,9,0.15); --warning-border: #bb8009; --warning-text: #e3b341;
    --info-bg: rgba(56,139,253,0.15); --info-border: #388bfd; --info-text: #58a6ff;
    --success-bg: rgba(46,160,67,0.15); --success-border: #2ea043; --success-text: #3fb950;
    --danger-bg: rgba(248,81,73,0.15); --danger-border: #f85149; --danger-text: #f85149;
    --purple-bg: rgba(163,113,247,0.15); --purple-border: #a371f7; --purple-text: #a371f7;
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html {{ scroll-behavior:smooth; }}
body {{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif; line-height:1.6; color:var(--text-primary); background:var(--bg-primary); overflow-x:hidden; }}
.wiki-wrapper {{ display:flex; min-height:100vh; }}
.sidebar {{ position:fixed; left:0; top:0; width:280px; height:100vh; background:var(--bg-secondary); border-right:1px solid var(--border-primary); overflow-y:auto; z-index:100; }}
.sidebar::-webkit-scrollbar {{ width:8px; }}
.sidebar::-webkit-scrollbar-track {{ background:var(--bg-secondary); }}
.sidebar::-webkit-scrollbar-thumb {{ background:var(--border-primary); border-radius:4px; }}
.sidebar-header {{ padding:24px 20px; border-bottom:1px solid var(--border-primary); background:var(--bg-tertiary); }}
.sidebar-title {{ font-size:1.1em; font-weight:600; color:var(--text-primary); letter-spacing:0.5px; text-transform:uppercase; }}
.sidebar-subtitle {{ font-size:0.8em; color:var(--text-secondary); margin-top:4px; font-family:"Cascadia Code","Fira Code",monospace; }}
.nav-menu {{ padding:16px 0; }}
.nav-section-label {{ padding:12px 20px 4px; font-size:0.7em; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px; }}
.nav-link {{ display:block; padding:8px 20px; color:var(--text-secondary); text-decoration:none; transition:all 0.2s ease; border-left:3px solid transparent; font-size:0.85em; cursor:pointer; }}
.nav-link:hover {{ background:var(--bg-hover); color:var(--text-primary); border-left-color:var(--accent-primary); }}
.nav-link.active {{ background:var(--bg-hover); color:var(--accent-primary); border-left-color:var(--accent-primary); font-weight:500; }}
.main-content {{ margin-left:280px; flex:1; padding:40px 60px 80px; max-width:1400px; }}
header {{ margin-bottom:48px; padding-bottom:32px; border-bottom:1px solid var(--border-primary); }}
h1 {{ font-size:2.2em; font-weight:700; color:var(--text-primary); margin-bottom:12px; }}
.subtitle {{ font-size:1.05em; color:var(--text-secondary); line-height:1.5; }}
h2 {{ font-size:1.8em; font-weight:600; color:var(--text-primary); margin-top:48px; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--border-primary); scroll-margin-top:20px; }}
h2::before {{ content:"//"; color:var(--accent-primary); margin-right:12px; font-weight:400; }}
h3 {{ font-size:1.35em; font-weight:600; color:var(--text-primary); margin-top:32px; margin-bottom:16px; }}
.stat-grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; margin-bottom:24px; }}
.stat-card {{ background:var(--bg-secondary); border:1px solid var(--border-primary); border-radius:8px; padding:20px; text-align:center; transition:border-color 0.2s; cursor:pointer; }}
.stat-card:hover {{ border-color:var(--accent-primary); }}
.stat-number {{ font-size:2.2em; font-weight:700; color:var(--accent-primary); }}
.stat-label {{ font-size:0.85em; color:var(--text-secondary); margin-top:4px; }}
.badge {{ display:inline-block; padding:2px 10px; border-radius:12px; font-size:0.75em; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; vertical-align:middle; }}
.badge-high {{ background:var(--danger-bg); color:var(--danger-text); border:1px solid var(--danger-border); }}
.badge-medium {{ background:var(--warning-bg); color:var(--warning-text); border:1px solid var(--warning-border); }}
.badge-info {{ background:var(--success-bg); color:var(--success-text); border:1px solid var(--success-border); }}
.badge-closed {{ background:var(--bg-tertiary); color:var(--text-secondary); border:1px solid var(--border-primary); }}
table {{ width:100%; border-collapse:collapse; margin-bottom:24px; font-size:0.88em; }}
th {{ background:var(--bg-tertiary); color:var(--text-primary); font-weight:600; text-align:left; padding:10px 14px; border:1px solid var(--border-primary); cursor:pointer; user-select:none; position:sticky; top:0; z-index:10; }}
th:hover {{ background:var(--bg-hover); }}
td {{ padding:8px 14px; border:1px solid var(--border-primary); color:var(--text-primary); vertical-align:top; }}
tr:nth-child(even) {{ background:var(--bg-secondary); }}
tr:hover {{ background:var(--bg-hover); }}
.comment-cell {{ max-width:280px; font-size:0.85em; color:var(--text-secondary); }}
.filter-bar {{ display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }}
.filter-bar select, .filter-bar input {{ background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border-primary); border-radius:6px; padding:8px 12px; font-size:0.9em; }}
.filter-bar select:focus, .filter-bar input:focus {{ outline:none; border-color:var(--accent-primary); }}
.filter-bar label {{ color:var(--text-secondary); font-size:0.85em; font-weight:500; }}
.identity-card {{ background:var(--bg-secondary); border:1px solid var(--border-primary); border-radius:8px; padding:24px; margin-bottom:24px; }}
.identity-row {{ display:flex; padding:8px 0; border-bottom:1px solid var(--border-primary); }}
.identity-row:last-child {{ border-bottom:none; }}
.identity-label {{ width:180px; flex-shrink:0; color:var(--text-secondary); font-weight:500; font-size:0.9em; }}
.identity-value {{ color:var(--text-primary); font-family:"Cascadia Code","Fira Code",monospace; font-size:0.88em; word-break:break-all; }}
.identity-value.plain {{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; font-size:0.95em; }}
details {{ background:var(--bg-secondary); border:1px solid var(--border-primary); border-radius:8px; margin-bottom:12px; }}
summary {{ padding:14px 20px; cursor:pointer; font-weight:500; color:var(--text-primary); user-select:none; font-size:0.95em; }}
summary:hover {{ background:var(--bg-hover); border-radius:8px; }}
details[open] summary {{ border-bottom:1px solid var(--border-primary); border-radius:8px 8px 0 0; }}
.customer-section {{ animation:fadeIn 0.3s ease; }}
@keyframes fadeIn {{ from {{ opacity:0; transform:translateY(8px); }} to {{ opacity:1; transform:translateY(0); }} }}
.donut-container {{ display:flex; gap:32px; align-items:center; justify-content:center; margin:24px 0; flex-wrap:wrap; }}
.donut {{ position:relative; width:200px; height:200px; }}
.donut svg {{ transform:rotate(-90deg); }}
.donut-center {{ position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }}
.donut-center .num {{ font-size:2em; font-weight:700; color:var(--text-primary); }}
.donut-center .lbl {{ font-size:0.8em; color:var(--text-secondary); }}
.legend {{ display:flex; flex-direction:column; gap:8px; }}
.legend-item {{ display:flex; align-items:center; gap:8px; font-size:0.9em; color:var(--text-primary); }}
.legend-dot {{ width:12px; height:12px; border-radius:50%; flex-shrink:0; }}
.progress-bar {{ width:100%; height:8px; background:var(--bg-tertiary); border-radius:4px; overflow:hidden; margin-top:8px; }}
.progress-fill {{ height:100%; border-radius:4px; transition:width 0.5s ease; }}
.mobile-toggle {{ display:none; position:fixed; top:16px; left:16px; z-index:200; background:var(--bg-secondary); border:1px solid var(--border-primary); border-radius:6px; padding:8px 12px; color:var(--text-primary); cursor:pointer; font-size:1.2em; }}
@media (max-width:1024px) {{ .sidebar {{ transform:translateX(-100%); transition:transform 0.3s ease; }} .sidebar.open {{ transform:translateX(0); }} .main-content {{ margin-left:0; padding:24px 20px 60px; }} .mobile-toggle {{ display:block; }} }}
footer {{ margin-top:60px; padding-top:24px; border-top:1px solid var(--border-primary); color:var(--text-secondary); font-size:0.85em; }}
</style>
</head>
<body>
<button class="mobile-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">&#9776;</button>
<div class="wiki-wrapper">
<aside class="sidebar" id="sidebar">
<div class="sidebar-header">
<div class="sidebar-title">Solution Library</div>
<div class="sidebar-subtitle">FDE Agent Tracker</div>
</div>
<nav class="nav-menu">
<div class="nav-section-label">Views</div>
<a class="nav-link active" onclick="showMainView('dashboard')">&#x1f4ca; Dashboard</a>
<a class="nav-link" onclick="showMainView('table')">&#x1f4cb; Full Table</a>
<div class="nav-section-label">Customers ({len(customers)})</div>
{sidebar_html}
</nav>
</aside>
<div class="main-content">
<header>
<h1>FDE Solution Library Tracker</h1>
<div class="subtitle">Comprehensive tracking of {total} agent solutions across {len(customers)} customers &middot; Generated from Loop workspace &middot; 2026-03-09</div>
</header>

<div id="view-dashboard" class="main-view">
<div class="stat-grid">
<div class="stat-card" onclick="filterByStatus('all')"><div class="stat-number">{total}</div><div class="stat-label">Total Solutions</div></div>
<div class="stat-card" onclick="filterByStatus('Yes')"><div class="stat-number" style="color:var(--success-text)">{yes_sol}</div><div class="stat-label">Solution Ready</div></div>
<div class="stat-card" onclick="filterByStatus('Maybe')"><div class="stat-number" style="color:var(--warning-text)">{maybe_sol}</div><div class="stat-label">Maybe Available</div></div>
<div class="stat-card" onclick="filterByStatus('No')"><div class="stat-number" style="color:var(--danger-text)">{no_sol}</div><div class="stat-label">Not Available</div></div>
<div class="stat-card" onclick="filterByStatus('unknown')"><div class="stat-number" style="color:var(--text-secondary)">{unknown}</div><div class="stat-label">Unknown / Pending</div></div>
<div class="stat-card"><div class="stat-number" style="color:var(--success-text)">{uploaded}</div><div class="stat-label">Uploaded to Library</div></div>
<div class="stat-card"><div class="stat-number">{len(customers)}</div><div class="stat-label">Unique Customers</div></div>
<div class="stat-card"><div class="stat-number">{has_vendor}</div><div class="stat-label">Vendor Assigned</div></div>
</div>

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
<div class="legend-item"><div class="legend-dot" style="background:var(--success-border)"></div>Solution Ready ({yes_sol}) &mdash; {yes_sol/total*100:.0f}%</div>
<div class="legend-item"><div class="legend-dot" style="background:var(--warning-border)"></div>Maybe ({maybe_sol}) &mdash; {maybe_sol/total*100:.0f}%</div>
<div class="legend-item"><div class="legend-dot" style="background:var(--danger-border)"></div>Not Available ({no_sol}) &mdash; {no_sol/total*100:.0f}%</div>
<div class="legend-item"><div class="legend-dot" style="background:var(--border-primary)"></div>Unknown ({unknown}) &mdash; {unknown/total*100:.0f}%</div>
</div>
</div>

<h3>Upload Progress</h3>
<div style="margin-bottom:24px;">
<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>Uploaded to Solution Library</span><span style="color:var(--success-text);font-weight:600">{uploaded} / {total} ({uploaded/total*100:.0f}%)</span></div>
<div class="progress-bar"><div class="progress-fill" style="width:{uploaded/total*100:.1f}%;background:var(--success-border)"></div></div>
</div>
<div style="margin-bottom:24px;">
<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>Solution File Available (Yes + Maybe)</span><span style="color:var(--warning-text);font-weight:600">{yes_sol+maybe_sol} / {total} ({(yes_sol+maybe_sol)/total*100:.0f}%)</span></div>
<div class="progress-bar"><div class="progress-fill" style="width:{(yes_sol+maybe_sol)/total*100:.1f}%;background:var(--warning-border)"></div></div>
</div>

<h3>Top Customers by Agent Count</h3>
<table>
<thead><tr><th>Customer</th><th>Agents</th><th>Ready</th><th>Maybe</th><th>Not Avail</th><th>Uploaded</th></tr></thead>
<tbody>
{top_table}
</tbody></table>
</div>

<div id="view-table" class="main-view" style="display:none;">
<h2>All Solutions</h2>
<div class="filter-bar">
<div><label>Search</label><br><input type="text" id="searchInput" placeholder="Search agents..." oninput="filterTable()" style="width:220px"></div>
<div><label>Customer</label><br><select id="filterCustomer" onchange="filterTable()"><option value="">All Customers</option>{cust_options}</select></div>
<div><label>Solution Status</label><br><select id="filterStatus" onchange="filterTable()"><option value="">All</option><option value="Yes">Yes</option><option value="Maybe">Maybe</option><option value="No">No</option><option value="unknown">Unknown</option></select></div>
<div><label>Uploaded</label><br><select id="filterUploaded" onchange="filterTable()"><option value="">All</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
<div style="margin-left:auto;align-self:flex-end"><button onclick="resetFilters()" style="background:var(--accent-secondary);color:white;border:none;border-radius:6px;padding:8px 16px;cursor:pointer">Reset</button></div>
</div>
<div style="overflow-x:auto;">
<table id="mainTable">
<thead><tr>
<th onclick="sortTable(0)"># &#x21C5;</th>
<th onclick="sortTable(1)">BPM &#x21C5;</th>
<th onclick="sortTable(2)">Customer &#x21C5;</th>
<th onclick="sortTable(3)">Engagement &#x21C5;</th>
<th onclick="sortTable(4)">Solution? &#x21C5;</th>
<th onclick="sortTable(5)">Uploaded? &#x21C5;</th>
<th>Comments</th>
</tr></thead>
<tbody>
{table_rows}
</tbody>
</table>
</div>
<div id="rowCount" style="color:var(--text-secondary);font-size:0.85em;margin-top:8px;">Showing {total} of {total} solutions</div>
</div>

<div id="view-customer" class="main-view" style="display:none;">
{sections_html}
</div>

<footer>
<p>FDE Solution Library Tracker &middot; Generated 2026-03-09 &middot; Data source: Loop Dogfood &middot; {total} solutions across {len(customers)} customers</p>
</footer>
</div>
</div>

<script>
let currentSort = {{col:-1, asc:true}};
function showMainView(view) {{
  document.querySelectorAll('.main-view').forEach(v => v.style.display = 'none');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (view === 'dashboard') {{
    document.getElementById('view-dashboard').style.display = 'block';
    document.querySelectorAll('.nav-link')[0].classList.add('active');
  }} else if (view === 'table') {{
    document.getElementById('view-table').style.display = 'block';
    document.querySelectorAll('.nav-link')[1].classList.add('active');
  }}
  document.querySelectorAll('.customer-section').forEach(s => s.style.display = 'none');
}}
function showSection(cid) {{
  document.querySelectorAll('.main-view').forEach(v => v.style.display = 'none');
  document.getElementById('view-customer').style.display = 'block';
  document.querySelectorAll('.customer-section').forEach(s => s.style.display = 'none');
  var sec = document.getElementById('section-' + cid);
  if (sec) sec.style.display = 'block';
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  var links = document.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {{
    if (links[i].getAttribute('onclick') && links[i].getAttribute('onclick').indexOf(cid) >= 0) links[i].classList.add('active');
  }}
}}
function filterTable() {{
  var search = document.getElementById('searchInput').value.toLowerCase();
  var cust = document.getElementById('filterCustomer').value;
  var status = document.getElementById('filterStatus').value;
  var uploaded = document.getElementById('filterUploaded').value;
  var shown = 0;
  document.querySelectorAll('#mainTable tbody tr').forEach(function(row) {{
    var text = row.textContent.toLowerCase();
    var rc = row.dataset.customer;
    var rs = row.dataset.status;
    var ru = row.dataset.uploaded;
    var matchSearch = !search || text.indexOf(search) >= 0;
    var matchCust = !cust || rc === cust;
    var matchStatus = !status || (status === 'unknown' ? rs === '' : rs === status);
    var matchUploaded = !uploaded || ru === uploaded;
    var show = matchSearch && matchCust && matchStatus && matchUploaded;
    row.style.display = show ? '' : 'none';
    if (show) shown++;
  }});
  document.getElementById('rowCount').textContent = 'Showing ' + shown + ' of {total} solutions';
}}
function filterByStatus(status) {{
  showMainView('table');
  if (status === 'all') document.getElementById('filterStatus').value = '';
  else document.getElementById('filterStatus').value = status;
  filterTable();
}}
function resetFilters() {{
  document.getElementById('searchInput').value = '';
  document.getElementById('filterCustomer').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterUploaded').value = '';
  filterTable();
}}
function sortTable(col) {{
  var table = document.getElementById('mainTable');
  var rows = Array.from(table.querySelectorAll('tbody tr'));
  var asc = currentSort.col === col ? !currentSort.asc : true;
  currentSort = {{col:col, asc:asc}};
  rows.sort(function(a, b) {{
    var va = a.cells[col].textContent.trim();
    var vb = b.cells[col].textContent.trim();
    if (col === 0) return asc ? (+va) - (+vb) : (+vb) - (+va);
    return asc ? va.localeCompare(vb) : vb.localeCompare(va);
  }});
  var tbody = table.querySelector('tbody');
  rows.forEach(function(r) {{ tbody.appendChild(r); }});
}}
</script>
</body>
</html>'''

out_path = r'C:\Users\dayour\OneDrive - Microsoft\0core0\FDE-Solution-Library-Tracker.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(page)
print(f'Written {len(page):,} bytes to {out_path}')
