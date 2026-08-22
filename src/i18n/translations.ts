import { LanguageCode } from './languages';

export interface Translations {
  tabs: { expenses: string; settings: string };
  common: { back: string; save: string; done: string; close: string; previous: string; next: string };
  splash: { title: string; tagline: string };
  add: {
    title: string;
    editTitle: string;
    tripTotal: string;
    date: string;
    category: string;
    paymentMethod: string;
    selectMethod: string;
    moreMethods: string;
    description: string;
    descriptionPlaceholder: string;
    save: string;
    saved: string;
    split: string;
    splitNotSplit: string;
    splitWith: string;
    splitLockedHint: string;
    deleteExpense: string;
    excludeFromStatistics: string;
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
    of: string;
    statistics: string;
    dailyAverage: string;
    days: string;
    distribution: string;
    noStatistics: string;
    statisticsGroups: { category: string; paymentMethod: string; collaborators: string; currency: string };
    expensesOverTime: string;
    statisticsPeriods: { '7': string; '14': string; all: string };
    statisticsExcluded: string;
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
    currenciesLabel: string;
    currenciesHint: string;
    setAsDefaultLabel: string;
    defaultBadgeLabel: string;
    cannotRemoveLastCurrency: string;
    cannotRemoveCurrencyInUse: string;
    leadCurrency: string;
    leadCurrencyHint: string;
    leadCurrencyNone: string;
    autoRateLabel: string;
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
    common: { back: 'Back', save: 'Save', done: 'Done', close: 'Close', previous: 'Previous', next: 'Next' },
    splash: { title: 'Vacation Expenses', tagline: 'Every vacation, every expense, every currency' },
    add: {
      title: 'Add Expense',
      editTitle: 'Edit Expense',
      tripTotal: 'Trip total:',
      date: 'Date',
      category: 'Category',
      paymentMethod: 'Payment Method',
      selectMethod: 'Select a method',
      moreMethods: 'More',
      description: 'Description',
      descriptionPlaceholder: 'What did you spend on?',
      save: 'Add Expense',
      saved: 'Added ✓',
      split: 'Split',
      splitNotSplit: 'No split',
      splitWith: 'Split with:',
      splitLockedHint: "Split expense total can't be changed here — edit the split instead.",
      deleteExpense: 'Delete Expense',
      excludeFromStatistics: 'Exclude from statistics',
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
      of: 'of',
      statistics: 'Statistics',
      dailyAverage: 'Daily average', days: 'days', distribution: 'Expense distribution', noStatistics: 'No expense data yet.',
      statisticsGroups: { category: 'Category', paymentMethod: 'Payment method', collaborators: 'Collaborators', currency: 'Currency' },
      expensesOverTime: 'Expenses over the last days', statisticsPeriods: { '7': '7 days', '14': '14 days', all: 'All' },
      statisticsExcluded: 'Excluded from statistics',
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
      currenciesLabel: 'Trip Currencies',
      currenciesHint: 'Currencies you’ll log expenses in for this vacation',
      setAsDefaultLabel: 'Set as default',
      defaultBadgeLabel: 'Default',
      cannotRemoveLastCurrency: 'A vacation needs at least one currency',
      cannotRemoveCurrencyInUse: 'This currency is used by an expense and can’t be removed',
      leadCurrency: 'Show Totals Also In',
      leadCurrencyHint: 'Convert every expense and the vacation total into one currency',
      leadCurrencyNone: 'None',
      autoRateLabel: 'Auto',
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
      inUseHint: 'for removal, first remove from splits.',
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
    common: { back: 'Retour', save: 'Enregistrer', done: 'Terminé', close: 'Fermer', previous: 'Précédent', next: 'Suivant' },
    splash: { title: 'Dépenses de séjour', tagline: 'Chaque séjour, chaque dépense, chaque devise' },
    add: {
      title: 'Ajouter une dépense',
      editTitle: 'Modifier la dépense',
      tripTotal: 'Total du voyage :',
      date: 'Date',
      category: 'Catégorie',
      paymentMethod: 'Moyen de paiement',
      selectMethod: 'Choisir un moyen',
      moreMethods: 'Plus',
      description: 'Description',
      descriptionPlaceholder: 'Pour quoi avez-vous dépensé ?',
      save: 'Ajouter la dépense',
      saved: 'Ajouté ✓',
      split: 'Partager',
      splitNotSplit: 'Pas de partage',
      splitWith: 'Partagée avec :',
      splitLockedHint:
        "Le total d'une dépense partagée ne peut pas être modifié ici — modifiez le partage à la place.",
      deleteExpense: 'Supprimer la dépense',
      excludeFromStatistics: 'Exclure des statistiques',
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
      of: 'sur',
      statistics: 'Statistiques',
      dailyAverage: 'Moyenne quotidienne', days: 'jours', distribution: 'Répartition des dépenses', noStatistics: 'Aucune donnée de dépense.',
      statisticsGroups: { category: 'Catégorie', paymentMethod: 'Paiement', collaborators: 'Participants', currency: 'Devise' },
      expensesOverTime: 'Dépenses des derniers jours', statisticsPeriods: { '7': '7 jours', '14': '14 jours', all: 'Tout' },
      statisticsExcluded: 'Exclu des statistiques',
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
      currenciesLabel: 'Devises du séjour',
      currenciesHint: 'Devises utilisées pour les dépenses de ce séjour',
      setAsDefaultLabel: 'Définir par défaut',
      defaultBadgeLabel: 'Par défaut',
      cannotRemoveLastCurrency: 'Un séjour doit avoir au moins une devise',
      cannotRemoveCurrencyInUse: 'Cette devise est utilisée par une dépense et ne peut pas être supprimée',
      leadCurrency: 'Afficher aussi les totaux en',
      leadCurrencyHint: 'Convertir chaque dépense et le total du séjour dans une seule devise',
      leadCurrencyNone: 'Aucune',
      autoRateLabel: 'Auto',
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
      inUseHint: 'Pour le supprimer, retirez-le d’abord des partages.',
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
    common: { back: 'Zurück', save: 'Speichern', done: 'Fertig', close: 'Schließen', previous: 'Zurück', next: 'Weiter' },
    splash: { title: 'Urlaubsausgaben', tagline: 'Jeder Urlaub, jede Ausgabe, jede Währung' },
    add: {
      title: 'Ausgabe hinzufügen',
      editTitle: 'Ausgabe bearbeiten',
      tripTotal: 'Reisesumme:',
      date: 'Datum',
      category: 'Kategorie',
      paymentMethod: 'Zahlungsmethode',
      selectMethod: 'Methode auswählen',
      moreMethods: 'Mehr',
      description: 'Beschreibung',
      descriptionPlaceholder: 'Wofür hast du bezahlt?',
      save: 'Ausgabe hinzufügen',
      saved: 'Hinzugefügt ✓',
      split: 'Aufteilen',
      splitNotSplit: 'Keine Aufteilung',
      splitWith: 'Aufgeteilt mit:',
      splitLockedHint:
        'Der Gesamtbetrag einer aufgeteilten Ausgabe kann hier nicht geändert werden — bearbeite stattdessen die Aufteilung.',
      deleteExpense: 'Ausgabe löschen',
      excludeFromStatistics: 'Aus Statistiken ausschließen',
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
      of: 'von',
      statistics: 'Statistiken',
      dailyAverage: 'Tagesdurchschnitt', days: 'Tage', distribution: 'Ausgabenverteilung', noStatistics: 'Noch keine Ausgabendaten.',
      statisticsGroups: { category: 'Kategorie', paymentMethod: 'Zahlungsart', collaborators: 'Mitreisende', currency: 'Währung' },
      expensesOverTime: 'Ausgaben der letzten Tage', statisticsPeriods: { '7': '7 Tage', '14': '14 Tage', all: 'Alle' },
      statisticsExcluded: 'Von der Statistik ausgeschlossen',
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
      currenciesLabel: 'Reisewährungen',
      currenciesHint: 'Währungen, in denen du Ausgaben für diesen Urlaub erfasst',
      setAsDefaultLabel: 'Als Standard festlegen',
      defaultBadgeLabel: 'Standard',
      cannotRemoveLastCurrency: 'Ein Urlaub benötigt mindestens eine Währung',
      cannotRemoveCurrencyInUse: 'Diese Währung wird von einer Ausgabe verwendet und kann nicht entfernt werden',
      leadCurrency: 'Summen zusätzlich anzeigen in',
      leadCurrencyHint: 'Jede Ausgabe und die Urlaubssumme in eine Währung umrechnen',
      leadCurrencyNone: 'Keine',
      autoRateLabel: 'Auto',
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
      inUseHint: 'Zum Entfernen zuerst aus den Aufteilungen entfernen.',
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
    common: { back: 'Atrás', save: 'Guardar', done: 'Listo', close: 'Cerrar', previous: 'Anterior', next: 'Siguiente' },
    splash: { title: 'Gastos de viaje', tagline: 'Cada viaje, cada gasto, cada moneda' },
    add: {
      title: 'Añadir gasto',
      editTitle: 'Editar gasto',
      tripTotal: 'Total del viaje:',
      date: 'Fecha',
      category: 'Categoría',
      paymentMethod: 'Método de pago',
      selectMethod: 'Selecciona un método',
      moreMethods: 'Más',
      description: 'Descripción',
      descriptionPlaceholder: '¿En qué gastaste?',
      save: 'Añadir gasto',
      saved: 'Añadido ✓',
      split: 'Dividir',
      splitNotSplit: 'Sin división',
      splitWith: 'Dividido con:',
      splitLockedHint:
        'El total de un gasto dividido no se puede cambiar aquí — edita la división en su lugar.',
      deleteExpense: 'Eliminar gasto',
      excludeFromStatistics: 'Excluir de las estadísticas',
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
      of: 'de',
      statistics: 'Estadísticas',
      dailyAverage: 'Promedio diario', days: 'días', distribution: 'Distribución de gastos', noStatistics: 'Aún no hay datos de gastos.',
      statisticsGroups: { category: 'Categoría', paymentMethod: 'Método de pago', collaborators: 'Colaboradores', currency: 'Moneda' },
      expensesOverTime: 'Gastos de los últimos días', statisticsPeriods: { '7': '7 días', '14': '14 días', all: 'Todo' },
      statisticsExcluded: 'Excluido de las estadísticas',
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
      currenciesLabel: 'Monedas del viaje',
      currenciesHint: 'Monedas en las que registrarás los gastos de este viaje',
      setAsDefaultLabel: 'Establecer como predeterminada',
      defaultBadgeLabel: 'Predeterminada',
      cannotRemoveLastCurrency: 'Un viaje necesita al menos una moneda',
      cannotRemoveCurrencyInUse: 'Esta moneda está en uso por un gasto y no se puede eliminar',
      leadCurrency: 'Mostrar también los totales en',
      leadCurrencyHint: 'Convertir cada gasto y el total del viaje a una sola moneda',
      leadCurrencyNone: 'Ninguna',
      autoRateLabel: 'Auto',
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
      inUseHint: 'Para eliminarlo, primero quítalo de las divisiones.',
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
    common: { back: 'חזרה', save: 'שמירה', done: 'סיום', close: 'סגירה', previous: 'הקודם', next: 'הבא' },
    splash: { title: 'הוצאות חופשה', tagline: 'כל חופשה, כל הוצאה, כל מטבע' },
    add: {
      title: 'הוספת הוצאה',
      editTitle: 'עריכת הוצאה',
      tripTotal: 'סך הכול לטיול:',
      date: 'תאריך',
      category: 'קטגוריה',
      paymentMethod: 'אמצעי תשלום',
      selectMethod: 'בחרו אמצעי תשלום',
      moreMethods: 'עוד',
      description: 'תיאור',
      descriptionPlaceholder: 'על מה הוצאת?',
      save: 'הוספת הוצאה',
      saved: 'נוסף ✓',
      split: 'פיצול',
      splitNotSplit: 'ללא פיצול',
      splitWith: 'מפוצלת עם:',
      splitLockedHint: 'לא ניתן לשנות כאן את סכום ההוצאה המפוצלת — יש לערוך את הפיצול במקום זאת.',
      deleteExpense: 'מחיקת הוצאה',
      excludeFromStatistics: 'החרגה מהסטטיסטיקה',
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
      of: 'מתוך',
      statistics: 'סטטיסטיקה',
      dailyAverage: 'ממוצע יומי', days: 'ימים', distribution: 'התפלגות הוצאות', noStatistics: 'אין עדיין נתוני הוצאות.',
      statisticsGroups: { category: 'קטגוריה', paymentMethod: 'אמצעי תשלום', collaborators: 'שותפים', currency: 'מטבע' },
      expensesOverTime: 'הוצאות בימים האחרונים', statisticsPeriods: { '7': '7 ימים', '14': '14 ימים', all: 'הכול' },
      statisticsExcluded: 'מוחרגת מהסטטיסטיקה',
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
      currenciesLabel: 'מטבעות הטיול',
      currenciesHint: 'המטבעות שבהם יירשמו ההוצאות בחופשה זו',
      setAsDefaultLabel: 'הגדרה כברירת מחדל',
      defaultBadgeLabel: 'ברירת מחדל',
      cannotRemoveLastCurrency: 'בחופשה חייב להישאר לפחות מטבע אחד',
      cannotRemoveCurrencyInUse: 'מטבע זה בשימוש בהוצאה קיימת ולא ניתן להסיר אותו',
      leadCurrency: 'הצגת הסכומים גם במטבע',
      leadCurrencyHint: 'המרת כל הוצאה וסך החופשה למטבע אחד',
      leadCurrencyNone: 'ללא',
      autoRateLabel: 'אוטומטי',
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
      inUseHint: 'כדי להסיר, יש להסיר תחילה מהפיצולים.',
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
