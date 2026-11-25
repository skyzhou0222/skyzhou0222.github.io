"""Check the generated visitor-facing routes, assets, anchors and privacy boundary."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'dist').resolve()
required = ['index.html', 'work/index.html', 'work/wec-bot/index.html', 'work/wesion-ai/index.html',
            'about/index.html', 'archives/index.html', 'ce-shi/index.html',
            'b-duan-hou-tai-she-ji-gui-fan/index.html', '404.html']
errors = [f'Missing visitor route: {p}' for p in required if not (root / p).is_file()]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs = set(), []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        for k in ['href', 'src', 'poster']:
            if a.get(k): self.refs.append(a[k])
        if a.get('srcset'):
            self.refs.extend(x.strip().split(' ')[0] for x in a['srcset'].split(','))

pages = {}
for path in root.rglob('*.html'):
    body = path.read_text()
    page = Page(); page.feed(body); pages[path] = page
    for forbidden in ['localhost:', '127.0.0.1:', 'thread://', 'chatgpt-conversation://', '/Users/']:
        if forbidden in body: errors.append(f'{path.relative_to(root)} exposes {forbidden}')
    for pattern, label in [
        (r'(?<![A-Za-z0-9])1[3-9][0-9]{9}(?![A-Za-z0-9])', 'a personal mobile number'),
        (r'https?://[a-z0-9.-]+[.]sharepoint[.]com', 'an internal document URL'),
    ]:
        if re.search(pattern, body, re.IGNORECASE): errors.append(f'{path.relative_to(root)} exposes {label}')

refs = 0
for path, page in pages.items():
    for ref in page.refs:
        u = urlsplit(ref)
        if u.scheme or u.netloc: continue
        target = ((root / unquote(u.path).lstrip('/')) if u.path.startswith('/')
                  else (path.parent / unquote(u.path))) if u.path else path
        if target.is_dir(): target /= 'index.html'
        target = target.resolve()
        refs += 1
        if not target.is_file(): errors.append(f'{path.relative_to(root)} → missing {ref}')
        elif u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
            errors.append(f'{path.relative_to(root)} → missing anchor {ref}')

if not pages: errors.append('No generated HTML to inspect')
for error in errors: print('FAIL', error)
print(f'{len(pages)} pages · {refs} local references · {len(errors)} failures')
sys.exit(1 if errors else 0)
