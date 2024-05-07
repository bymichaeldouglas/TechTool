// Service worker registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/jq_offline/service_worker.js', { scope: '/jq_offline' })
     .then(function(registration) {
        console.log('Service Worker Registered');
      })
     .catch(e => {
        console.log('Unable to register service worker', e);
      });
  
    navigator.serviceWorker.ready.then(function(registration) {
      console.log('Service Worker Ready');
    })
   .catch(e => {
      console.log('Service worker unable to get ready', e);
    });
  }
  
  // Setup function
  async function setup() {
    // Populate the form from the url parameters
    let params = (new URL(document.location)).searchParams;
  
    let query = params.get('query');
    if (query) {
      document.getElementById("filter").value = query;
    }
    ['compact-output','sort-keys', 'raw-input', 'raw-output','slurp'].forEach(option => {
      let p = params.get(option);
      if (p === 'true') {
        document.getElementById(option).checked = true;
      }
    });
  }
  
  // JQ function
  async function jq() {
    let data = document.getElementById("input-json").value;
    let query = document.getElementById("filter").value;
  
    let params = (new URL(document.location)).searchParams;
    let options = ["--monochrome-output"];
    ['compact-output','sort-keys', 'raw-input', 'raw-output','slurp'].forEach(option => {
      let part = document.getElementById(option).checked;
      if (part) {
        params.set(option, true);
        options.push('--' + option);
      } else {
        params.delete(option);
      }
    });
  
    // Update url query params with current query
    params.set('query', query);
    const url = new URL(document.location);
    url.search = params.toString();
    window.history.replaceState({}, 'Jq Offline', url);
  
    // Create mock JSON file
    await CLI.fs.writeFile("test.json", data);
  
    options.push(query);
    options.push("test.json");
  
    let output = await CLI.exec("jq", options);
    document.getElementById("output-json").value = output;
  }
  
  // Debounce function
  function debounce(callback, interval) {
    let debounceTimeoutId;
  
    return function(...args) {
      clearTimeout(debounceTimeoutId);
      debounceTimeoutId = setTimeout(() => callback.apply(this, args), interval);
    };
  }
  
  let delayedJq = debounce(jq, 400);
  
  setup();
  let CLI = await new Aioli("jq/1.7");
  
  document.getElementById("filter").addEventListener('input', delayedJq);
  document.getElementById("input-json").addEventListener('input', delayedJq);
  document.getElementById("compact-output").addEventListener('input', jq);
  document.getElementById("sort-keys").addEventListener('input', jq);
  document.getElementById("raw-input").addEventListener('input', jq);
  document.getElementById("raw-output").addEventListener('input', jq);
  document.getElementById("slurp").addEventListener('input', jq);
  document.getElementById("generate-button").addEventListener('input', Jq);
  
  // Call jq the first time without any changes
  jq();
  
  // Add event listeners for buttons
  document.getElementById("add-column-button").addEventListener("click", addColumn);
  document.getElementById("add-row-button").addEventListener("click", addRow);
  document.getElementById("generate-button").addEventListener("click", generateStatements);
  
  function addColumn() {
    // Add column logic
  }
  
  function addRow() {
    // Add row logic
  }
  
  function generateStatements() {
    // Generate statements logic
  }