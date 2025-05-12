(function () {
  console.log("Feedback widget script loaded");
  const script = document.currentScript;
  const formId = script.getAttribute("data-formid");

  if (!formId) return;

  // Extract the origin from the script's src attribute
  const scriptSrc = script.src;
  const scriptOrigin = new URL(scriptSrc).origin;

  // Use the script's origin for the form URL
  const formUrl = `${scriptOrigin}/form/${formId}?embed=true`;

  // Get common preset style attributes with defaults
  const buttonText = script.getAttribute("data-button-text") || "Give Feedback";
  const buttonPosition =
    script.getAttribute("data-button-position") || "bottom-right";

  // Set position style based on position value
  let positionStyle = "";
  switch (buttonPosition) {
    case "bottom-left":
      positionStyle = "bottom: 20px; left: 20px;";
      break;
    case "top-right":
      positionStyle = "top: 20px; right: 20px;";
      break;
    case "top-left":
      positionStyle = "top: 20px; left: 20px;";
      break;
    case "bottom-right":
    default:
      positionStyle = "bottom: 20px; right: 20px;";
      break;
  }

  // Extract all custom CSS properties from data attributes
  const buttonStyles = {};
  const modalStyles = {};
  const iframeStyles = {};
  const iframeAttributes = {}; // New: Store direct iframe attributes

  // Process all data attributes
  Array.from(script.attributes).forEach((attr) => {
    const name = attr.name;
    const value = attr.value;

    // Handle button styles (data-button-style-*)
    if (name.startsWith("data-button-style-")) {
      const cssProperty = name
        .replace("data-button-style-", "")
        .replace(/(-\w)/g, (m) => m[1].toUpperCase());
      buttonStyles[cssProperty] = value;
    }
    // Handle modal styles (data-modal-style-*)
    else if (name.startsWith("data-modal-style-")) {
      const cssProperty = name
        .replace("data-modal-style-", "")
        .replace(/(-\w)/g, (m) => m[1].toUpperCase());
      modalStyles[cssProperty] = value;
    }
    // Handle iframe styles (data-iframe-style-*)
    else if (name.startsWith("data-iframe-style-")) {
      const cssProperty = name
        .replace("data-iframe-style-", "")
        .replace(/(-\w)/g, (m) => m[1].toUpperCase());
      iframeStyles[cssProperty] = value;
    }
    // Handle direct iframe attributes (data-iframe-*)
    else if (
      name.startsWith("data-iframe-") &&
      !name.startsWith("data-iframe-style-")
    ) {
      const attrName = name.replace("data-iframe-", "");
      iframeAttributes[attrName] = value;
    }
  });

  // Parse iframe style JSON if provided
  try {
    const styleJson = script.getAttribute("data-iframe-style");
    if (styleJson) {
      const styleObj = JSON.parse(styleJson);
      Object.assign(iframeStyles, styleObj);
    }
  } catch (e) {
    console.error("Error parsing iframe style JSON:", e);
  }

  // Create CSS for button, modal and iframe
  let buttonCss = "";
  let modalCss = "";
  let iframeCss = "";

  // Convert the buttonStyles object to CSS
  Object.entries(buttonStyles).forEach(([property, value]) => {
    buttonCss += `${property
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()}: ${value};\n`;
  });

  // Convert the modalStyles object to CSS
  Object.entries(modalStyles).forEach(([property, value]) => {
    modalCss += `${property
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()}: ${value};\n`;
  });

  // Convert the iframeStyles object to CSS
  Object.entries(iframeStyles).forEach(([property, value]) => {
    iframeCss += `${property
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()}: ${value};\n`;
  });

  // Inject CSS
  const style = document.createElement("style");
  style.textContent = `
      #feedback-btn {
        position: fixed;
        ${positionStyle}
        z-index: 9999;
        background: #0070f3;
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        ${buttonCss}
      }
      #feedback-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      }
      #feedback-modal {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        ${modalCss}
      }
      #feedback-iframe {
        /* Remove default width/height to allow attributes to take precedence */
        border: none;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        ${iframeCss}
      }
    `;
  document.head.appendChild(style);

  // Create button
  const button = document.createElement("button");
  button.id = "feedback-btn";
  button.innerText = buttonText;
  document.body.appendChild(button);

  // Create modal with iframe
  const modal = document.createElement("div");
  modal.id = "feedback-modal";

  // Create iframe with custom attributes
  const iframe = document.createElement("iframe");
  iframe.id = "feedback-iframe";
  iframe.src = formUrl;

  // Set default dimensions if not specified in attributes
  if (!iframeAttributes.width) {
    iframe.style.width = "90%";
  }
  if (!iframeAttributes.height) {
    iframe.style.height = "80%";
  }

  // Apply direct iframe attributes
  console.log("Applying iframe attributes:", iframeAttributes);
  for (const [attr, value] of Object.entries(iframeAttributes)) {
    iframe.setAttribute(attr, value);
    // Also apply as inline style for attributes that affect appearance
    if (["width", "height", "border", "borderRadius"].includes(attr)) {
      const styleAttr = attr.replace(/([A-Z])/g, "-$1").toLowerCase();
      iframe.style[attr] = value;
    }
  }

  modal.appendChild(iframe);
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
