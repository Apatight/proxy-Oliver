require('newrelic');
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

const redis = require('redis');
const REDIS_PORT = 6379;

// const client = new Redis(port, host, {
//   retryStrategy: function (times) {
//     log.warn('Lost Redis connection, reattempting');
//     return Math.min(times * 2, 2000);
//   },

// const client = require('redis').createClient(6379, 'proxyredis-001.1i3yro.0001.usw1.cache.amazonaws.com', {no_ready_check: true});

const client = redis.createClient( {host: '172.31.22.252', port: REDIS_PORT} ); // CHANGE HERE FOR REDIS DOCKER
// const client = redis.createClient(REDIS_PORT); // For localhost

// docker-compose up --build -d
client.on("connect", function () {
  console.log("connected");
});


const renderComponents = (components, props) => {
  return Object.keys(components).map(item => {
    let component = React.createElement(components[item], props);
    return ReactDom.renderToString(component);
  });
};

app.use('/', express.static(path.join(__dirname, './public')));

app.get('/loaderio-c8b1df398405b635a72cfe224b805016', (req, res) => {
  res.end('loaderio-c8b1df398405b635a72cfe224b805016');
});


// %{*:1-1000}
// SSR TEMPLATE  docker-compose up --build -d
// docker-machine rm proxy1 proxy2 proxy3 proxy4 proxy5 proxy6 proxy7 nearby1
app.get('/restaurants/:id', (req, res) => {
  let id = req.params.id;
  client.get(id, (err, result) => {
    if (result) {
      let components = renderComponents(services, JSON.parse(result));
      res.end(Layout(
        'Apatight',
        App(...components),
        Scripts(Object.keys(services), result)
      ));
    } else {
      axios.get(`http://nearbyb-2055818164.us-west-1.elb.amazonaws.com/api/restaurants/${id}/nearby`)
      .then((data) => {
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

// FULL PAGE LOAD
// app.get('/restaurants/:id', (req, res) => {
//   const id = req.params.id;
//   console.log('1');
//   client.get(id, (err, result) => {
//     if (result) {
//       console.log('2');
//       res.status(200);
//       let components = renderComponents(services, JSON.parse(result));
//       res.end(Layout(
//         'Apatight',
//         App(...components),
//         Scripts(Object.keys(services), result)
//       ));
//     } else {
//       console.log('3, id is,', id);
//       // USING NEARBY1 docker-compose up -d
//       axios.get(`http://nearbyb-2055818164.us-west-1.elb.amazonaws.com/api/restaurants/${id}/nearby`)
//       .then((data) => {
//         console.log(data)
//         let obj = {
//           currentRestaurant: data.restaurant,
//           nearbyRestaurants: data.nearby
//         }
//         client.setex(id, 60*60, JSON.stringify(obj));
//         let components = renderComponents(services, obj);
//         res.end(Layout(
//           'Apatight',
//           App(...components),
//           Scripts(Object.keys(services), obj)
//         ));
//       })
//     }
//   });
// });

app.listen(port, () => {
  console.log(`server running at: ${port}`);
});
