import { analyzeSemantics } from './modules/lexer.js';

document.getElementById('fileForm').addEventListener('submit', function (event) {
  event.preventDefault();
  // Clear any existing results
  var tbody = document.getElementById('resultsBody');
  tbody.innerHTML = '';
  // reads file
  var file = document.getElementById('codeFile').files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (event) {
    var contents = event.target.result;
    analyzeSemantics(contents);
  };
  reader.readAsText(file);
});

// function tokenize(fileContent) {
//   const tokens = fileContent.split('\n').flatMap((line, index) => lineLexer(line, index));
//   displayResults(tokens);
// }

export function displayResults({ lineNumber, lineText, result, isError }) {
  var tbody = document.getElementById('resultsBody');
  var row = document.createElement('tr');
  if (isError) {
    row.classList.add('lineError');
  }
  //!fix for < and > not showing
  lineText = lineText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  row.innerHTML = `
        <td>${lineNumber}</td>
        <td>${lineText}</td>
        <td>${result}</td>
    `;
  tbody.appendChild(row);
}
