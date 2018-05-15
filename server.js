const express = require('express');
// const morgan = require('morgan');
const path = require('path');
const app = express();
const port = 3000;

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

const renderComponents = (components, props = {}) => {
  return Object.keys(components).map(item => {
    let component = React.createElement(components[item], props);
    return ReactDom.renderToString(component);
  });
};

app.use('/', express.static(path.join(__dirname, './public')));

// app.use('/restaurants', express.static(path.join(__dirname, './public')));

app.get('/restaurants/:id', (req, res) => {
  // res.sendFile(path.join(__dirname, './public/index.html'));
  let components = renderComponents(services, {placeId: req.params.id});
  res.end(Layout(
    'Apatight',
    App(...components),
    Scripts(Object.keys(services))
  ));
});

app.listen(port, () => {
  console.log(`server running at: http://localhost:${port}`);
});
