import { lineLexer } from './modules/lexer.js';

document.getElementById('fileForm').addEventListener('submit', function (event) {
  event.preventDefault();
  var file = document.getElementById('codeFile').files[0];
  var reader = new FileReader();
  reader.onload = function (event) {
    var contents = event.target.result;
    tokenize(contents);
  };
  reader.readAsText(file);
});

function tokenize(fileContent) {
  const tokens = fileContent.split('\n').flatMap((line, index) => lineLexer(line, index));
  displayResults(tokens);
}

function displayResults(tokens) {
  var tbody = document.getElementById('resultsBody');
  tbody.innerHTML = ''; // Clear any existing results
  tokens.forEach(function (token) {
    var row = document.createElement('tr');
    row.innerHTML = `
          <td>${token.text}</td>
          <td>${token.type}</td>
          <td>${token.loc.startColumn}</td>
          <td>${token.loc.endColumn}</td>
          <td>${token.loc.line}</td>
      `;
    tbody.appendChild(row);
  });
}
