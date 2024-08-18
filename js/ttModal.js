var currentEditingInput;

// Function to open and populate the modal
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

// Function to save changes from the modal back to the main interface
function saveChanges() {
  var modalInputs = document.querySelectorAll('#edit-form input[type="number"]');
  modalInputs.forEach((modalInput, index) => {
    currentEditingInput[index].value = modalInput.value;
  });
  $('#editModal').modal('hide');
  generateStatements();  // Re-generate statements if necessary
}

// Event listener for opening the modal when the DOM is fully loaded
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

// Optional: Function to bind any additional logic (e.g., image cropper, if relevant)
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
