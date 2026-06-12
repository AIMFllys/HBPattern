module.exports = {
  apps: [{
    name: 'hbpattern',
    script: 'node_modules/.bin/next',
    args: 'start -p 6427',
    cwd: __dirname,
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
