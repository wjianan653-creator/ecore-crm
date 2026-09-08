(() => {
  "use strict";

  const STORAGE_KEY = "ecore-crm-secure-v1";
  const SESSION_KEY = "ecore-crm-session-key";
  const FALSE_PENDING = new Set(["linkedin_pending", "email_pending", "whatsapp_pending"]);
  const FALSE_YELLOW_STATUS = new Set([
    "LinkedIn申请已发送（等待通过）",
    "邮件已发送（等待回复）",
    "WhatsApp已发送（等待回复）",
    "多渠道已触达（等待回复）",
  ]);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let lastRaw = localStorage.getItem(STORAGE_KEY) || "";
  let lastPassword = "";
  let cachedKey = null;
  let cachedSalt = "";
  let quietTimer = null;
  let initialScheduled = false;
  let repairing = false;

  function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  }

  async function deriveKey(password, salt) {
    const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 180000, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  async function getKey(record, password) {
    if (!cachedKey || password !== lastPassword || record.salt !== cachedSalt) {
      cachedKey = await deriveKey(password, base64ToBytes(record.salt));
      lastPassword = password;
      cachedSalt = record.salt;
    }
    return cachedKey;
  }

  async function decryptPayload(record, key) {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(record.iv) },
      key,
      base64ToBytes(record.data),
    );
    return JSON.parse(decoder.decode(plain));
  }

  async function encryptPayload(payload, key, salt) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(JSON.stringify(payload)),
    );
    return {
      format: "ecore-crm-encrypted",
      version: 1,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(ciphertext)),
      updatedAt: new Date().toISOString(),
    };
  }

  function hasRealActivity(payload, clientId) {
    return (payload.activities || []).some((activity) => Number(activity.clientId) === Number(clientId));
  }

  function isUntouchedImportedResearch(client) {
    const notes = String(client.notes || "").toLowerCase();
    const evidence = String(client.verifiedEvidence || "").toLowerCase();
    return (
      notes.includes("尚未触达") ||
      notes.includes("sourcing pool") ||
      notes.includes("research pool") ||
      evidence.includes("researched sourcing candidate")
    );
  }

  function repairPayload(payload) {
    let changed = 0;
    (payload.clients || []).forEach((client) => {
      if (!isUntouchedImportedResearch(client) || hasRealActivity(payload, client.id)) return;

      const oldTags = Array.isArray(client.progressTags) ? client.progressTags : [];
      const nextTags = oldTags.filter((tag) => !FALSE_PENDING.has(tag));
      if (nextTags.length !== oldTags.length) {
        client.progressTags = nextTags;
        changed += 1;
      }

      if (FALSE_YELLOW_STATUS.has(client.status)) {
        client.status = "已确认目标（待找联系人）";
        changed += 1;
      }

      if (client.lastTouchAt) {
        client.lastTouchAt = "";
        changed += 1;
      }
    });
    return changed;
  }

  async function repairNow() {
    if (repairing) return;
    const password = sessionStorage.getItem(SESSION_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!password || !raw) return;

    repairing = true;
    try {
      const record = JSON.parse(raw);
      if (!record?.salt || !record?.iv || !record?.data) return;
      const key = await getKey(record, password);
      const payload = await decryptPayload(record, key);
      const changed = repairPayload(payload);
      if (!changed) {
        lastRaw = raw;
        return;
      }

      const encrypted = await encryptPayload(payload, key, base64ToBytes(record.salt));
      const nextRaw = JSON.stringify(encrypted);
      localStorage.setItem(STORAGE_KEY, nextRaw);
      lastRaw = nextRaw;
      sessionStorage.setItem("ecore-contact-integrity-fixed-at", new Date().toISOString());
      setTimeout(() => location.reload(), 80);
    } catch (error) {
      console.warn("ECORE contact/status integrity repair skipped:", error);
    } finally {
      repairing = false;
    }
  }

  function scheduleRepair(delay = 250) {
    clearTimeout(quietTimer);
    quietTimer = setTimeout(repairNow, delay);
  }

  setInterval(() => {
    const password = sessionStorage.getItem(SESSION_KEY);
    const raw = localStorage.getItem(STORAGE_KEY) || "";

    if (password && !initialScheduled) {
      initialScheduled = true;
      scheduleRepair(250);
    }

    if (raw !== lastRaw) {
      lastRaw = raw;
      scheduleRepair(250);
    }

    if (!password) {
      initialScheduled = false;
      cachedKey = null;
      lastPassword = "";
      cachedSalt = "";
    }
  }, 150);
})();
