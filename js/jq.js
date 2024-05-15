let CLI;



async function setup() {
  let params = (new URL(document.location)).searchParams;

  if (params.has('query')) {
    document.getElementById("filter").value = params.get('query');
  }

  CLI = await new Aioli("jq/1.7");

  // Attach event listeners
  document.getElementById("filter").addEventListener('input', delayedJq);
  document.getElementById("input-json").addEventListener('input', delayedJq);
  document.getElementById("generate-button").addEventListener('click', jq);
  document.getElementById("add-column-button").addEventListener("click", addColumn);
  document.getElementById("add-row-button").addEventListener("click", addRow);
  document.getElementById("generate-button").addEventListener("click", generateStatements);
  attachTableListeners();
  jq();
}

async function jq() {
  let data = document.getElementById("input-json").value;
  let query = document.getElementById("filter").value;
  let params = (new URL(document.location)).searchParams;
  let options = ["--monochrome-output"];
  params.set('query', query);
  const url = new URL(document.location);
  url.search = params.toString();
  window.history.replaceState({}, '', url);

  await CLI.fs.writeFile("test.json", data);
  options.push(query);
  options.push("test.json");

  let output = await CLI.exec("jq", options);
  document.getElementById("output-json").value = output;
}

function debounce(callback, interval) {
  let debounceTimeoutId;

  return function (...args) {
    clearTimeout(debounceTimeoutId);
    debounceTimeoutId = setTimeout(() => callback.apply(this, args), interval);
  };
}
  
  let delayedJq = debounce(jq, 400);
  
  setup();
  
  function addColumn() {
    var table = document.getElementById("jq-table");
    var columnCount = table.rows[0].cells.length;
    table.rows[0].insertCell(columnCount - 0);
    table.rows[0].cells[columnCount - 0].innerHTML = `VS`;
    for (var i = 1; i < table.rows.length; i++) {
      table.rows[i].insertCell(columnCount);
      table.rows[i].cells[columnCount].innerHTML = `<input type="checkbox" />`;
    }
    attachTableListeners();
  }
  
  function addRow() {
    var table = document.getElementById("jq-table");
    var rowCount = table.rows.length;
    var newRow = table.insertRow(rowCount - 1);
  
    var cellTool = newRow.insertCell(0);
    cellTool.innerHTML = `<input type="text" value="Detector 1" class="form-control"/>`;
  
    var cellThing = newRow.insertCell(1);
    cellThing.innerHTML = `<input type="text" value="Part" class="form-control"/>`;
  
    var cellAttributes = newRow.insertCell(2);
    cellAttributes.innerHTML = `
      <div class="d-flex align-items-center">
          <input type="checkbox" class="form-control form-control-sm me-1 form-check-input" title="CLASSIFIER" />
          ${[
            { label: "X", value: 0 },
            { label: "Y", value: 0 },
            { label: "X+W", value: 0 },
            { label: "Y+H", value: 0 },
            { label: "Max-W", value: 0 },
            { label: "Min-W", value: 0 },
            { label: "Max-H", value: 0 },
            { label: "Min-H", value: 0 }
          ].map(attr => `<input type="number" class="form-control form-control-sm me-1 d-none" title="${attr.label}" value="${attr.value}" style="width: 50px;">`).join('')}
          <i class="fas fa-edit" data-bs-toggle="modal" data-bs-target="#editModal" onclick="populateModal(this)"></i>
      </div>`;
  
    for (var j = 3; j < table.rows[0].cells.length; j++) {
      var cellCheckbox = newRow.insertCell(j);
      cellCheckbox.innerHTML = `<input type="checkbox" class="form-check-input" />`;
    }
    attachTableListeners();
  }
  
  function attachTableListeners() {
    const table = document.getElementById("jq-table");
    const inputs = table.querySelectorAll('input[type="text"], input[type="checkbox"]');
    inputs.forEach(input => {
      input.removeEventListener('input', generateStatements);
      input.addEventListener('input', generateStatements);
    });
  }
  
  var currentEditingInput;
  
  function populateModal(icon) {
    currentEditingInput = icon.closest('.d-flex').querySelectorAll('input[type="number"]');
    var formGroup = document.getElementById('edit-form').querySelector('.form-group');
    let htmlContent = '';
    formGroup.innerHTML = '';
  
    currentEditingInput.forEach((input, index) => {
      var title = input.getAttribute('title');
  
      if (index % 2 === 0) {
        if (index > 0) {
          htmlContent += '</div>';
        }
        htmlContent += '<div class="row">';
      }
  
      htmlContent += `
        <div class="col-md-6">
          <div class="mb-2">
            <label class="form-label">${title}</label>
            <input type="number" class="form-control" value="${input.value}" title="Attribute ${index + 1}" data-index="${index}">
          </div>
        </div>`;
  
      if (index === currentEditingInput.length - 1) {
        htmlContent += '</div>';
      }
    });
  
    if (currentEditingInput.length % 2 !== 0) {
      htmlContent += '</div>';
    }
  
    formGroup.innerHTML = htmlContent;
  }
  
  function saveChanges() {
    var modalInputs = document.querySelectorAll('#edit-form input[type="number"]');
    modalInputs.forEach((modalInput, index) => {
      currentEditingInput[index].value = modalInput.value;
    });
    $('#editModal').modal('hide');
    generateStatements();
  }
  
  window.addEventListener('DOMContentLoaded', (event) => {
    fetch('jqmodal2.html')
      .then(response => response.text())
      .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
        bindCropper();
      })
      .catch(error => {
        console.error('Error loading the modal:', error);
      });
  });
  
  function constructFilterStatement(toolValue, thingValue, conditions) {
    let filterStatement = `([."${toolValue}".output[] | select(.class== "${thingValue}"`;
  
    conditions.forEach(condition => {
      if (condition.value !== "" && condition.value !== "0") {
        filterStatement += ` ${condition.operator} ${condition.expression.replace("{}", condition.value)}`;
      }
    });
  
    filterStatement += ")] | any)";
    return filterStatement;
  }
  
  function generateStatementsog() {
    try {
      const table = document.getElementById("jq-table");
      const rows = table.rows;
      const columns = table.rows[0].cells.length - 3;
  
      const visibleStatements = [];
      const passStatements = [];
  
      for (let j = 3; j < columns + 3; j++) {
        for (let i = 1; i < rows.length - 1; i++) {
          const row = rows[i];
          const toolValue = row.cells[0].querySelector('input[type="text"]').value;
          const thingValue = row.cells[1].querySelector('input[type="text"]').value;
          const classifierChecked = row.cells[2].querySelector('input[type="checkbox"]').checked;
          const conditions = buildConditions(row);
  
          const filterStatement = constructFilterStatement(toolValue, thingValue, conditions);
          const checkbox = row.cells[j].querySelector('input[type="checkbox"]');
  
          if (checkbox.checked) {
            visibleStatements.push(filterStatement);
  
            if (classifierChecked) {
              const passConditionStatement = `(([."${toolValue}".output[] | select(.class== "${thingValue}")]) | any)`;
              passStatements.push(`(${passConditionStatement} and ${filterStatement})`);
            }
          }
        }
      }
  
      const outputObj = {
        visible: `(${visibleStatements.join(" or ")}) `,
        pass: `(${passStatements.join(" or ")})`
      };
  
      const formattedOutput = JSON.stringify(outputObj, null, 2);
  
      const statementTextArea = document.getElementById("filter");
      statementTextArea.value = formattedOutput;
  
      jq();
      delayedJq();
    } catch (error) {
      console.error("An error occurred while generating statements:", error);
    }
  }
  
  
  function buildConditions(row) {
    return [
      { value: row.cells[2].querySelectorAll('input[type="number"]')[0].value, operator: "and" , expression: "(.x >= {})" },
      { value: row.cells[2].querySelectorAll('input[type="number"]')[1].value, operator: "and", expression: "(.y >= {})" },
      { value: row.cells[2].querySelectorAll('input[type="number"]')[2].value, operator: "and", expression: "((.x + .w) <= {})" },
      { value: row.cells[2].querySelectorAll('input[type="number"]')[3].value, operator: "and", expression: "((.y + .h) <= {})" },
      { value: row.cells[2].querySelectorAll('input[type="number"]')[4].value, operator: "and", expression: "(.w >= {})" },
      { value: row.cells[2].querySelectorAll('input[type="number"]')[5].value, operator: "and", expression: "(.w <= {})" },
      { value: row.cells[2].querySelectorAll('input[type="number"]')[6].value, operator: "and", expression: "(.h >= {})" },
      { value: row.cells[2].querySelectorAll('input[type="number"]')[7].value, operator: "and", expression: "(.h <= {})" }
    ];
  }
  
  function generateVisibleStatements(rows, columns) {
    let statements = [];
    for (let j = 3; j < columns + 3; j++) {
      let columnStatements = [];
      for (let i = 1; i < rows.length - 1; i++) {
        let row = rows[i];
        let toolValue = row.cells[0].querySelector('input[type="text"]').value;
        let thingValue = row.cells[1].querySelector('input[type="text"]').value;
        let classifierChecked = row.cells[2].querySelector('input[type="checkbox"]').checked;
  
        if (row.cells[j].querySelector('input[type="checkbox"]').checked) {
          let statement = constructFilterStatement(row);
          columnStatements.push(statement);
        }
      }
  
      if (columnStatements.length > 0) {
        statements.push("(" + columnStatements.join(" and ") + ")");
      }
    }
    return statements;
  }
  
  function generatePassStatements(rows, columns) {
    let passStatements = [];
    let passRow = rows[rows.length - 1];
    for (let j = 3; j < columns + 3; j++) {
      let passColumnStatement = [];
      if (passRow.cells[j].querySelector('input[type="checkbox"]').checked) {
        for (let i = 1; i < rows.length - 1; i++) {
          let row = rows[i];
          if (row.cells[j].querySelector('input[type="checkbox"]').checked) {
            let statement = constructPassFilterStatement(row);
            passColumnStatement.push(statement);
          }
        }
      }
      if (passColumnStatement.length > 0) {
        passStatements.push("(" + passColumnStatement.join(" and ") + ")");
      }
    }
    return passStatements;
  }
  
  function combineAndDisplayResults(visibleStatements, passStatements) {
    let output = "{\n";
    output += `"visible": (${visibleStatements.join(" or ")}),\n`;
    output += `"pass": (${passStatements.join(" or ")})\n`;
    output += "}";
  
    let statementTextArea = document.getElementById("filter");
    statementTextArea.value = output;
    jq();
    delayedJq();
  }
  
  function constructFilterStatement(row) {
    let toolValue = row.cells[0].querySelector('input[type="text"]').value;
    let thingValue = row.cells[1].querySelector('input[type="text"]').value;
    let classifierChecked = row.cells[2].querySelector('input[type="checkbox"]').checked;
  
    let filterStatement = `([."${toolValue}".output[] | select(.class== "${thingValue}"`;
    row.cells[2].querySelectorAll('input[type="number"]').forEach((input, index) => {
      let value = input.value;
      if (value !== "" && value !== "0") {
        switch (index) {
          case 0: filterStatement += ` and (.x >= ${value})`; break;
          case 1: filterStatement += ` and (.y >= ${value})`; break;
          case 2: filterStatement += ` and ((.x + .w) <= ${value})`; break;
          case 3: filterStatement += ` and ((.y + .h) <= ${value})`; break;
          case 4: filterStatement += ` and (.w <= ${value})`; break;
          case 5: filterStatement += ` and (.w >= ${value})`; break;
          case 6: filterStatement += ` and (.h <= ${value})`; break;
          case 7: filterStatement += ` and (.h >= ${value})`; break;
        }
      }
    });
  
    if (classifierChecked) {
      filterStatement += ')] | any) and ([."Classifier 1".output[] | select(.classification != "not_visible")]| any)';
    } else {
      filterStatement += ")] | any)";
    }
    return filterStatement;
  }
  
  function constructPassFilterStatement(row) {
    let toolValue = row.cells[0].querySelector('input[type="text"]').value;
    let thingValue = row.cells[1].querySelector('input[type="text"]').value;
    let classifierChecked = row.cells[2].querySelector('input[type="checkbox"]').checked;
  
    let filterStatement = `([."${toolValue}".output[] | select(.class== "${thingValue}"`;
    row.cells[2].querySelectorAll('input[type="number"]').forEach((input, index) => {
      let value = input.value;
      if (value !== "" && value !== "0") {
        switch (index) {
          case 0: filterStatement += ` and (.x >= ${value})`; break;
          case 1: filterStatement += ` and (.y >= ${value})`; break;
          case 2: filterStatement += ` and ((.x + .w) <= ${value})`; break;
          case 3: filterStatement += ` and ((.y + .h) <= ${value})`; break;
          case 4: filterStatement += ` and (.w <= ${value})`; break;
          case 5: filterStatement += ` and (.w >= ${value})`; break;
          case 6: filterStatement += ` and (.h <= ${value})`; break;
          case 7: filterStatement += ` and (.h >= ${value})`; break;
        }
      }
    });
  
    if (classifierChecked) {
      filterStatement += ')] | any) and ([."Classifier 1".output[] | select(.classification == "passed")]| any)';
    } else {
      filterStatement += ")] | any)";
    }
    return filterStatement;
  }
  
  function generateStatements() {
    var table = document.getElementById("jq-table");
    var rows = table.rows;
    var columns = table.rows[0].cells.length - 3;
  
    let visibleStatements = generateVisibleStatements(rows, columns);
    let passStatements = generatePassStatements(rows, columns);
    combineAndDisplayResults(visibleStatements, passStatements);
  }
  
  async function jq() {
    let data = document.getElementById("input-json").value;
    let query = document.getElementById("filter").value;
    let params = (new URL(document.location)).searchParams;
    let options = ["--monochrome-output"];
    params.set('query', query);
    const url = new URL(document.location);
    url.search = params.toString();
    window.history.replaceState({}, '', url);
  
    await CLI.fs.writeFile("test.json", data);
    options.push(query);
    options.push("test.json");
  
    let output = await CLI.exec("jq", options);
    document.getElementById("output-json").value = output;
  }
  
  document.getElementById("filter").addEventListener('input', jq);
  
  window.addEventListener('DOMContentLoaded', (event) => {
    fetch('jqmodal2.html')
      .then(response => response.text())
      .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
        bindCropper();
      })
      .catch(error => {
        console.error('Error loading the modal:', error);
      });
  });
  
  function bindCropper() {
    var imageInput = document.getElementById('imageInput');
    if (imageInput) {
      imageInput.addEventListener('change', function (event) {
        var files = event.target.files;
        if (files && files.length > 0) {
          var reader = new FileReader();
          reader.onload = function (e) {
            var image = document.getElementById('image');
            if (window.cropper) {
              window.cropper.destroy();
            }
            image.src = e.target.result;
            window.cropper = new Cropper(image, {
              viewMode: 2,
              dragMode: 'none',
              zoomable: false,
              scalable: false,
              toggleDragModeOnDblclick: false,
              aspectRatio: NaN,
              crop(event) {
                document.querySelector('[title="Attribute 1"]').value = Math.round(event.detail.x);
                document.querySelector('[title="Attribute 2"]').value = Math.round(event.detail.y);
                document.querySelector('[title="Attribute 3"]').value = Math.round(event.detail.x + event.detail.width);
                document.querySelector('[title="Attribute 4"]').value = Math.round(event.detail.y + event.detail.height);
              }
            });
          };
          reader.readAsDataURL(files[0]);
        }
      });
    }
  }
  