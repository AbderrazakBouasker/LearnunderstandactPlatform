(function () {
  console.log("Feedback widget script loaded");
  const script = document.currentScript;
  const formId = script.getAttribute("data-formid");

  if (!formId) return;

  const scriptSrc = script.src;
  const scriptOrigin = new URL(scriptSrc).origin;

  const formEmbedPageUrl = `${scriptOrigin}/embed/form/${formId}`;
  const formApiUrl = `${scriptOrigin}/api/form/${formId}`;

  const buttonText = script.getAttribute("data-button-text") || "Give Feedback";
  const buttonPosition =
    script.getAttribute("data-button-position") || "bottom-right";

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

  const buttonStyles = {};
  const modalStyles = {};
  const iframeStyles = {};
  const iframeAttributes = {};

  Array.from(script.attributes).forEach((attr) => {
    const name = attr.name;
    const value = attr.value;

    if (name.startsWith("data-button-style-")) {
      const cssProperty = name
        .replace("data-button-style-", "")
        .replace(/(-\w)/g, (m) => m[1].toUpperCase());
      buttonStyles[cssProperty] = value;
    } else if (name.startsWith("data-modal-style-")) {
      const cssProperty = name
        .replace("data-modal-style-", "")
        .replace(/(-\w)/g, (m) => m[1].toUpperCase());
      modalStyles[cssProperty] = value;
    } else if (name.startsWith("data-iframe-style-")) {
      const cssProperty = name
        .replace("data-iframe-style-", "")
        .replace(/(-\w)/g, (m) => m[1].toUpperCase());
      iframeStyles[cssProperty] = value;
    } else if (
      name.startsWith("data-iframe-") &&
      !name.startsWith("data-iframe-style-")
    ) {
      const attrName = name.replace("data-iframe-", "");
      iframeAttributes[attrName] = value;
    }
  });

  try {
    const styleJson = script.getAttribute("data-iframe-style");
    if (styleJson) {
      const styleObj = JSON.parse(styleJson);
      Object.assign(iframeStyles, styleObj);
    }
  } catch (e) {
    console.error("Error parsing iframe style JSON:", e);
  }

  let buttonCss = "";
  let modalCss = "";
  let iframeCss = "";

  Object.entries(buttonStyles).forEach(([property, value]) => {
    buttonCss += `${property
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()}: ${value};\n`;
  });

  Object.entries(modalStyles).forEach(([property, value]) => {
    modalCss += `${property
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()}: ${value};\n`;
  });

  Object.entries(iframeStyles).forEach(([property, value]) => {
    iframeCss += `${property
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()}: ${value};\n`;
  });

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
        color: #333; /* Default text color for modal content */
        ${modalCss}
      }
      #feedback-iframe {
        /* Remove default width/height to allow attributes to take precedence */
        border: none;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        ${iframeCss}
      }
      /* Style for the error message div inside the modal */
      #feedback-modal-error {
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 90%;
        width: 400px; /* Or a suitable width */
      }
      #feedback-modal-error h3 {
        margin-top: 0;
        font-size: 1.5em;
        color: #d9534f; /* Error color */
      }
      #feedback-modal-error p {
        font-size: 1em;
        line-height: 1.6;
      }
    `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "feedback-btn";
  button.innerText = buttonText;
  document.body.appendChild(button);

  const modal = document.createElement("div");
  modal.id = "feedback-modal";

  // Iframe will be created and appended conditionally
  // Error message container will also be created and appended conditionally

  document.body.appendChild(modal); // Append modal once

  button.addEventListener("click", async () => {
    const originalButtonText = button.innerText;
    button.innerText = "Loading...";
    button.disabled = true;

    modal.innerHTML = "";

    try {
      const response = await fetch(formApiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to load form configuration: ${response.status}`
        );
      }
      const formData = await response.json();
      const organizationDomains = formData.organizationDomains;

      let parentHostname;
      try {
        parentHostname = window.top.location.hostname;
      } catch (e) {
        console.warn(
          "Could not access window.top.location.hostname. Domain check might be incomplete.",
          e
        );
      }

      let isAllowed = false; // Default to not allowed
      if (
        parentHostname &&
        organizationDomains &&
        organizationDomains.length > 0 // Check if domains list is not empty
      ) {
        if (organizationDomains.includes(parentHostname)) {
          isAllowed = true;
        }
      } else if (organizationDomains && organizationDomains.length === 0) {
        // Explicitly disallow if the list is empty
        isAllowed = false;
        console.log("Embedding disallowed: Organization domain list is empty.");
      }
      // If organizationDomains is undefined or null, it implies no restriction was set from backend,
      // which might be a different state than an explicitly empty list.
      // For this logic: empty list = disallow all. undefined/null = could be allow all (if that's desired default)
      // However, to strictly follow "if its empty it shouldn't open in any domain":
      if (organizationDomains && organizationDomains.length === 0) {
        isAllowed = false;
      } else if (
        parentHostname &&
        organizationDomains &&
        organizationDomains.length > 0
      ) {
        isAllowed = organizationDomains.includes(parentHostname);
      } else {
        // If organizationDomains is null/undefined OR parentHostname couldn't be determined,
        // and the list isn't explicitly empty, this branch is hit.
        // To be safe and adhere to "empty list = disallow", if organizationDomains is not a populated array, disallow.
        isAllowed = false;
        if (!organizationDomains || organizationDomains.length === 0) {
          console.log(
            "Embedding disallowed: Organization domain list is effectively empty or not configured for embedding."
          );
        } else {
          console.log(
            "Embedding disallowed: Could not determine parent hostname or other issue."
          );
        }
      }

      if (isAllowed) {
        const iframe = document.createElement("iframe");
        iframe.id = "feedback-iframe";
        iframe.src = formEmbedPageUrl;

        if (!iframeAttributes.width) {
          iframe.style.width = "90%";
        }
        if (!iframeAttributes.height) {
          iframe.style.height = "80%";
        }

        console.log("Applying iframe attributes:", iframeAttributes);
        for (const [attr, value] of Object.entries(iframeAttributes)) {
          iframe.setAttribute(attr, value);
          if (["width", "height", "border", "borderRadius"].includes(attr)) {
            iframe.style[attr] = value;
          }
        }
        modal.appendChild(iframe);
      } else {
        const errorDiv = document.createElement("div");
        console.log(
          parentHostname
            ? `Embedding not allowed for domain: ${parentHostname}`
            : "Embedding not allowed: parent hostname not determined or domain list empty."
        );
        errorDiv.id = "feedback-modal-error";
        errorDiv.innerHTML = `
          <h3>Embedding Not Allowed</h3>
          <p>This form cannot be embedded on the current domain. Please contact the form owner for assistance.</p>
        `;
        modal.appendChild(errorDiv);
      }
      modal.style.display = "flex";
    } catch (error) {
      console.error("Error during form load or domain check:", error);
      modal.innerHTML = ""; // Clear modal
      const errorDiv = document.createElement("div");
      errorDiv.id = "feedback-modal-error";
      errorDiv.innerHTML = `
        <h3>Error</h3>
        <p>${
          error.message || "An error occurred while loading the feedback form."
        }</p>
      `;
      modal.appendChild(errorDiv);
      modal.style.display = "flex";
    } finally {
      button.innerText = originalButtonText;
      button.disabled = false;
    }
  });

  modal.addEventListener("click", (e) => {
    // Close if clicking on the modal backdrop, but not on its content (iframe or errorDiv)
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modal.style.display = "none";
    }
  });
})();
