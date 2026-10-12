"""Build the Chrome Web Store upload zip:  python chrome-extension/package_store.py

The repo manifest stays dev-friendly (localhost hosts for local testing). The
store copy drops what reviewers reject or question:
  - localhost / 127.0.0.1 host permissions (dev only),
  - the wildcard *.railway.app hosts, narrowed to Kyriq's own backend,
  - permissions no code uses (identity, notifications),
and leaves out docs, the parity check script and the unused popup/.
Output: dist/kyriq-extension-<version>.zip at the repo root.
"""
import json
import zipfile
from pathlib import Path

SRC = Path(__file__).resolve().parent
OUT = SRC.parent / 'dist'
SHIP = ['background', 'content', 'icons', 'options', 'sidepanel', 'styles']
BACKEND = 'https://check-extractor-production-2026.up.railway.app/*'
DEV_HOSTS = ('http://localhost', 'http://127.0.0.1')
UNUSED_PERMISSIONS = {'identity', 'notifications'}

manifest = json.loads((SRC / 'manifest.json').read_text(encoding='utf-8'))
hosts = [h for h in manifest['host_permissions'] if not h.startswith(DEV_HOSTS) and 'railway.app' not in h]
manifest['host_permissions'] = hosts + [BACKEND]
manifest['permissions'] = [p for p in manifest['permissions'] if p not in UNUSED_PERMISSIONS]

OUT.mkdir(exist_ok=True)
zip_path = OUT / f"kyriq-extension-{manifest['version']}.zip"
files = 0
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifest, indent=2))
    for folder in SHIP:
        for f in sorted((SRC / folder).rglob('*')):
            if f.is_file() and f.suffix.lower() not in ('.md', '.mjs') and not f.name.startswith('.'):
                z.write(f, f.relative_to(SRC).as_posix())
                files += 1

print(f'wrote {zip_path} ({files + 1} files, {zip_path.stat().st_size // 1024} KB)')
print('host_permissions:', ', '.join(manifest['host_permissions']))
print('permissions:', ', '.join(manifest['permissions']))
