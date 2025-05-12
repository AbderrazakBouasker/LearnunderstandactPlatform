(function () {
  console.log("Feedback widget script loaded");
  const script = document.currentScript;
  const formId = script.getAttribute("data-formid");
  // console.log("Form ID:", formId);

  if (!formId) return;

  // Extract the origin from the script's src attribute
  const scriptSrc = script.src;
  const scriptOrigin = new URL(scriptSrc).origin;
  // console.log("Script Origin:", scriptOrigin);

  // Use the script's origin for the form URL
  const formUrl = `${scriptOrigin}/form/${formId}?embed=true`;
  // console.log("Form URL:", formUrl);

  // Inject CSS
  const style = document.createElement("style");
  style.textContent = `
      #feedback-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: #0070f3;
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        border: none;
        cursor: pointer;
        font-size: 14px;
      }
      #feedback-modal {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9998;
      }
      #feedback-iframe {
        width: 90%;
        height: 80%;
        border: none;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
      }
    `;
  document.head.appendChild(style);

  // Create button
  const button = document.createElement("button");
  button.id = "feedback-btn";
  button.innerText = "Give Feedback";
  document.body.appendChild(button);

  // Create modal
  const modal = document.createElement("div");
  modal.id = "feedback-modal";
  modal.innerHTML = `
      <iframe id="feedback-iframe" src="${formUrl}"></iframe>
    `;
  document.body.appendChild(modal);

  // Button click → open modal
  button.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // Click outside iframe → close modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modal.style.display = "none";
    }
  });
})();
