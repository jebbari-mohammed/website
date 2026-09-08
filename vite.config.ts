import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

function staticPublicHtmlMiddleware(): Plugin {
  return {
    name: 'static-public-html-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const cleanUrl = req.url.split('?')[0];

        // Only intercept non-root, non-asset requests
        if (
          cleanUrl !== '/' &&
          !cleanUrl.startsWith('/@') &&
          !cleanUrl.startsWith('/src') &&
          !cleanUrl.startsWith('/node_modules') &&
          !cleanUrl.startsWith('/assets')
        ) {
          const publicDir = path.resolve(process.cwd(), 'public');
          let targetPath = path.join(publicDir, cleanUrl);

          if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
            targetPath = path.join(targetPath, 'index.html');
          } else if (!path.extname(targetPath) && fs.existsSync(targetPath + '.html')) {
            targetPath = targetPath + '.html';
          }

          if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return fs.createReadStream(targetPath).pipe(res);
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
})
