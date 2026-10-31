"""Bundle every variant into dist/index.html with a tab switcher.
Edit VARIANTS to add, remove, or reorder tabs. Run: python3 build.py"""
import base64, json, pathlib
ROOT = pathlib.Path(__file__).parent
VARIANTS = [  # (key, tab name, one-line description, file)
    ("b", "Team + brain", "Fleet, brain map, dials, traces", "warden-team.html"),
    ("c", "Decision classes", "Delegate, spot-check, correct", "warden-v2.html"),
    ("d", "Wikimind", "Pages with trust and actions", "wikimind.html"),
    ("e", "Wikimind 2", "Ask, zoom map, claims", "wikimind2.html"),
    ("f", "Wikimind 3", "Cited, always learning", "wikimind3.html"),
]
DEFAULT = "f"
shell = (ROOT / "shell.html").read_text()
tabs = "".join(f'<button role="tab" data-v="{k}" aria-selected="false"><b>{n}</b><span>{d}</span></button>' for k, n, d, _ in VARIANTS)
data = ",".join(f'{k}:"{base64.b64encode((ROOT/"variants"/f).read_bytes()).decode()}"' for k, _, _, f in VARIANTS)
out = (shell.replace("{{TABS}}", tabs).replace("{{DATA}}", data)
       .replace("{{ORDER}}", json.dumps([v[0] for v in VARIANTS]).replace('"', "'"))
       .replace("{{DEFAULT}}", f"'{DEFAULT}'"))
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist" / "index.html").write_text(out)
print("Built dist/index.html with", len(VARIANTS), "variants")
