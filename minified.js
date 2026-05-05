const handleForm = ({
  formId,
  submitBtnId,
  hasPhoneNumber,
  phoneNumberIsRequired,
  phoneNumberIsExternal,
  emailIsExternal,
  advancedEmailCheck,
  klaviyo = { customTextFields: undefined, customCheckFields: undefined, forceChecksTrue: undefined, klaviyoA: undefined, klaviyoG: undefined },
  ghl = { formId: undefined, terms_and_conditions: undefined, location_id: undefined, isSurvey: undefined, captchaToken: undefined, updateContactOnly: undefined, fields: undefined, customFields: undefined, hasPath: undefined, hasMida: undefined, hasTaboola: undefined },
  hubspot = { endpoint: undefined },
  custom = { customFunc: undefined, hasCaptcha: undefined },
  submitFunction = () => {},
}) => {
  const trySentry = ({ error, message }) => {
    try {
      if (error) {
        Sentry.captureException(error);
      } else {
        const sentryError = new Error();
        sentryError.name = "Error";
        sentryError.message = message;
        Sentry.captureException(sentryError);
      }
    } catch (e) {
      console.error("Error loading sentry.");
    }
  };

  const getTopLevelDomain = () => {
    const fullDomain = window.location.hostname;
    const domainRegex = /\.([a-z]{2,})\.([a-z]{2,})$/;
    const match = fullDomain.match(domainRegex);
    if (match) {
      return `.${match[1]}.${match[2]}`;
    } else {
      return fullDomain;
    }
  };
  const cookieConfig = `path=/; domain=${getTopLevelDomain()};max-age=3600`;

  let iti;
  let phoneField;
  const submitBtn = document.getElementById(submitBtnId);
  const form = document.getElementById(formId);
  const urlParams = new URLSearchParams(window.location.search);
  const disableSubmitBtn = () => {
    submitBtn.setAttribute("disabled", "disabled");
    submitBtn.style.filter = "contrast(0.5)";
    submitBtn.style.cursor = "not-allowed";
  };
  if (!emailIsExternal && !phoneNumberIsExternal) disableSubmitBtn();
  const emailInvalid = () => {
    if (!advancedEmailCheck) return false;
    const email = form.querySelector("[name='email']").value;
    const tldTypos = [
      // Primary TLD typo variations
      ".con",
      ".cmo",
      ".cim",
      ".vom",
      ".xom",
      ".coom",
      ".comn",
      ".comm",
      ".com.",
      ".cok",
      ".col",
      ".cop",
      ".cpom",
      ".com,",
      ".com/",
      ".com\\",
      ".c0m",
      ".cocm",
      ".com-",
      ".com;",
      ".coim",
      ".com`",
      ".c.om",
      ".com/",

      // Shortened or incomplete TLDs
      ".cm",
      ".cpm",
      ".cn",
      ".cim",
      ".co",
      ".cim",
      ".cok",
      ".c9m",

      // Other TLD errors
      ".netw",
      ".net.",
      ".ne",
      ".nte",
      ".nett",
      ".net,",
      ".net/",
      ".net\\",
      ".org",
      ".orgg",
      ".ogr",
      ".org.",
      ".org,",
      ".org/",
      ".org\\",

      // Education TLDs
      ".edu.",
      ".ed.",
      ".edu,",
      ".edu/",
      ".edu\\",

      // Country code typos
      ".cm",
      ".om",
      ".cim",
      ".coim",
      ".coim.",
      ".coim,",
      ".coim/",
      ".coim\\",

      // Swap/adjacent key errors
      ".dom",
      ".fom",
      ".xom",
      ".vcom",
      ".bom",
      ".hom",
      ".ncom",
      ".moc",
      ".mcom",
      ".comc",
      ".cokn",
      ".vomm",
      ".copm",
      ".cma",
      ".ckm",
      ".colm",
      ".como",

      // Repeated/mistyped chars
      ".coom",
      ".coom.",
      ".coom,",
      ".coom/",
      ".coom\\",
      ".co.,",
      ".co./",
      ".co.\\",
      ".comm",
      ".comm.",
      ".comm,",
      ".comm/",
      ".comm\\",

      // Common domain typos (major email providers)
      "@gamil.com",
      "@gmai.com",
      "@gmaill.com",
      "@gnail.com",
      "@gmail.con",
      "@gmail,com",
      "@gmail.",
      "@gmail,",
      "@gmail\\",
      "@gmail/",
      "@gmail.co",
      "@gmail.cmo",
      "@gmai.com",
      "@gmail.ccm",
      "@gmail.cm",
      "@gmail.om",
      "@gmail.xom",
      "@gmal.com",
      "@gmial.com",
      "@g-mail.com",
      "@gmil.com",
      "@ygmail.com",

      "@hotmial.com",
      "@hotmal.com",
      "@hotmaill.com",
      "@htomail.com",
      "@hotmial.co",
      "@hotmal.co",
      "@hotmail.con",
      "@hotmail,com",
      "@hotmail.",
      "@hotmail,",
      "@hotmail\\",
      "@hotmail/",
      "@hotmail.co",
      "@hotmail.cmo",
      "@hotmai.com",

      "@outlok.com",
      "@outllok.com",
      "@outlok.co",
      "@outllook.com",
      "@outllok.com",
      "@outlook.con",
      "@outlook,com",
      "@outlook.",
      "@outlook,",
      "@outlook\\",
      "@outlook/",

      "@yahho.com",
      "@yaoo.com",
      "@yhoo.com",
      "@yaho.com",
      "@yahao.com",
      "@yahoo.co",
      "@yahho.co",
      "@yahoo.con",
      "@yahoo,com",
      "@yahoo.",
      "@yahoo,",
      "@yahoo\\",
      "@yahoo/",

      "@icloud.co.",
      "@icloud.con",
      "@icloud,com",
      "@iclod.com",
      "@icoud.com",
      "@ilcoud.com",
      "@icloid.com",
      "@icould.com",
      "@icloud.cm",
      "@icloud.om",
      "@icloud,com",
      "@icloud.",
      "@icloud,",
      "@icloud\\",

      "@msn.con",
      "@msn.cm",
      "@msn,com",
      "@msn.",
      "@msn,",
      "@msn\\",
      "@msn/",

      "@live.con",
      "@live.cm",
      "@live,com",
      "@live.",
      "@live,",
      "@live\\",
      "@live/",

      "@aol.con",
      "@aol.cm",
      "@aol,com",
      "@aol.",
      "@aol,",
      "@aol\\",
      "@aol/",

      "@protonnmail.com",
      "@prontonmail.com",
      "@protonmail.con",
      "@protonmail.cm",
      "@protonmail,com",
      "@protonmail.",
      "@protonmail,",
      "@protonmail\\",
      "@protonmail/",
      "@protonmail.co",

      "@pmail.con",
      "@pmail.cm",
      "@pmail,com",
      "@pmail.",
      "@pmail,",
      "@pmail\\",
      "@pmail/",

      "@gogle.com",
      "@gooogle.com",
      "@goggle.com",
      "@goole.com",
      "@googel.com",
      "@gogl.com",
      "@gogole.com",

      // Obvious keyboard errors or transposed letters
      ".cok",
      ".c0m",
      ".c9m",
      ".cpm",
      ".c0n",
      ".c,com",
      ".clom",
      ".ckom",

      // Slash/dot confusion and final chars
      ".com/",
      ".com\\",
      ".com.",
      ".com,",
      ".com;",
      ".com-",
      ".com_",
      ".com!",
      ".com?",
      ".com]",
      ".com[",
      ".com}",
      ".com{",

      "@gmail.clm",
      "@hmail.com",
      "@gmsil.com",
      "@yqhoo.com",
      "@gamil.com",
      "@gmil.com",
    ];
    return !/^(?!.*\.\.)([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,24}$/.test(email) || tldTypos.some((t) => email.toLowerCase().endsWith(t));
  };
  const emailField = form.querySelector("[name='email']");

  if (ghl.formId || custom.hasCaptcha) {
    const captchaScript = document.createElement("script");
    captchaScript.src = custom.hasCaptcha || `https://www.google.com/recaptcha/enterprise.js?render=${ghl.captchaToken}`;
    captchaScript.async = true;
    captchaScript.type = "text/javascript";

    const style = document.createElement("style");
    style.textContent = `
      .grecaptcha-badge{width:0 !important;height: 0!important}
    `;
    document.head.appendChild(style);
    document.head.append(captchaScript);
  }

  const handleEmailFocusOut = () => {
    if (emailInvalid()) {
      emailField.style.borderColor = "red";
      emailField.style.enter = "1px solid red";
      disableSubmitBtn();
    } else {
      emailField.style.borderColor = "";
      emailField.style.outline = "";
    }
  };

  const handleEnterKey = (alertMessage) => (e) => {
    if (e.key === "Enter" && submitBtn.hasAttribute("disabled")) {
      alert(alertMessage);
    }
  };

  if (hasPhoneNumber && !phoneNumberIsExternal) {
    phoneField = form.querySelector("[name='phone_number']");
    const phoneNumberIsNotValid = phoneNumberIsRequired ? () => !iti.isValidNumber() : () => phoneField.value.trim() !== "" && !iti.isValidNumber();
    iti = window.intlTelInput(phoneField, {
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/js/utils.js",
      autoPlaceholder: "aggressive",
      initialCountry: "auto",
      geoIpLookup: async (success, failure) => {
        try {
          const cookieCountry = document.cookie.split("user_country=")[1]?.split(";")[0];
          if (cookieCountry) {
            success(cookieCountry);
            return;
          }
          const response = await fetch("https://api.country.is/");
          const data = await response.json();
          if (response.ok && data.country) {
            document.cookie = `user_country=${data.country};${cookieConfig}`;
            success(data.country);
          } else {
            success("US");
            console.error("Failed to fetch country");
          }
        } catch (e) {
          success("US");
          console.warn(e);
        }
      },
    });

    const handleValidation = () => {
      if (phoneNumberIsNotValid() || emailInvalid()) {
        submitBtn.setAttribute("disabled", "disabled");
      } else {
        submitBtn.removeAttribute("disabled");
        phoneField.style = "";
        submitBtn.style = "";
      }
    };

    const handlePhoneFocusOut = () => {
      if (phoneNumberIsNotValid()) {
        phoneField.style.borderColor = "red";
        phoneField.style.outline = "1px solid red";
        disableSubmitBtn();
      } else {
        phoneField.style.borderColor = "";
        phoneField.style.outline = "";
      }
    };

    phoneField.addEventListener("input", handleValidation);
    emailField?.addEventListener("input", handleValidation);
    phoneField.addEventListener("focusout", handlePhoneFocusOut);
    emailField?.addEventListener("focusout", handleEmailFocusOut);
    form.addEventListener("keydown", handleEnterKey("Field invalid. Please check for typos."));
  } else {
    const handleEmailValidation = () => {
      if (emailInvalid()) {
        disableSubmitBtn();
      } else {
        submitBtn.removeAttribute("disabled");
        emailField.style = "";
        submitBtn.style = "";
      }
    };

    emailField?.addEventListener("input", handleEmailValidation);
    emailField?.addEventListener("focusout", handleEmailFocusOut);
    form.addEventListener("keydown", handleEnterKey("Email field invalid."));
  }

  const handleError = () => {
    const p = form.parentElement.querySelector(".w-form-done div");
    if (p) p.innerHTML = "Oops! Something went wrong while submitting the form.";
  };

  const formDone = form.parentElement.querySelector(".w-form-done");

  const initObserver = () => {
    const targetElement = formDone;
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.attributeName === "style") {
          const displayChanged = mutation.target.style.display !== mutation.oldValue;
          if (displayChanged) {
            submitFunction();
          }
        }
      }
    });
    observer.observe(targetElement, {
      attributes: true,
      attributeOldValue: true,
    });
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

  const handleKlaviyo = async (e) => {
    const formData = new FormData(e.target);
    if (hasPhoneNumber) {
      phoneField.value.trim() === "" ? formData.set("phone_number", "") : formData.set("phone_number", iti.getNumber());
      phoneField.value = iti.getNumber();
    }
    klaviyo.customTextFields = klaviyo.customTextFields || [];
    klaviyo.customCheckFields = klaviyo.customCheckFields || [];
    klaviyo.forceChecksTrue = klaviyo.forceChecksTrue || [];
    if (hasPhoneNumber && iti.getNumber().trim() !== "" && !document.querySelector("[name='sms-consent']")) {
      klaviyo.forceChecksTrue.push("sms-consent");
    }
    formData.append("$fields", ["accepts-marketing", ...klaviyo.customTextFields, ...klaviyo.customCheckFields, ...klaviyo.forceChecksTrue, ...Object.keys(utms)]);
    klaviyo.customCheckFields.forEach((checkFieldId) => {
      const field = document.getElementById(checkFieldId);
      formData.set(checkFieldId, field.checked ? true : false);
    });
    ["accepts-marketing", ...klaviyo.forceChecksTrue].forEach((checkFieldId) => {
      formData.set(checkFieldId, true);
    });

    const response = await fetch(`https://manage.kmail-lists.com/ajax/subscriptions/subscribe?a=${klaviyo.klaviyoA}&g=${klaviyo.klaviyoG}`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      return Promise.reject("Klaviyo Network response was not ok: " + response.statusText);
    }
    const data = await response.json();
    if (!data.success) return Promise.reject("Error sending to klaviyo: " + data.errors);
  };

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
      if (phoneNumberIsExternal) body.phone = form.querySelector("[name='phone_number']").value;
      else body.phone = iti.getNumber() || "";
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
        const ext = field.files[0].name.split(".").pop().toLowerCase();
        if (!allowedExt.includes(ext)) {
          alert("File type not supported.");
          throw new Error("File type not supported.");
        }
        formData.append(fieldId, field.files[0], field.files[0].name);
        return;
      }
      if (field?.type === "radio") {
        field = form.querySelector(`[name='${fieldName}']:checked`);
      }
      if (fieldType == "group") {
        field = form.querySelector(`[name='${fieldName}']`);
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

  const handleHubspot = async () => {
    const body = { properties: {} };
    body.properties.email = form.querySelector("[name='email']")?.value;
    body.properties.firstname = form.querySelector("[name='first_name']")?.value;
    if (hasPhoneNumber) body.properties.phone = iti.getNumber() || "";
    body.properties.message = form.querySelector("[name='message']")?.value;
    body.properties.fbclid = urlParams.get("fbclid");
    body.properties.gclid = urlParams.get("gclid");
    body.properties.urlParams = `${urlParams}`;

    const response = await fetch(hubspot.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return Promise.reject("Hubspot response was not ok");
    }
  };

  const handleCustom = async () => {
    const response = await custom.customFunc();
    if (!response.ok) {
      return Promise.reject("Custom function response was not ok");
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      let ghlResponse;
      const tasks = [];
      if (klaviyo.klaviyoA) tasks.push(handleKlaviyo(e));
      if (ghl.formId) tasks.push(handleGHL().then((r) => (ghlResponse = r)));
      if (hubspot.endpoint) tasks.push(handleHubspot());
      if (custom.customFunc) tasks.push(handleCustom());

      if (tasks.length) await Promise.all(tasks);

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "form-submitted",
      });
      window.dataLayer.push({
        event: "form_submitted",
      });
      if (formDone.style.display === "block") submitFunction({ ghlResponse });
      else if (tasks.length)
        setTimeout(() => {
          submitFunction({ ghlResponse });
        }, 6000);
      initObserver();
    } catch (e) {
      trySentry({ error: JSON.stringify(e) });
      handleError();
      console.error(e);
    }
  });
};
