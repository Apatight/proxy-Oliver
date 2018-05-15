const fs = require('fs');
const fetch = require('node-fetch');
const Promise = require('bluebird');
const exists = Promise.promisify(fs.stat);

const loadBundle = function(cache, item, filename) {
  // console.log('cache', cache) // {nearby: localhost}
  // console.log('item', item) // item is nearby
  // console.log('filename', filename) // filename is nearby-server.js
  // add a small delay to ensure pipe has closed
  setTimeout(() => {
    console.log('loading:', filename);
    cache[item] = require(filename).default;
  }, 0);
};

const fetchBundles = (path, services, suffix = '', require = false) => {
  Object.keys(services).forEach(item => {
    // console.log('path is' ,path)
    const filename = `${path}/${item}${suffix}.js`;
    exists(filename)
      .then(() => {
        // console.log('filename', filename)
        require ? loadBundle(services, item, filename) : null;
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          const url = `${services[item]}${suffix}.js`;
          // console.log(`Fetching: ${url}`);
          // see: https://www.npmjs.com/package/node-fetch
          fetch(url)
            .then(res => {
              const dest = fs.createWriteStream(filename);
              res.body.pipe(dest);
              res.body.on('end', () => {
                require ? loadBundle(services, item, filename) : null;
              });
            });
        } else {
          console.log('WARNING: Unknown fs error');
        }
      });
  });
};

module.exports = (clientPath, serverPath, services) => {
  fetchBundles(clientPath, services);
  fetchBundles(serverPath, services, '-server', true);

  return services;
};
