const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const axios = require('axios');

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const clientBundles = './public/services';
const serverBundles = './templates/services';
const serviceConfig = require('./service-config.json');
const services = require('./loader.js')(clientBundles, serverBundles, serviceConfig);

const React = require('react');
const ReactDom = require('react-dom/server');
const Layout = require('./templates/layout');
const App = require('./templates/app');
const Scripts = require('./templates/scripts');

const http = require('http');
const compression = require('compression')

const redis = require('redis');
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const client = redis.createClient( {host: '13.57.220.15', port: REDIS_PORT, pass:'password'} ); // For Docker
// const client = redis.createClient(REDIS_PORT}); // For localhost

app.use(compression({
 filter: function () { return true; },
}));


const renderComponents = (components, props) => {
  return Object.keys(components).map(item => {
    let component = React.createElement(components[item], props);
    return ReactDom.renderToString(component);
  });
};

app.use('/', express.static(path.join(__dirname, './public')));

// Including Redis
app.get('/restaurants/:id', (req, res) => {
  const id = req.params.id;
  client.get(id, (err, result) => {
    if (result) {
      res.status(200);
      let components = renderComponents(services, JSON.parse(result));
      res.end(Layout(
        'Apatight',
        App(...components),
        Scripts(Object.keys(services), result)
      ));
    } else {
      axios.get(`http://127.0.0.1:3004/api/restaurants/${id}/nearby`)
      .then(({data}) => {
        let obj = {
          currentRestaurant: data.restaurant,
          nearbyRestaurants: data.nearby
        }
        client.setex(id, 60*60, JSON.stringify(obj));
        let components = renderComponents(services, obj);
        res.end(Layout(
          'Apatight',
          App(...components),
          Scripts(Object.keys(services), obj)
        ));
      })
    }
  });
});

app.listen(port, () => {
  console.log(`server running at: http://localhost:${port}`);
});
