import { LanguageCode } from './languages';

export interface Translations {
  tabs: { expenses: string; settings: string };
  common: { back: string; save: string };
  splash: { title: string; tagline: string };
  add: {
    title: string;
    editTitle: string;
    tripTotal: string;
    date: string;
    category: string;
    paymentMethod: string;
    selectMethod: string;
    description: string;
    descriptionPlaceholder: string;
    save: string;
    saved: string;
    split: string;
    splitNotSplit: string;
    splitWith: string;
    splitLockedHint: string;
    deleteExpense: string;
  };
  manage: {
    title: string;
    tripTotal: string;
    expensesCount: string;
    emptyTitle: string;
    emptySubtitle: string;
    delete: string;
    deleteConfirmTitle: string;
    cancel: string;
    today: string;
    yesterday: string;
    vacation: string;
    amount: string;
    export: string;
    exportTitle: string;
    exportCsv: string;
    exportPdf: string;
    generatedOn: string;
    splitTotalsTitle: string;
    splitBadge: string;
  };
  companions: {
    me: string;
    unknown: string;
    title: string;
    hint: string;
    namePlaceholder: string;
    addButton: string;
    deleteConfirmTitle: string;
    inUseHint: string;
  };
  splitScreen: {
    title: string;
    totalLabel: string;
    assigned: string;
    autoHint: string;
    emptyCompanions: string;
    overAllocated: string;
  };
  categories: {
    Food: string;
    Transport: string;
    Lodging: string;
    Activities: string;
    Shopping: string;
    Groceries: string;
    Entertainment: string;
    Other: string;
  };
  paymentMethods: {
    cash: string;
    creditCard: string;
    debitCard: string;
    pickerTitle: string;
    addPlaceholder: string;
    addButton: string;
  };
  currency: { pickerTitle: string };
  settings: {
    title: string;
    subtitle: string;
    language: string;
    paymentMethods: string;
    paymentMethodsHint: string;
    defaultBadge: string;
    setAsDefault: string;
    enable: string;
    disable: string;
    deleteMethodConfirmTitle: string;
    support: string;
    buyMeCoffee: string;
    vacations: string;
    groupBy: string;
    groupByOptions: {
      date: string;
      paymentMethod: string;
      collaborators: string;
      category: string;
      currency: string;
    };
    exportCurrentView: string;
    exportToPdf: string;
    exportToCsv: string;
  };
  vacations: {
    pickerTitle: string;
    createNew: string;
    createTitle: string;
    editTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    defaultCurrency: string;
    defaultCurrencyHint: string;
    leadCurrency: string;
    leadCurrencyHint: string;
    leadCurrencyNone: string;
    deleteLink: string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: string;
    createButton: string;
    emptyTitle: string;
    emptySubtitle: string;
    emptyButton: string;
  };
  rates: {
    updated: string;
    refresh: string;
    loading: string;
    error: string;
    never: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    tabs: { expenses: 'Expenses', settings: 'Settings' },
    common: { back: 'Back', save: 'Save' },
    splash: { title: 'Vacation Expenses', tagline: 'Every trip, every currency' },
    add: {
      title: 'Add Expense',
      editTitle: 'Edit Expense',
      tripTotal: 'Trip total:',
      date: 'Date',
      category: 'Category',
      paymentMethod: 'Payment Method',
      selectMethod: 'Select a method',
      description: 'Description',
      descriptionPlaceholder: 'What did you spend on?',
      save: 'Add Expense',
      saved: 'Added ✓',
      split: 'Split',
      splitNotSplit: '-',
      splitWith: 'Split with:',
      splitLockedHint: "Split expense total can't be changed here — edit the split instead.",
      deleteExpense: 'Delete Expense',
    },
    manage: {
      title: 'Your Expenses',
      tripTotal: 'Trip total:',
      expensesCount: 'expenses',
      emptyTitle: 'No expenses yet.',
      emptySubtitle: "Tap \"Add Expense\" above to log your first one.",
      delete: 'Delete',
      deleteConfirmTitle: 'Delete expense?',
      cancel: 'Cancel',
      today: 'Today',
      yesterday: 'Yesterday',
      vacation: 'Vacation',
      amount: 'Amount',
      export: 'Export',
      exportTitle: 'Export Expenses',
      exportCsv: 'Export as CSV',
      exportPdf: 'Export as PDF',
      generatedOn: 'Generated on',
      splitTotalsTitle: 'Split totals',
      splitBadge: 'Split',
    },
    categories: {
      Food: 'Food',
      Transport: 'Transport',
      Lodging: 'Lodging',
      Activities: 'Activities',
      Shopping: 'Shopping',
      Groceries: 'Groceries',
      Entertainment: 'Entertainment',
      Other: 'Other',
    },
    paymentMethods: {
      cash: 'Cash',
      creditCard: 'Credit Card',
      debitCard: 'Debit Card',
      pickerTitle: 'Payment Method',
      addPlaceholder: 'Add new method (e.g. PayPal)',
      addButton: 'Add',
    },
    currency: { pickerTitle: 'Currency' },
    settings: {
      title: 'Settings',
      subtitle: 'Customize your app',
      language: 'Language',
      paymentMethods: 'Payment Methods',
      paymentMethodsHint:
        'Methods already used in an expense can only be disabled, not deleted.',
      defaultBadge: 'Default',
      setAsDefault: 'Set as default',
      enable: 'Enable',
      disable: 'Disable',
      deleteMethodConfirmTitle: 'Delete this payment method?',
      support: 'Support',
      buyMeCoffee: 'Buy me a Coffee',
      vacations: 'Vacations',
      groupBy: 'Group by',
      groupByOptions: { date: 'Date', paymentMethod: 'Payment method', collaborators: 'Collaborators', category: 'Category', currency: 'Currency' },
      exportCurrentView: 'Export current view',
      exportToPdf: 'To PDF',
      exportToCsv: 'To CSV',
    },
    vacations: {
      pickerTitle: 'Select Vacation',
      createNew: 'New Vacation',
      createTitle: 'New Vacation',
      editTitle: 'Edit Vacation',
      nameLabel: 'Vacation name',
      namePlaceholder: 'e.g. Trip to Paris 2026',
      defaultCurrency: 'Default Expenses Currency',
      defaultCurrencyHint: 'Used when adding a new expense to this vacation',
      leadCurrency: 'Show Totals Also In',
      leadCurrencyHint: 'Convert every expense and the vacation total into one currency',
      leadCurrencyNone: 'None',
      deleteLink: 'Delete Vacation',
      deleteConfirmTitle: 'Delete Vacation?',
      deleteConfirmMessage: 'This will also permanently delete all expenses in this vacation.',
      createButton: 'Create Vacation',
      emptyTitle: 'Create your first vacation\nto get started',
      emptySubtitle: 'and start keeping track of\nall your expenses in one place.',
      emptyButton: 'Create Vacation',
    },
    companions: {
      me: 'Me',
      unknown: 'Deleted companion',
      title: 'Travel Companions',
      hint: 'Add the people traveling with you to split expenses between you.',
      namePlaceholder: 'Companion name',
      addButton: 'Add',
      deleteConfirmTitle: 'Remove this companion?',
      inUseHint: 'Already used in a split — remove them from any splits first.',
    },
    splitScreen: {
      title: 'Split Expense',
      totalLabel: 'Total',
      assigned: 'Assigned',
      autoHint: 'Covers the rest automatically',
      emptyCompanions: 'Add travel companions in this vacation’s settings to split expenses.',
      overAllocated: 'Assigned shares add up to more than the total.',
    },
    rates: {
      updated: 'Rates updated',
      refresh: 'Refresh',
      loading: 'Updating rates…',
      error: "Couldn't fetch new rates. Showing last known rates.",
      never: 'Fetching exchange rates…',
    },
  },
  fr: {
    tabs: { expenses: 'Dépenses', settings: 'Réglages' },
    common: { back: 'Retour', save: 'Enregistrer' },
    splash: { title: 'Dépenses de séjour', tagline: 'Chaque voyage, chaque devise' },
    add: {
      title: 'Ajouter une dépense',
      editTitle: 'Modifier la dépense',
      tripTotal: 'Total du voyage :',
      date: 'Date',
      category: 'Catégorie',
      paymentMethod: 'Moyen de paiement',
      selectMethod: 'Choisir un moyen',
      description: 'Description',
      descriptionPlaceholder: 'Pour quoi avez-vous dépensé ?',
      save: 'Ajouter la dépense',
      saved: 'Ajouté ✓',
      split: 'Partager',
      splitNotSplit: '-',
      splitWith: 'Partagée avec :',
      splitLockedHint:
        "Le total d'une dépense partagée ne peut pas être modifié ici — modifiez le partage à la place.",
      deleteExpense: 'Supprimer la dépense',
    },
    manage: {
      title: 'Vos dépenses',
      tripTotal: 'Total du voyage :',
      expensesCount: 'dépenses',
      emptyTitle: "Aucune dépense pour l'instant.",
      emptySubtitle: 'Appuyez sur « Ajouter une dépense » ci-dessus pour enregistrer la première.',
      delete: 'Supprimer',
      deleteConfirmTitle: 'Supprimer cette dépense ?',
      cancel: 'Annuler',
      today: "Aujourd'hui",
      yesterday: 'Hier',
      vacation: 'Séjour',
      amount: 'Montant',
      export: 'Exporter',
      exportTitle: 'Exporter les dépenses',
      exportCsv: 'Exporter en CSV',
      exportPdf: 'Exporter en PDF',
      generatedOn: 'Généré le',
      splitTotalsTitle: 'Totaux partagés',
      splitBadge: 'Partagée',
    },
    categories: {
      Food: 'Nourriture',
      Transport: 'Transport',
      Lodging: 'Hébergement',
      Activities: 'Activités',
      Shopping: 'Shopping',
      Groceries: 'Courses',
      Entertainment: 'Divertissement',
      Other: 'Autre',
    },
    paymentMethods: {
      cash: 'Espèces',
      creditCard: 'Carte de crédit',
      debitCard: 'Carte de débit',
      pickerTitle: 'Moyen de paiement',
      addPlaceholder: 'Ajouter un moyen (ex. PayPal)',
      addButton: 'Ajouter',
    },
    currency: { pickerTitle: 'Devise' },
    settings: {
      title: 'Réglages',
      subtitle: 'Personnalisez votre application',
      language: 'Langue',
      paymentMethods: 'Moyens de paiement',
      paymentMethodsHint:
        'Un moyen déjà utilisé dans une dépense ne peut être que désactivé, pas supprimé.',
      defaultBadge: 'Par défaut',
      setAsDefault: 'Définir par défaut',
      enable: 'Activer',
      disable: 'Désactiver',
      deleteMethodConfirmTitle: 'Supprimer ce moyen de paiement ?',
      support: 'Soutien',
      buyMeCoffee: 'Offrez-moi un café',
      vacations: 'Séjours',
      groupBy: 'Grouper par',
      groupByOptions: { date: 'Date', paymentMethod: 'Moyen de paiement', collaborators: 'Compagnons', category: 'Catégorie', currency: 'Devise' },
      exportCurrentView: 'Exporter la vue actuelle',
      exportToPdf: 'Vers PDF',
      exportToCsv: 'Vers CSV',
    },
    vacations: {
      pickerTitle: 'Choisir un séjour',
      createNew: 'Nouveau séjour',
      createTitle: 'Nouveau séjour',
      editTitle: 'Modifier le séjour',
      nameLabel: 'Nom du séjour',
      namePlaceholder: 'ex. Voyage à Paris 2026',
      defaultCurrency: 'Devise par défaut des dépenses',
      defaultCurrencyHint: "Utilisée lors de l'ajout d'une dépense à ce séjour",
      leadCurrency: 'Afficher aussi les totaux en',
      leadCurrencyHint: 'Convertir chaque dépense et le total du séjour dans une seule devise',
      leadCurrencyNone: 'Aucune',
      deleteLink: 'Supprimer le séjour',
      deleteConfirmTitle: 'Supprimer le séjour ?',
      deleteConfirmMessage:
        'Cela supprimera également définitivement toutes les dépenses de ce séjour.',
      createButton: 'Créer le séjour',
      emptyTitle: 'Créez votre premier séjour pour commencer',
      emptySubtitle: 'et commencez à suivre toutes vos dépenses au même endroit.',
      emptyButton: 'Créer un séjour',
    },
    companions: {
      me: 'Moi',
      unknown: 'Compagnon supprimé',
      title: 'Compagnons de voyage',
      hint: 'Ajoutez les personnes qui voyagent avec vous pour partager les dépenses.',
      namePlaceholder: 'Nom du compagnon',
      addButton: 'Ajouter',
      deleteConfirmTitle: 'Retirer ce compagnon ?',
      inUseHint: 'Déjà utilisé dans un partage — retirez-le des partages d’abord.',
    },
    splitScreen: {
      title: 'Partager la dépense',
      totalLabel: 'Total',
      assigned: 'Attribué',
      autoHint: 'Couvre automatiquement le reste',
      emptyCompanions:
        'Ajoutez des compagnons de voyage dans les réglages de ce séjour pour partager des dépenses.',
      overAllocated: 'Les parts attribuées dépassent le total.',
    },
    rates: {
      updated: 'Taux mis à jour',
      refresh: 'Actualiser',
      loading: 'Mise à jour des taux…',
      error: 'Impossible de récupérer les taux. Affichage des derniers taux connus.',
      never: 'Récupération des taux de change…',
    },
  },
  de: {
    tabs: { expenses: 'Ausgaben', settings: 'Einstellungen' },
    common: { back: 'Zurück', save: 'Speichern' },
    splash: { title: 'Urlaubsausgaben', tagline: 'Jede Reise, jede Währung' },
    add: {
      title: 'Ausgabe hinzufügen',
      editTitle: 'Ausgabe bearbeiten',
      tripTotal: 'Reisesumme:',
      date: 'Datum',
      category: 'Kategorie',
      paymentMethod: 'Zahlungsmethode',
      selectMethod: 'Methode auswählen',
      description: 'Beschreibung',
      descriptionPlaceholder: 'Wofür hast du bezahlt?',
      save: 'Ausgabe hinzufügen',
      saved: 'Hinzugefügt ✓',
      split: 'Aufteilen',
      splitNotSplit: '-',
      splitWith: 'Aufgeteilt mit:',
      splitLockedHint:
        'Der Gesamtbetrag einer aufgeteilten Ausgabe kann hier nicht geändert werden — bearbeite stattdessen die Aufteilung.',
      deleteExpense: 'Ausgabe löschen',
    },
    manage: {
      title: 'Deine Ausgaben',
      tripTotal: 'Reisesumme:',
      expensesCount: 'Ausgaben',
      emptyTitle: 'Noch keine Ausgaben.',
      emptySubtitle: 'Tippe oben auf „Ausgabe hinzufügen“, um die erste einzutragen.',
      delete: 'Löschen',
      deleteConfirmTitle: 'Ausgabe löschen?',
      cancel: 'Abbrechen',
      today: 'Heute',
      yesterday: 'Gestern',
      vacation: 'Urlaub',
      amount: 'Betrag',
      export: 'Exportieren',
      exportTitle: 'Ausgaben exportieren',
      exportCsv: 'Als CSV exportieren',
      exportPdf: 'Als PDF exportieren',
      generatedOn: 'Erstellt am',
      splitTotalsTitle: 'Aufgeteilte Summen',
      splitBadge: 'Aufgeteilt',
    },
    categories: {
      Food: 'Essen',
      Transport: 'Transport',
      Lodging: 'Unterkunft',
      Activities: 'Aktivitäten',
      Shopping: 'Einkaufen',
      Groceries: 'Lebensmittel',
      Entertainment: 'Unterhaltung',
      Other: 'Sonstiges',
    },
    paymentMethods: {
      cash: 'Bargeld',
      creditCard: 'Kreditkarte',
      debitCard: 'Debitkarte',
      pickerTitle: 'Zahlungsmethode',
      addPlaceholder: 'Neue Methode hinzufügen (z. B. PayPal)',
      addButton: 'Hinzufügen',
    },
    currency: { pickerTitle: 'Währung' },
    settings: {
      title: 'Einstellungen',
      subtitle: 'Passe deine App an',
      language: 'Sprache',
      paymentMethods: 'Zahlungsmethoden',
      paymentMethodsHint:
        'Bereits verwendete Methoden können nur deaktiviert, nicht gelöscht werden.',
      defaultBadge: 'Standard',
      setAsDefault: 'Als Standard festlegen',
      enable: 'Aktivieren',
      disable: 'Deaktivieren',
      deleteMethodConfirmTitle: 'Diese Zahlungsmethode löschen?',
      support: 'Unterstützung',
      buyMeCoffee: 'Spendier mir einen Kaffee',
      vacations: 'Urlaube',
      groupBy: 'Gruppieren nach',
      groupByOptions: { date: 'Datum', paymentMethod: 'Zahlungsmethode', collaborators: 'Reisebegleiter', category: 'Kategorie', currency: 'Währung' },
      exportCurrentView: 'Aktuelle Ansicht exportieren',
      exportToPdf: 'Als PDF',
      exportToCsv: 'Als CSV',
    },
    vacations: {
      pickerTitle: 'Urlaub auswählen',
      createNew: 'Neuer Urlaub',
      createTitle: 'Neuer Urlaub',
      editTitle: 'Urlaub bearbeiten',
      nameLabel: 'Urlaubsname',
      namePlaceholder: 'z. B. Reise nach Paris 2026',
      defaultCurrency: 'Standardwährung für Ausgaben',
      defaultCurrencyHint: 'Wird beim Hinzufügen einer Ausgabe zu diesem Urlaub verwendet',
      leadCurrency: 'Summen zusätzlich anzeigen in',
      leadCurrencyHint: 'Jede Ausgabe und die Urlaubssumme in eine Währung umrechnen',
      leadCurrencyNone: 'Keine',
      deleteLink: 'Urlaub löschen',
      deleteConfirmTitle: 'Urlaub löschen?',
      deleteConfirmMessage:
        'Dadurch werden auch alle Ausgaben dieses Urlaubs endgültig gelöscht.',
      createButton: 'Urlaub erstellen',
      emptyTitle: 'Erstelle deinen ersten Urlaub, um loszulegen',
      emptySubtitle: 'und alle deine Ausgaben an einem Ort im Blick zu behalten.',
      emptyButton: 'Urlaub erstellen',
    },
    companions: {
      me: 'Ich',
      unknown: 'Gelöschter Begleiter',
      title: 'Reisebegleiter',
      hint: 'Füge die Personen hinzu, die mit dir reisen, um Ausgaben aufzuteilen.',
      namePlaceholder: 'Name des Begleiters',
      addButton: 'Hinzufügen',
      deleteConfirmTitle: 'Diesen Begleiter entfernen?',
      inUseHint: 'Bereits in einer Aufteilung verwendet — zuerst dort entfernen.',
    },
    splitScreen: {
      title: 'Ausgabe aufteilen',
      totalLabel: 'Gesamt',
      assigned: 'Zugewiesen',
      autoHint: 'Deckt den Rest automatisch ab',
      emptyCompanions:
        'Füge in den Einstellungen dieses Urlaubs Reisebegleiter hinzu, um Ausgaben aufzuteilen.',
      overAllocated: 'Die zugewiesenen Anteile übersteigen die Gesamtsumme.',
    },
    rates: {
      updated: 'Kurse aktualisiert',
      refresh: 'Aktualisieren',
      loading: 'Kurse werden aktualisiert…',
      error: 'Kurse konnten nicht abgerufen werden. Letzte bekannte Kurse werden angezeigt.',
      never: 'Wechselkurse werden abgerufen…',
    },
  },
  es: {
    tabs: { expenses: 'Gastos', settings: 'Ajustes' },
    common: { back: 'Atrás', save: 'Guardar' },
    splash: { title: 'Gastos de viaje', tagline: 'Cada viaje, cada moneda' },
    add: {
      title: 'Añadir gasto',
      editTitle: 'Editar gasto',
      tripTotal: 'Total del viaje:',
      date: 'Fecha',
      category: 'Categoría',
      paymentMethod: 'Método de pago',
      selectMethod: 'Selecciona un método',
      description: 'Descripción',
      descriptionPlaceholder: '¿En qué gastaste?',
      save: 'Añadir gasto',
      saved: 'Añadido ✓',
      split: 'Dividir',
      splitNotSplit: '-',
      splitWith: 'Dividido con:',
      splitLockedHint:
        'El total de un gasto dividido no se puede cambiar aquí — edita la división en su lugar.',
      deleteExpense: 'Eliminar gasto',
    },
    manage: {
      title: 'Tus gastos',
      tripTotal: 'Total del viaje:',
      expensesCount: 'gastos',
      emptyTitle: 'Aún no hay gastos.',
      emptySubtitle: 'Toca "Añadir gasto" arriba para registrar el primero.',
      delete: 'Eliminar',
      deleteConfirmTitle: '¿Eliminar gasto?',
      cancel: 'Cancelar',
      today: 'Hoy',
      yesterday: 'Ayer',
      vacation: 'Viaje',
      amount: 'Importe',
      export: 'Exportar',
      exportTitle: 'Exportar gastos',
      exportCsv: 'Exportar como CSV',
      exportPdf: 'Exportar como PDF',
      generatedOn: 'Generado el',
      splitTotalsTitle: 'Totales divididos',
      splitBadge: 'Dividido',
    },
    categories: {
      Food: 'Comida',
      Transport: 'Transporte',
      Lodging: 'Alojamiento',
      Activities: 'Actividades',
      Shopping: 'Compras',
      Groceries: 'Supermercado',
      Entertainment: 'Entretenimiento',
      Other: 'Otro',
    },
    paymentMethods: {
      cash: 'Efectivo',
      creditCard: 'Tarjeta de crédito',
      debitCard: 'Tarjeta de débito',
      pickerTitle: 'Método de pago',
      addPlaceholder: 'Añadir método (p. ej. PayPal)',
      addButton: 'Añadir',
    },
    currency: { pickerTitle: 'Moneda' },
    settings: {
      title: 'Ajustes',
      subtitle: 'Personaliza tu app',
      language: 'Idioma',
      paymentMethods: 'Métodos de pago',
      paymentMethodsHint:
        'Los métodos ya usados en un gasto solo se pueden desactivar, no eliminar.',
      defaultBadge: 'Predeterminado',
      setAsDefault: 'Establecer predeterminado',
      enable: 'Activar',
      disable: 'Desactivar',
      deleteMethodConfirmTitle: '¿Eliminar este método de pago?',
      support: 'Apoyo',
      buyMeCoffee: 'Invítame a un café',
      vacations: 'Viajes',
      groupBy: 'Agrupar por',
      groupByOptions: { date: 'Fecha', paymentMethod: 'Método de pago', collaborators: 'Compañeros', category: 'Categoría', currency: 'Moneda' },
      exportCurrentView: 'Exportar vista actual',
      exportToPdf: 'A PDF',
      exportToCsv: 'A CSV',
    },
    vacations: {
      pickerTitle: 'Seleccionar viaje',
      createNew: 'Nuevo viaje',
      createTitle: 'Nuevo viaje',
      editTitle: 'Editar viaje',
      nameLabel: 'Nombre del viaje',
      namePlaceholder: 'p. ej. Viaje a París 2026',
      defaultCurrency: 'Moneda predeterminada de gastos',
      defaultCurrencyHint: 'Se usa al añadir un gasto a este viaje',
      leadCurrency: 'Mostrar también los totales en',
      leadCurrencyHint: 'Convertir cada gasto y el total del viaje a una sola moneda',
      leadCurrencyNone: 'Ninguna',
      deleteLink: 'Eliminar viaje',
      deleteConfirmTitle: '¿Eliminar viaje?',
      deleteConfirmMessage: 'Esto también eliminará permanentemente todos los gastos de este viaje.',
      createButton: 'Crear viaje',
      emptyTitle: 'Crea tu primer viaje para empezar',
      emptySubtitle: 'y empieza a llevar el control de todos tus gastos en un solo lugar.',
      emptyButton: 'Crear viaje',
    },
    companions: {
      me: 'Yo',
      unknown: 'Acompañante eliminado',
      title: 'Compañeros de viaje',
      hint: 'Añade a las personas que viajan contigo para dividir los gastos.',
      namePlaceholder: 'Nombre del compañero',
      addButton: 'Añadir',
      deleteConfirmTitle: '¿Quitar a este compañero?',
      inUseHint: 'Ya está en una división — quítalo de las divisiones primero.',
    },
    splitScreen: {
      title: 'Dividir gasto',
      totalLabel: 'Total',
      assigned: 'Asignado',
      autoHint: 'Cubre el resto automáticamente',
      emptyCompanions:
        'Añade compañeros de viaje en los ajustes de este viaje para dividir gastos.',
      overAllocated: 'Las partes asignadas superan el total.',
    },
    rates: {
      updated: 'Tasas actualizadas',
      refresh: 'Actualizar',
      loading: 'Actualizando tasas…',
      error: 'No se pudieron obtener las tasas. Mostrando las últimas conocidas.',
      never: 'Obteniendo tasas de cambio…',
    },
  },
  he: {
    tabs: { expenses: 'הוצאות', settings: 'הגדרות' },
    common: { back: 'חזרה', save: 'שמירה' },
    splash: { title: 'הוצאות חופשה', tagline: 'כל טיול, כל מטבע' },
    add: {
      title: 'הוספת הוצאה',
      editTitle: 'עריכת הוצאה',
      tripTotal: 'סך הכול לטיול:',
      date: 'תאריך',
      category: 'קטגוריה',
      paymentMethod: 'אמצעי תשלום',
      selectMethod: 'בחרו אמצעי תשלום',
      description: 'תיאור',
      descriptionPlaceholder: 'על מה הוצאת?',
      save: 'הוספת הוצאה',
      saved: 'נוסף ✓',
      split: 'פיצול',
      splitNotSplit: '-',
      splitWith: 'מפוצלת עם:',
      splitLockedHint: 'לא ניתן לשנות כאן את סכום ההוצאה המפוצלת — יש לערוך את הפיצול במקום זאת.',
      deleteExpense: 'מחיקת הוצאה',
    },
    manage: {
      title: 'ההוצאות שלך',
      tripTotal: 'סך הכול לטיול:',
      expensesCount: 'הוצאות',
      emptyTitle: 'אין עדיין הוצאות.',
      emptySubtitle: 'הקישו על "הוספת הוצאה" למעלה כדי לרשום את הראשונה.',
      delete: 'מחיקה',
      deleteConfirmTitle: 'למחוק את ההוצאה?',
      cancel: 'ביטול',
      today: 'היום',
      yesterday: 'אתמול',
      vacation: 'חופשה',
      amount: 'סכום',
      export: 'ייצוא',
      exportTitle: 'ייצוא הוצאות',
      exportCsv: 'ייצוא כ-CSV',
      exportPdf: 'ייצוא כ-PDF',
      generatedOn: 'הופק בתאריך',
      splitTotalsTitle: 'סיכומי פיצול',
      splitBadge: 'מפוצלת',
    },
    categories: {
      Food: 'אוכל',
      Transport: 'תחבורה',
      Lodging: 'לינה',
      Activities: 'פעילויות',
      Shopping: 'קניות',
      Groceries: 'מכולת',
      Entertainment: 'בידור',
      Other: 'אחר',
    },
    paymentMethods: {
      cash: 'מזומן',
      creditCard: 'כרטיס אשראי',
      debitCard: 'כרטיס חיוב',
      pickerTitle: 'אמצעי תשלום',
      addPlaceholder: 'הוספת אמצעי (למשל PayPal)',
      addButton: 'הוספה',
    },
    currency: { pickerTitle: 'מטבע' },
    settings: {
      title: 'הגדרות',
      subtitle: 'התאימו אישית את האפליקציה',
      language: 'שפה',
      paymentMethods: 'אמצעי תשלום',
      paymentMethodsHint:
        'אמצעי ששימש כבר בהוצאה ניתן רק להשבית, לא למחוק.',
      defaultBadge: 'ברירת מחדל',
      setAsDefault: 'הגדרה כברירת מחדל',
      enable: 'הפעלה',
      disable: 'השבתה',
      deleteMethodConfirmTitle: 'למחוק את אמצעי התשלום הזה?',
      support: 'תמיכה',
      buyMeCoffee: 'קנו לי קפה',
      vacations: 'חופשות',
      groupBy: 'קיבוץ לפי',
      groupByOptions: { date: 'תאריך', paymentMethod: 'אמצעי תשלום', collaborators: 'מלווים', category: 'קטגוריה', currency: 'מטבע' },
      exportCurrentView: 'ייצוא התצוגה הנוכחית',
      exportToPdf: 'ל-PDF',
      exportToCsv: 'ל-CSV',
    },
    vacations: {
      pickerTitle: 'בחירת חופשה',
      createNew: 'חופשה חדשה',
      createTitle: 'חופשה חדשה',
      editTitle: 'עריכת חופשה',
      nameLabel: 'שם החופשה',
      namePlaceholder: 'לדוגמה: טיול לפריז 2026',
      defaultCurrency: 'מטבע ברירת מחדל להוצאות',
      defaultCurrencyHint: 'בשימוש בעת הוספת הוצאה לחופשה זו',
      leadCurrency: 'הצגת הסכומים גם במטבע',
      leadCurrencyHint: 'המרת כל הוצאה וסך החופשה למטבע אחד',
      leadCurrencyNone: 'ללא',
      deleteLink: 'מחיקת חופשה',
      deleteConfirmTitle: 'למחוק את החופשה?',
      deleteConfirmMessage: 'פעולה זו תמחק לצמיתות גם את כל ההוצאות בחופשה זו.',
      createButton: 'יצירת חופשה',
      emptyTitle: 'צרו חופשה ראשונה כדי להתחיל',
      emptySubtitle: 'והתחילו לעקוב אחרי כל ההוצאות שלכם במקום אחד.',
      emptyButton: 'יצירת חופשה',
    },
    companions: {
      me: 'אני',
      unknown: 'מלווה שנמחק',
      title: 'מלווים בטיול',
      hint: 'הוסיפו את האנשים שנוסעים איתכם כדי לפצל הוצאות ביניכם.',
      namePlaceholder: 'שם המלווה',
      addButton: 'הוספה',
      deleteConfirmTitle: 'להסיר את המלווה הזה?',
      inUseHint: 'כבר בשימוש בפיצול — יש להסיר אותו מהפיצולים תחילה.',
    },
    splitScreen: {
      title: 'פיצול הוצאה',
      totalLabel: 'סך הכול',
      assigned: 'הוקצו',
      autoHint: 'מכסה את השאר באופן אוטומטי',
      emptyCompanions: 'הוסיפו מלווים בהגדרות החופשה כדי לפצל הוצאות.',
      overAllocated: 'סכום החלקים שהוקצו גבוה מסך ההוצאה.',
    },
    rates: {
      updated: 'שערים עודכנו',
      refresh: 'רענון',
      loading: 'מעדכן שערים…',
      error: 'לא ניתן היה לעדכן שערים. מוצגים השערים האחרונים הידועים.',
      never: 'טוען שערי חליפין…',
    },
  },
};
