export default function handler(req, res) {
  res.setHeader("Content-Type", "application/javascript");

  const script = `
    (function() {
      // Get the form ID from the script tag
      const script = document.currentScript;
      const formId = script.getAttribute('data-formid');
      
      if (!formId) {
        console.error('Form ID is missing. Add data-formid attribute to the script tag.');
        return;
      }
      
      // Create button element
      const button = document.createElement('button');
      button.textContent = 'Feedback';
      button.style.position = 'fixed';
      button.style.bottom = '20px';
      button.style.right = '20px';
      button.style.zIndex = '9999';
      button.style.padding = '10px 15px';
      button.style.backgroundColor = '#fff';
      button.style.border = '1px solid #e2e8f0';
      button.style.borderRadius = '4px';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
      button.style.cursor = 'pointer';
      button.style.fontSize = '14px';
      
      // Create modal container
      const modal = document.createElement('div');
      modal.style.display = 'none';
      modal.style.position = 'fixed';
      modal.style.zIndex = '10000';
      modal.style.left = '0';
      modal.style.top = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
      
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = '${req.headers.host}/embed/form/' + formId;
      iframe.style.position = 'absolute';
      iframe.style.top = '50%';
      iframe.style.left = '50%';
      iframe.style.transform = 'translate(-50%, -50%)';
      iframe.style.width = '90%';
      iframe.style.maxWidth = '500px';
      iframe.style.height = '600px';
      iframe.style.maxHeight = '90%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.style.backgroundColor = '#fff';
      
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '10px';
      closeBtn.style.right = '10px';
      closeBtn.style.backgroundColor = 'transparent';
      closeBtn.style.border = 'none';
      closeBtn.style.fontSize = '24px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.zIndex = '10001';
      
      // Add elements to the DOM
      modal.appendChild(iframe);
      modal.appendChild(closeBtn);
      document.body.appendChild(button);
      document.body.appendChild(modal);
      
      // Add event listeners
      button.addEventListener('click', function() {
        modal.style.display = 'block';
      });
      
      closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
      });
      
      // Close modal when clicking outside iframe
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    })();
  `;

  res.status(200).send(script);
}
