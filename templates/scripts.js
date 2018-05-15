module.exports = (items, props) => `
  <script src="/lib/react.development.js"></script>
  <script src="/lib/react-dom.development.js"></script>

  ${items.map(item => {
    return `<script src="/services/${item}.js"></script>`;
  }).join('\n')}
  <script>
    ${items.map(item => `
      ReactDOM.hydrate(
        React.createElement(${item}, ${JSON.stringify(props)}),
        document.getElementById('${item}')
      );`).join('\n')}
  </script>
`;
