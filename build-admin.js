const esbuild = require('esbuild');

esbuild.buildSync({
  entryPoints: ['admin/src/App.jsx'],
  bundle: true,
  outfile: 'admin/bundle.js',
  format: 'iife',
  globalName: 'HeartbeatAdmin',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: ['react', 'react-dom'],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  minify: true,
  target: ['es2020']
});

console.log('[Admin] Built admin/bundle.js');
