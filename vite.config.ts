import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

export function staticPublicHtmlMiddleware(publicDir = path.resolve(process.cwd(), 'public')): Plugin {
  return {
    name: 'static-public-html-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        let cleanUrl: string;
        try {
          cleanUrl = decodeURIComponent(req.url.split('?')[0]);
        } catch {
          res.statusCode = 400;
          return res.end('Invalid request path');
        }
        if (!cleanUrl.startsWith('/') || cleanUrl.startsWith('//') || /[\\\0]/.test(cleanUrl)
          || cleanUrl.split('/').some(segment => segment === '..' || segment === '.')) {
          res.statusCode = 403;
          return res.end('Forbidden');
        }

        // Only intercept non-root, non-asset requests
        if (
          cleanUrl !== '/' &&
          !cleanUrl.startsWith('/@') &&
          !cleanUrl.startsWith('/src') &&
          !cleanUrl.startsWith('/node_modules') &&
          !cleanUrl.startsWith('/assets')
        ) {
          let targetPath = path.resolve(publicDir, `.${cleanUrl}`);

          if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
            targetPath = path.join(targetPath, 'index.html');
          } else if (!path.extname(targetPath) && fs.existsSync(targetPath + '.html')) {
            targetPath = targetPath + '.html';
          }

          // Only serve HTML here. Vite handles assets and their MIME types.
          if (path.extname(targetPath).toLowerCase() === '.html'
            && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
            const realRoot = fs.realpathSync(publicDir);
            const realTarget = fs.realpathSync(targetPath);
            const relative = path.relative(realRoot, realTarget);
            if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
              res.statusCode = 403;
              return res.end('Forbidden');
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            const stream = fs.createReadStream(realTarget);
            stream.on('error', () => { res.statusCode = 404; res.end('Not found'); });
            return stream.pipe(res);
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), staticPublicHtmlMiddleware()],
  server: { host: '127.0.0.1' },
})
