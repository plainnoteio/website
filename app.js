// Fill in the latest version + direct DMG link from GitHub releases.
fetch('https://api.github.com/repos/plainnoteio/app/releases/latest')
  .then((r) => (r.ok ? r.json() : null))
  .then((rel) => {
    if (!rel) return;
    const version = (rel.tag_name || '').replace(/^v/, '');
    const dmg = (rel.assets || []).find((a) => a.name.endsWith('.dmg'));
    if (dmg) document.getElementById('download-btn').href = dmg.browser_download_url;
    if (version) {
      document.getElementById('download-version').textContent = 'Version ' + version;
    }
  })
  .catch(() => {});
