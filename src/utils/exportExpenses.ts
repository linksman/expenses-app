import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Expense } from '../types/expense';
import { Vacation } from '../types/vacation';
import { PaymentMethod } from '../types/paymentMethod';
import { Translations } from '../i18n/translations';
import { paymentMethodName } from './paymentMethodName';
import { ExpenseGrouping } from '../storage/ExpenseGroupingContext';
import { companionShare, formatAmount, formatTotalsWithLead, companionConvertedTotal, convertedTotal } from './formatCurrency';
import { groupExpenses } from './groupExpenses';

export interface ExportViewOptions {
  groupBy: ExpenseGrouping;
  vacation: Vacation;
  convert: (amount: number, currencyCode: string) => number | null;
}

interface ExportRow {
  date: string;
  description: string;
  category: string;
  paymentMethod: string;
  vacation: string;
  amount: string;
  currency: string;
}

function buildRows(
  expenses: Expense[],
  vacations: Vacation[],
  methods: PaymentMethod[],
  t: Translations,
  locale: string
): ExportRow[] {
  return expenses.map((e) => {
    const method = methods.find((m) => m.id === e.paymentMethodId);
    const vacation = vacations.find((v) => v.id === e.vacationId);
    return {
      date: new Date(e.createdAt).toLocaleString(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      description: e.description,
      category: e.category ? t.categories[e.category] : '',
      paymentMethod: method ? paymentMethodName(method, t) : '',
      vacation: vacation?.name ?? '',
      amount: e.amount.toFixed(2),
      currency: e.currencyCode,
    };
  });
}

function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildExpensesCsv(
  expenses: Expense[],
  vacations: Vacation[],
  methods: PaymentMethod[],
  t: Translations,
  locale: string,
  view: ExportViewOptions,
  totalsLine: string
): string {
  const headers = [
    t.add.date,
    t.add.description,
    t.add.category,
    t.add.paymentMethod,
    t.manage.vacation,
    t.manage.amount,
    t.currency.pickerTitle,
  ];
  const groupHeader = t.settings.groupByOptions[view.groupBy];
  const lines = [[groupHeader, ...headers].map(csvField).join(',')];
  const sections = groupExpenses(expenses, view.groupBy, methods, view.vacation, t, locale);
  for (const section of sections) {
    for (const expense of section.data) {
      const row = buildRows([expense], vacations, methods, t, locale)[0];
      const amount = view.groupBy === 'collaborators'
        ? `${formatAmount(companionShare(expense, section.key), expense.currencyCode)} ${t.manage.of} ${formatAmount(expense.amount, expense.currencyCode)}`
        : row.amount;
      lines.push(
        [section.title, row.date, row.description, row.category, row.paymentMethod, row.vacation, amount, row.currency]
          .map(csvField)
          .join(',')
      );
    }
    const totals = view.groupBy === 'collaborators' && section.shareTotals
      ? section.shareTotals
      : section.totals;
    const leadTotal = view.vacation.leadCurrency
      ? view.groupBy === 'collaborators'
        ? companionConvertedTotal(section.data, section.key, view.convert)
        : convertedTotal(section.data, view.convert)
      : null;
    const summary = formatTotalsWithLead(
      totals,
      view.vacation.leadCurrency,
      leadTotal,
      view.vacation.defaultCurrency
    );
    lines.push(
      [`${section.title} — ${t.manage.tripTotal}`, '', '', '', '', '', summary, '']
        .map(csvField)
        .join(',')
    );
  }
  lines.push(
    [t.manage.tripTotal, '', '', '', '', '', totalsLine.replace(`${t.manage.tripTotal} `, ''), '']
      .map(csvField)
      .join(',')
  );
  // A leading UTF-8 BOM is required for Excel to detect the encoding and render
  // non-ASCII text (Hebrew, accented Latin letters, etc.) correctly instead of as
  // garbled characters — without it Excel assumes the system's ANSI codepage.
  return String.fromCharCode(0xfeff) + lines.join('\r\n');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildExpensesHtml(
  expenses: Expense[],
  vacations: Vacation[],
  methods: PaymentMethod[],
  t: Translations,
  locale: string,
  title: string,
  totalsLine: string,
  isRTL: boolean,
  view: ExportViewOptions
): string {
  const dir = isRTL ? 'rtl' : 'ltr';
  const align = isRTL ? 'right' : 'left';
  const amountAlign = isRTL ? 'left' : 'right';
  const sections = groupExpenses(expenses, view.groupBy, methods, view.vacation, t, locale);
  const bodyRows = sections.map((section) => {
    const rows = section.data.map((expense) => {
      const r = buildRows([expense], vacations, methods, t, locale)[0];
      const amount = view.groupBy === 'collaborators'
        ? `${formatAmount(companionShare(expense, section.key), expense.currencyCode)} ${t.manage.of} ${formatAmount(expense.amount, expense.currencyCode)}`
        : r.amount;
      return `
        <tr>
          <td>${escapeHtml(r.date)}</td>
          <td>${escapeHtml(r.description)}</td>
          <td>${escapeHtml(r.category)}</td>
          <td>${escapeHtml(r.paymentMethod)}</td>
          <td>${escapeHtml(r.vacation)}</td>
          <td class="amount">${escapeHtml(amount)}${view.groupBy === 'collaborators' ? '' : ` ${escapeHtml(r.currency)}`}</td>
        </tr>`;
    }).join('');
    const totals = view.groupBy === 'collaborators' && section.shareTotals ? section.shareTotals : section.totals;
    const leadTotal = view.vacation.leadCurrency
      ? view.groupBy === 'collaborators'
        ? companionConvertedTotal(section.data, section.key, view.convert)
        : convertedTotal(section.data, view.convert)
      : null;
    const summary = formatTotalsWithLead(totals, view.vacation.leadCurrency, leadTotal, view.vacation.defaultCurrency);
    return `<tr class="group"><td colspan="6">${escapeHtml(section.title)}</td></tr>${rows}
      <tr class="subtotal"><td colspan="5">${escapeHtml(t.manage.tripTotal)}</td><td class="amount">${escapeHtml(summary)}</td></tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html dir="${dir}">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1B2733; padding: 24px; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          .meta { color: #7A8894; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border-bottom: 1px solid #E6ECEC; padding: 8px; text-align: ${align}; }
          th { color: #7A8894; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
          .amount { font-weight: 700; text-align: ${amountAlign}; }
          .group td { background: #F4F4F5; font-size: 13px; font-weight: 700; padding-top: 12px; }
          .subtotal td { font-weight: 700; border-bottom: 2px solid #D4D4D8; }
          .total { margin-top: 18px; font-weight: 700; font-size: 14px; text-align: ${align}; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">${escapeHtml(t.manage.generatedOn)} ${escapeHtml(
          new Date().toLocaleString(locale)
        )} · ${escapeHtml(t.settings.groupBy)}: ${escapeHtml(t.settings.groupByOptions[view.groupBy])}</div>
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(t.add.date)}</th>
              <th>${escapeHtml(t.add.description)}</th>
              <th>${escapeHtml(t.add.category)}</th>
              <th>${escapeHtml(t.add.paymentMethod)}</th>
              <th>${escapeHtml(t.manage.vacation)}</th>
              <th>${escapeHtml(t.manage.amount)}</th>
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <div class="total">${escapeHtml(totalsLine)}</div>
      </body>
    </html>
  `;
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'expenses'
  );
}

export async function exportCsvFile(csv: string, baseName: string): Promise<void> {
  const filename = `${slugify(baseName)}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: filename });
  }
}

export async function exportPdfFile(html: string, baseName: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${slugify(baseName)}.pdf`,
    });
  }
}
