const express = require('express');
// const morgan = require('morgan');
const path = require('path');
const app = express();
const port = 3000;
const axios = require('axios');

// app.use(morgan('dev'));
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

const renderComponents = (components, props) => {
  return Object.keys(components).map(item => {
    let component = React.createElement(components[item], props);
    console.log('component',component)
    return ReactDom.renderToString(component);
  });
};

app.use('/', express.static(path.join(__dirname, './public')));

// app.use('/restaurants', express.static(path.join(__dirname, './public')));

app.get('/restaurants/:id', (req, res) => {
  let id = req.params.id;
  axios.get(`http://127.0.0.1:3004/api/restaurants/${id}/nearby`)
  .then(({data}) => {
    let obj = {
      currentRestaurant: data.restaurant,
      nearbyRestaurants: data.nearby
    }
    // console.log('1', obj);
    let components = renderComponents(services, obj);
    res.end(Layout(
      'Apatight',
      App(...components),
      Scripts(Object.keys(services), obj)
    ));
  })

});

app.listen(port, () => {
  console.log(`server running at: http://localhost:${port}`);
});
