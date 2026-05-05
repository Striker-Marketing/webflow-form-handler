# Webflow Form Handler

A drop-in script for Webflow forms that handles validation (email + international phone) and forwards submissions to Klaviyo, GHL (LeadConnector), HubSpot, and/or a custom function.

## Setup

Place the snippets in the page's footer, then call `handleForm(...)` with the options for the integrations you need. Each integration block (`klaviyo`, `ghl`, `hubspot`, `custom`) is optional — pass only the ones you use.

### If the form has a phone number

Add the `intl-tel-input` assets:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/css/intlTelInput.css" />
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/js/intlTelInput.min.js"></script>
<style>.iti { width: 100%; }</style>
```

The phone input must have `name="phone_number"`.

### Loading the handler

```html
<script src="https://cdn.jsdelivr.net/gh/Bucked-Up/webflow-form-handler@2/script.min.js"></script>
<script>
  handleForm({
    formId: "",
    submitBtnId: "",
    hasPhoneNumber: false,
    phoneNumberIsRequired: false,
    phoneNumberIsExternal: false, // skip intl-tel-input init (e.g. when another script owns the phone field)
    emailIsExternal: false,       // don't disable submit on load (email validated elsewhere)
    advancedEmailCheck: false,    // enable strict regex + TLD/typo blocklist
    submitFunction: ({ ghlResponse } = {}) => {}, // runs after success / when the Webflow done state appears
  });
</script>
```

## Top-level options

| Option | Description |
| --- | --- |
| `formId` | ID of the `<form>` element. |
| `submitBtnId` | ID of the submit button. The script disables/enables it based on validation. |
| `hasPhoneNumber` | If `true`, the form has a `[name='phone_number']` field handled by `intl-tel-input`. |
| `phoneNumberIsRequired` | If `true`, an empty phone number is invalid; otherwise empty is allowed. |
| `phoneNumberIsExternal` | If `true`, skip `intl-tel-input` setup (another script owns the field). |
| `emailIsExternal` | If `true`, don't disable the submit button on page load. |
| `advancedEmailCheck` | Enables strict email regex plus a built-in TLD/typo blocklist (e.g. `.con`, `gmial.com`). |
| `submitFunction` | Called after a successful submit (and when the Webflow `.w-form-done` element becomes visible). Receives `{ ghlResponse }`. |

## Klaviyo

```js
klaviyo: {
  klaviyoA: "",                 // list "a" param
  klaviyoG: "",                 // list "g" param
  customTextFields: [],         // names of extra text fields to forward
  customCheckFields: [],        // ids of extra checkbox fields (sent as true/false)
  forceChecksTrue: [],          // names that should be sent as true regardless of the form
}
```

Notes:
- `accepts-marketing` and any `forceChecksTrue` entries are always sent as `true`.
- If `hasPhoneNumber` is on and there is no `[name='sms-consent']` field, `sms-consent` is auto-added to `forceChecksTrue`.

## GHL (LeadConnector)

```js
ghl: {
  formId: "",
  location_id: "",
  captchaToken: "",            // reCAPTCHA Enterprise site key
  isSurvey: false,             // posts to /surveys/submit instead of /forms/submit
  updateContactOnly: false,    // sends updateContactOnly=true to GHL
  terms_and_conditions: "",    // override default consent string (used when no terms field is in the form)
  fields: [],                  // see "Standard fields" below
  customFields: [],            // see "Custom fields" below
  hasPath: "",                 // field id; sends the current pathname
  hasMida: "",                 // field id; sends Mida A/B test info from localStorage
  hasTaboola: "",              // field id; sends ?tbclid from the URL
}
```

### Standard fields

`fields` is an array of names that map directly to form inputs. Supported values:

`full_name` (read from `[name='first_name']`), `first_name`, `last_name`, `email`, `address`, `country`, `city`, `state`, `postal_code`, `organization` (read from `[name='company']`), `website`, `terms_and_conditions`.

Phone is handled automatically when `hasPhoneNumber` is `true` — don't add it here.

If `terms_and_conditions` is included and the form has one or more `[name='terms_and_conditions']` checkboxes, the submitted value joins the labels (`<label for="terms_and_conditions">`) of every checked box with `; `. Otherwise the `ghl.terms_and_conditions` string (or a default agreement string) is sent.

### Custom fields

`customFields` is an array of `[formFieldName, ghlFieldId, type?]` tuples. `type` is optional and accepts:

- `"file"` — uploads the file. Allowed extensions: `doc, docx, txt, pdf, jpg, jpeg, png`.
- `"group"` — collects checkbox group values into an array. Unchecked checkboxes are skipped.
- `"radio"` — picks the checked radio in the group.
- omitted — sends the field's `value` (or `""`).

```js
customFields: [
  ["message", "ghlFieldId"],
  ["resume", "ghlFieldId", "file"],
  ["interests", "ghlFieldId", "group"],
  ["plan", "ghlFieldId", "radio"],
]
```

## HubSpot

```js
hubspot: { endpoint: "" }
```

Posts `{ properties: { email, firstname, phone, message, fbclid, gclid, urlParams } }` to the given endpoint.

## Custom

```js
custom: {
  customFunc: async () => ({ ok: true }), // must resolve to a Response-like object with `.ok`
  hasCaptcha: "",                          // optional captcha script src to inject
}
```

Cannot be combined with `ghl` yet.

## Behavior notes

- All URL query params are appended to the form as hidden inputs before submission.
- On submit, all configured integrations run in parallel (`Promise.all`); a failure in any one rejects the submit.
- After success, `dataLayer` receives `{ event: "form-submitted" }` and `{ event: "form_submitted" }`.
- A user country is cached in the `user_country` cookie (1 hour) for `intl-tel-input`'s initial country.

## Aisle

```html
<script src="https://cdn.jsdelivr.net/gh/Bucked-Up/webflow-form-handler@1/aisle.min.js"></script>
<script>
  handleForm({
    campaignPhoneNumber: "",
    apiKey: "",
    submitBtnId: "",
    formId: "",
    klaviyoA: "",
    klaviyoG: "",
    submitFunction: () => {},
  });
</script>
```
