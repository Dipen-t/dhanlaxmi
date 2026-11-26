# Order WhatsApp messages

The WhatsApp button beside Edit opens customer confirmation and per-recipient
message history. Records start with this release; earlier sends are not imported.

## Sending rules

- Creating an order queues `customerorder1` for the saved customer number only.
  Sunny receives `customer_menu` when dishes are selected.
- Editing selected dishes or the displayed menu details sends `customer_menu`
  to the customer and Sunny when the order has selected dishes. Identical saves
  do not send again. Empty selections do not send a selected-menu template.
- Editing kitchen quantities, units, notes, timings or assignments notifies only
  affected vendors. Date, venue, meal or plate-count changes affect all assigned
  vendors. Reordering kitchen items alone does not send messages.
- The vendor template's fourth parameter (High Tea details) contains only the
  notes entered for those items. It does not include customer details or item names.
- Extra plates update the bill and plate count. Saved kitchen quantities are not
  scaled automatically. Review and edit kitchen quantities where needed.
- Removed or reassigned vendor work is flagged for manual contact. No automatic
  cancellation is sent because no approved cancellation template is available.

The `customer_menu_pdf` template variables are: {{1}} customer name, {{2}} date only (DD/MM/YYYY), {{3}} venue, {{4}} meal, and {{5}} total plates including extra plates.
The template has a Document (Media) header. The system generates and attaches the order menu PDF automatically via public Vercel Blob storage or the `/api/orders/[id]/pdf` endpoint.
Provider errors remain visible in message history; no vendor-template fallback is used.

## Status and Retry

Notifications are saved in the same database transaction as an order change.
The app attempts pending sends after saving. If Termux stops before dispatch,
the saved pending entries remain available from history via Send pending message.
There is no automatic retry of failed or uncertain sends.

- Pending: saved, not yet accepted by the provider.
- Sending: an attempt is in progress.
- Accepted by provider: provider accepted/queued it; delivery/read is not known.
- Failed: provider rejected the attempt. Retry sends only that row's recipient.
- Delivery unknown: a timeout or interruption may have occurred after acceptance.
  The operator must acknowledge duplicate risk before retrying.
- Replaced by newer edit: an obsolete unsent/failed message cannot be retried.
- Contact manually: contact the removed vendor, then mark contacted manually.

Retries refresh customer/vendor phone numbers from the current saved contact.
Database row locks prevent concurrent dispatch of the same order. Already accepted
messages are not retried. Intentional new customer confirmations are separate sends.

## Database

Migration `0015_order_whatsapp_history.sql` adds one table without changing existing
order or financial data. The app also creates the table if missing on an older
client database. The application's database account therefore needs permission to
create this table, or the migration must be applied before starting the app.
