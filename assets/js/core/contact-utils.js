function parseContactTimestamp(contact) {
  const idTimestamp = Number(contact?.id);
  if (Number.isFinite(idTimestamp) && idTimestamp > 0) return idTimestamp;

  const rawDate = String(contact?.created_at || "").trim();
  if (!rawDate) return 0;

  const normalizedDate = rawDate.includes(" ") ? rawDate.replace(" ", "T") : rawDate;
  const parsedDate = Date.parse(normalizedDate);
  return Number.isFinite(parsedDate) ? parsedDate : 0;
}

export function sortContactsByNewest(contacts) {
  return [...contacts].sort((left, right) =>
    parseContactTimestamp(right) - parseContactTimestamp(left)
  );
}

export function applyContactUpdate(contacts, draft) {
  return contacts.map(contact =>
    String(contact.id) === String(draft.id)
      ? { ...contact, name: draft.name, email: draft.email, message: draft.message }
      : contact
  );
}

export function removeContactById(contacts, id) {
  return contacts.filter(contact => String(contact.id) !== String(id));
}

export function validateContactDraft(draft) {
  const data = {
    id: String(draft?.id || "").trim(),
    name: String(draft?.name || "").trim(),
    email: String(draft?.email || "").trim(),
    message: String(draft?.message || "").trim()
  };

  if (!data.id) return { ok: false, error: "ID rekod tidak ditemui." };
  if (!data.name) return { ok: false, error: "Nama wajib diisi." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { ok: false, error: "E-mel tidak sah." };
  }
  if (!data.message) return { ok: false, error: "Mesej wajib diisi." };

  return { ok: true, data };
}
