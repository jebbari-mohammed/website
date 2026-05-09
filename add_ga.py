import os

ga_snippet = """    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZXDRG5V07H"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-ZXDRG5V07H');
    </script>"""

count = 0
for root, dirs, files in os.walk('public'):
    for file in files:
        if file.endswith('.html'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'G-ZXDRG5V07H' not in content:
                # Replace <head> (case insensitive)
                content = content.replace('<head>', f'<head>\n{ga_snippet}')
                content = content.replace('<HEAD>', f'<HEAD>\n{ga_snippet}')
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1

print(f"Updated {count} HTML files in public directory.")
