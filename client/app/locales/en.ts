/**
 * Nested translation dictionary — use dotted keys like `settings.tabs.appearance`.
 * Never put display English into components; always `t("…")`.
 */
export const en = {
  app: {
    name: "Moon Tailors",
    legalName: "Moon Tailors & Matching Center",
    initial: "M",
    tagline: "Tailoring shop",
    copyright: "© {{year}} {{name}}. All rights reserved.",
  },
  common: {
    actions: {
      save: "Save",
      cancel: "Cancel",
      back: "Back",
      next: "Next",
      previous: "Previous",
      create: "Create",
      edit: "Change",
      delete: "Delete",
      close: "Close",
      confirm: "Confirm",
      loading: "Loading…",
      refresh: "Refresh",
      revoke: "Revoke",
      markAllRead: "Mark all read",
      open: "Open",
      search: "Search",
    },
    status: {
      success: "Success",
      error: "Error",
      empty: "Nothing here yet",
    },
  },
  auth: {
    logOut: "Log out",
    loggingOut: "Logging out…",
    signInContinue: "Sign in to open the shop",
    loginTitle: "Welcome",
    loginHint: "Type your email and password.",
    signIn: "Open the shop",
    signingIn: "Opening…",
    loginFailed: "Could not sign in. Check your email and password.",
  },
  env: {
    development: "Development",
    testing: "Testing",
    staging: "Staging",
    banner: "You are working in {{name}} — changes affect this environment only.",
    links: {
      hub: "Hub",
      website: "Website",
      scalar: "Scalar",
      docs: "Docs",
      api: "API",
    },
  },
  nav: {
    groups: {
      work: "Shop",
      account: "Account",
    },
    items: {
      dashboard: "Home",
      customers: "Customers",
      orders: "Orders",
      users: "Users",
      profile: "Profile",
      settings: "Settings",
    },
  },

 
 
  dashboard: {
    title: "Home",
    description: "Start here. Find a customer or check the orders.",
    loading: "Loading…",
    loadError: "Couldn’t load the shop numbers.",
    activity: "Recent work",
    updatedAt: "Updated {{time}}",
    howTo: "Do this, in order",
    findCustomer: "Find a customer",
    findCustomerHint: "Search by name or phone. Add them if they are new.",
    openCustomer: "Open the customer",
    openCustomerHint: "Check their usual measurements, then start a new order.",
    allOrders: "Follow the orders",
    allOrdersHint: "See every job: new, stitching, ready, or late.",
    glance: "At a glance",
  },
  customers: {
    title: "Customers",
    description: "Find someone by name or phone.",
    new: "Add customer",
    empty: "No customers yet. Add the first one.",
    loadFailed: "Couldn’t load customers",
    searchPlaceholder: "Name or phone",
    profile: "Customer",
    details: "1. Who they are",
    defaultMeasurements: "2. Usual measurements",
    orderHistory: "3. Their orders",
    startOrder: "Start a new order",
    create: "Create customer",
    createHint: "Name, phone, and usual measurements.",
    measurementsHint: "Saved as usual measurements for new orders.",
    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "Email",
    address: "Address",
    notes: "Notes",
  },
  orders: {
    title: "Orders",
    description: "Jobs in the shop.",
    new: "New order",
    newHint:
      "Fill the dates and money. Measurements start from the customer’s usual ones — change them for this order if you need to.",
    create: "Create order",
    measurementsHint:
      "Copied from the customer. Change them for this order only, or save them as usual.",
    replaceDefault: "Also save as usual measurements",
    empty: "No orders yet.",
    loadFailed: "Couldn’t load orders",
    searchPlaceholder: "Order number or notes",
    allStatuses: "Any status",
    view: "Open",
    profile: "Order",
    delayed: "Late",
    locked: "Finished — locked",
    detail: "This order’s measurements. Changing them does not change the customer’s usual measurements.",
    details: "Order details",
    orderMeasurements: "This order’s measurements",
    forceEdit: "Unlock and edit",
    forceEditConfirm:
      "This order is already delivered. Edit the old record anyway?",
    updateDefaults: "Save as usual measurements",
    updateDefaultsConfirm:
      "Use this order’s measurements as the customer’s usual ones from now on? Old orders stay as they were.",
    orderDate: "Order date",
    expectedCompletionDate: "Ready by",
    totalCost: "Total",
    paidAmount: "Paid",
    remainingAmount: "Still to pay",
    notes: "Notes",
    status: {
      new: "New",
      stitching: "Being stitched",
      stitched: "Stitched",
      ready: "Ready to collect",
      delivered: "Delivered",
    },
  },
  measurements: {
    title: "Measurements",
    empty: "No measurements yet.",
    garment: "Garment",
    notes: "Notes",
    length: "Length",
    chest: "Chest",
    waist: "Waist",
    hip: "Hip",
    shoulder: "Shoulder",
    sleeve: "Sleeve",
    neck: "Neck",
    armhole: "Armhole",
    cuff: "Cuff",
    trouserLength: "Trouser length",
    thigh: "Thigh",
    bottom: "Bottom",
  },


  settings: {
    title: "Settings",
    description: "Theme, language, and time formats.",
    tabs: {
      appearance: "Appearance",
      time: "Time",
    },
    appearance: {
      theme: "Theme",
      themeHint: "Choose light, dark, or follow the system.",
      language: "Language",
      languageHint: "UI language and text direction.",
      themeOptions: {
        light: "Light",
        dark: "Dark",
        system: "System",
      },
      languageOptions: {
        en: "English",
        ur: "Urdu",
      },
    },
    time: {
      dateFormat: "Date format",
      timeFormat: "Time format",
      preview: "Preview",
      timeOptions: {
        "12h": "12-hour",
        "24h": "24-hour",
      },
    },
    saved: "Settings saved",
    saveFailed: "Could not save settings",
  },

  profile: {
    title: "Profile",
    description: "Your name, email, age, gender, and password.",
    detailsTitle: "Your details",
    detailsDescription: "Only you can change this information.",
    passwordTitle: "Change password",
    passwordDescription: "Type your current password, then a new one.",
    saveDetails: "Save details",
    savePassword: "Change password",
    saved: "Profile saved",
    saveFailed: "Could not save profile",
    passwordSaved: "Password changed",
    passwordFailed: "Could not change password",
    mismatch: "New password and confirmation do not match",
  },

} as const;

/** Nested string dictionary shape (values may differ per locale). */
export type LocaleShape<T> = {
  [K in keyof T]: T[K] extends string ? string : LocaleShape<T[K]>;
};

export type EnDict = LocaleShape<typeof en>;
