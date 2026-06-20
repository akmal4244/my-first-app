/*
 * File Path: tests/contact-utils.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyContactUpdate,
  removeContactById,
  sortContactsByNewest,
  validateContactDraft
} from "../assets/js/core/contact-utils.js";

test("sorts contact submissions with newest records first", () => {
  const contacts = [
    { id: "1000", name: "Lama", created_at: "2026-06-19 10:00:00" },
    { id: "3000", name: "Terbaru", created_at: "2026-06-19 12:00:00" },
    { id: "2000", name: "Tengah", created_at: "2026-06-19 11:00:00" }
  ];

  assert.deepEqual(
    sortContactsByNewest(contacts).map(contact => contact.name),
    ["Terbaru", "Tengah", "Lama"]
  );
  assert.deepEqual(
    contacts.map(contact => contact.name),
    ["Lama", "Terbaru", "Tengah"]
  );
});

test("uses created_at when id is not timestamp-like", () => {
  const contacts = [
    { id: "abc", name: "Semalam", created_at: "2026-06-18 23:59:00" },
    { id: "def", name: "Hari ini", created_at: "2026-06-19 09:00:00" }
  ];

  assert.equal(sortContactsByNewest(contacts)[0].name, "Hari ini");
});

test("applies inline table edits without mutating the original contacts", () => {
  const contacts = [
    { id: "1", name: "Nama lama", email: "lama@example.com", message: "Mesej lama" },
    { id: "2", name: "Kekal", email: "kekal@example.com", message: "Tidak berubah" }
  ];

  const updated = applyContactUpdate(contacts, {
    id: "1",
    name: "Nama baru",
    email: "baru@example.com",
    message: "Mesej baru"
  });

  assert.equal(updated[0].name, "Nama baru");
  assert.equal(updated[0].email, "baru@example.com");
  assert.equal(updated[0].message, "Mesej baru");
  assert.equal(updated[1], contacts[1]);
  assert.equal(contacts[0].name, "Nama lama");
});

test("removes a contact by id without mutating the original contacts", () => {
  const contacts = [
    { id: "1", name: "Padam" },
    { id: "2", name: "Kekal" }
  ];

  const remaining = removeContactById(contacts, "1");

  assert.deepEqual(remaining, [{ id: "2", name: "Kekal" }]);
  assert.equal(contacts.length, 2);
});

test("validates editable contact table drafts", () => {
  assert.deepEqual(validateContactDraft({
    id: "1",
    name: "Akmal",
    email: "akmal@example.com",
    message: "Mesej"
  }), {
    ok: true,
    data: {
      id: "1",
      name: "Akmal",
      email: "akmal@example.com",
      message: "Mesej"
    }
  });

  assert.equal(validateContactDraft({ id: "", name: "Akmal", email: "akmal@example.com", message: "Mesej" }).error, "ID rekod tidak ditemui.");
  assert.equal(validateContactDraft({ id: "1", name: "", email: "akmal@example.com", message: "Mesej" }).error, "Nama wajib diisi.");
  assert.equal(validateContactDraft({ id: "1", name: "Akmal", email: "bukan-email", message: "Mesej" }).error, "E-mel tidak sah.");
  assert.equal(validateContactDraft({ id: "1", name: "Akmal", email: "akmal@example.com", message: "" }).error, "Mesej wajib diisi.");
});
