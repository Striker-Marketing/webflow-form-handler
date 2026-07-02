const ITI_VERSION = "29.0.4";
const ITI_CSS_HREF = `https://cdn.jsdelivr.net/npm/intl-tel-input@${ITI_VERSION}/dist/css/intlTelInput.css`;
const ITI_JS_SRC = `https://cdn.jsdelivr.net/npm/intl-tel-input@${ITI_VERSION}/dist/js/intlTelInput.min.js`;
const ITI_UTILS_SRC = `https://cdn.jsdelivr.net/npm/intl-tel-input@${ITI_VERSION}/dist/js/utils.js`;

const loadItiAssets = () => {
  if (window.__itiAssetsPromise) return window.__itiAssetsPromise;
  window.__itiAssetsPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${ITI_CSS_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = ITI_CSS_HREF;
      document.head.appendChild(link);
    }
    if (window.intlTelInput) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = ITI_JS_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load intl-tel-input"));
    document.head.appendChild(script);
  });
  return window.__itiAssetsPromise;
};

const handleForm = ({
  formId,
  hasPhoneNumber,
  phoneNumberIsRequired,
  ghl = { formId: undefined, terms_and_conditions: undefined, location_id: undefined, isSurvey: undefined, captchaToken: undefined, updateContactOnly: undefined, fields: undefined, customFields: undefined, hasPath: undefined, hasMida: undefined, hasTaboola: undefined },
  submitFunction = () => {},
}) => {
  const form = document.getElementById(formId);
  const submitBtn = form.querySelector("[type='submit']");
  const urlParams = new URLSearchParams(window.location.search);

  if (ghl.formId) {
    const captchaScript = document.createElement("script");
    captchaScript.src = `https://www.google.com/recaptcha/enterprise.js?render=${ghl.captchaToken}`;
    captchaScript.async = true;
    captchaScript.type = "text/javascript";

    const style = document.createElement("style");
    style.textContent = `
      .grecaptcha-badge{width:0 !important;height: 0!important}
    `;
    document.head.appendChild(style);
    document.head.append(captchaScript);
  }

  const phoneField = hasPhoneNumber ? form.querySelector("[name='phone_number']") : null;
  let iti = null;
  if (phoneField) {
    loadItiAssets().then(() => {
      iti = window.intlTelInput(phoneField, {
        initialCountry: "auto",
        geoIpLookup: (success, failure) => {
          fetch("https://ipapi.co/json")
            .then((r) => r.json())
            .then((d) => success(d.country_code))
            .catch(() => failure());
        },
        loadUtils: () => import(ITI_UTILS_SRC),
      });
    });
  }

  const isPhoneValid = () => {
    if (!hasPhoneNumber) return true;
    if (!phoneNumberIsRequired && phoneField.value.trim() === "") return true;
    if (!iti) return false;
    return iti.isValidNumber();
  };

  const utms = Object.fromEntries(urlParams.entries());
  Object.keys(utms).forEach((key) => {
    const input = document.createElement("input");
    input.type = "text";
    input.setAttribute("hidden", "hidden");
    input.name = key;
    input.value = utms[key];
    form.appendChild(input);
  });

  const handleGHL = async () => {
    const body = {};
    const formData = new FormData();

    if (ghl.hasMida) {
      try {
        body[ghl.hasMida] = `${window.location.pathname} ${JSON.parse(localStorage.getItem("_abcache"))[0].test_id} ${JSON.parse(localStorage.getItem("_variant_result"))[JSON.parse(localStorage.getItem("_abcache"))[0].test_id].vaId}`;
      } catch (e) {
        console.error(e);
      }
    }

    if (ghl.hasTaboola) {
      body[ghl.hasTaboola] = urlParams.get("tbclid");
    }

    if (ghl.hasPath) {
      body[ghl.hasPath] = window.location.pathname;
    }

    if (hasPhoneNumber) {
      body.phone = (iti && iti.getNumber()) || "";
    }
    if (ghl.updateContactOnly) body.updateContactOnly = true;
    if (ghl.fields.includes("full_name")) body.full_name = form.querySelector("[name='first_name']").value;
    if (ghl.fields.includes("first_name")) body.first_name = form.querySelector("[name='first_name']").value;
    if (ghl.fields.includes("last_name")) body.last_name = form.querySelector("[name='last_name']").value;
    if (ghl.fields.includes("email")) body.email = form.querySelector("[name='email']").value;
    if (ghl.fields.includes("address")) body.address = form.querySelector("[name='address']")?.value || "";
    if (ghl.fields.includes("country")) body.country = form.querySelector("[name='country']")?.value || "";
    if (ghl.fields.includes("city")) body.city = form.querySelector("[name='city']")?.value || "";
    if (ghl.fields.includes("state")) body.state = form.querySelector("[name='state']")?.value || "";
    if (ghl.fields.includes("postal_code")) body.postal_code = form.querySelector("[name='postal_code']")?.value || "";
    if (ghl.fields.includes("organization")) body.organization = form.querySelector("[name='company']")?.value || "";
    if (ghl.fields.includes("website")) body.website = form.querySelector("[name='website']")?.value || "";
    if (ghl.fields.includes("terms_and_conditions")) {
      const termsFields = Array.from(document.querySelectorAll("[name='terms_and_conditions']"));
      if (termsFields.some((field) => field.checked)) {
        body.terms_and_conditions = "";
        termsFields.forEach((field) => {
          if (field.checked) body.terms_and_conditions = `${body.terms_and_conditions ? body.terms_and_conditions + "; " : ""}${field.parentElement.querySelector("[for='terms_and_conditions']").textContent}`;
        });
      }
    } else body.terms_and_conditions = ghl.terms_and_conditions || "I agree to terms & conditions provided by the company. By providing my phone number, I agree to receive text messages from the business.";
    ghl.customFields?.forEach((fieldPair) => {
      const fieldName = fieldPair[0];
      const fieldId = fieldPair[1];
      const fieldType = fieldPair[2];
      let field = form.querySelector(`[name='${fieldName}']`);
      if (fieldType == "file") {
        const allowedExt = ["doc", "docx", "txt", "pdf", "jpg", "jpeg", "png"];
        for (const file of field.files) {
          const ext = file.name.split(".").pop().toLowerCase();
          if (!allowedExt.includes(ext)) {
            alert("File type not supported.");
            throw new Error("File type not supported.");
          }
          formData.append(fieldId, file, file.name);
        }
        return;
      }
      if (field?.type === "radio") {
        field = form.querySelector(`[name='${fieldName}']:checked`);
      }
      if (fieldType == "group") {
        field = form.querySelector(`[name='${fieldName}']`);
        if (field?.type === "checkbox" && !field.checked) return;
        if (!body[fieldId]) body[fieldId] = [];
        body[fieldId].push(field?.value);
        return;
      }
      body[fieldId] = field?.value || "";
    });
    body.formId = ghl.formId;
    body.location_id = ghl.location_id;
    body.eventData = {};
    body.eventData.url_params = Object.fromEntries(urlParams.entries());
    body.eventData.campaign = urlParams.get("utm_campaign") || urlParams.get("gad_campaignid");
    body.eventData.page = {};
    body.eventData.page.url = window.location.href;
    body.eventData.page.title = document.title;
    formData.append("formData", JSON.stringify(body));
    formData.append("locationId", ghl.location_id);
    formData.append("formId", ghl.formId);

    try {
      const token = await grecaptcha.enterprise.execute(ghl.captchaToken, { action: "submit" });
      formData.append("captchaV3", token);
    } catch {
      return Promise.reject("GHL response was not ok");
    }
    const endpoint = ghl.isSurvey ? "https://backend.leadconnectorhq.com/surveys/submit" : "https://backend.leadconnectorhq.com/forms/submit";
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return Promise.reject("GHL response was not ok");
    }
    const data = await response.json();
    return data;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isPhoneValid()) {
      alert("Field invalid. Please check for typos.");
      return;
    }
    submitBtn.innerHTML = `
        <svg style="display:block;margin:auto;" width="24" height="24" stroke="#fff"
          viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <style>
            .spinner_V8m1 { transform-origin: center; animation: spinner_zKoa 2s linear infinite }
            .spinner_V8m1 circle { stroke-linecap: round; animation: spinner_YpZS 1.5s ease-in-out infinite }
            @keyframes spinner_zKoa { 100% { transform: rotate(360deg) } }
            @keyframes spinner_YpZS {
              0%           { stroke-dasharray: 0 150;  stroke-dashoffset: 0   }
              47.5%        { stroke-dasharray: 42 150; stroke-dashoffset: -16 }
              95%, 100%    { stroke-dasharray: 42 150; stroke-dashoffset: -59 }
            }
          </style>
          <g class="spinner_V8m1">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke-width="3"></circle>
          </g>
        </svg>
      `;
    submitBtn.setAttribute("disabled", "disabled");
    if (hasPhoneNumber && iti && phoneField.value.trim() !== "") {
      phoneField.value = iti.getNumber();
    }
    try {
      let ghlResponse;
      if (ghl.formId) ghlResponse = await handleGHL();
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "form-submitted" });
      window.dataLayer.push({ event: "form_submitted" });
      submitFunction({ ghlResponse });
    } catch (e) {
      submitBtn.innerHTML = "GET VIP ACCESS"
      console.error(e);
    }
  });
};