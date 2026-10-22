import { createHash, randomUUID } from "node:crypto";
import { query } from "../database";
import { runtimeValue } from "../runtime-env";
import { emailConfiguration, validMessageId } from "../email";
import { escapeHtml } from "../email-render";
import { HttpError } from "../http";
import { microsoftConnection, microsoftApi, graphPath } from "./microsoft-auth";
import { object, ProviderError } from "./provider";
import type { MessageList } from "../../../src/lib/communications/contract";
type Row = Record<string, unknown>;
const hasMail = (scope: unknown) =>
  String(scope || "")
    .split(" ")
    .some((s) =>
      ["mail.read", "https://graph.microsoft.com/mail.read"].includes(
        s.toLowerCase(),
      ),
    );
async function connection() {
  if (runtimeValue("MICROSOFT_MAIL_ENABLED") !== "true") return null;
  const c = await microsoftConnection();
  if (!c || c.status !== "connected" || !hasMail(c.scope)) return null;
  if (
    String(c.account_email).toLowerCase() !==
    emailConfiguration(false).replyTo.toLowerCase()
  )
    return null;
  return c;
}
export async function mailboxStatus(): Promise<
  NonNullable<MessageList["mailbox"]>
> {
  try {
    if (await connection())
      return {
        status: "connected",
        message:
          "Outlook connected. Use Sync replies to import Inbox messages; this is not a live mailbox.",
      };
  } catch {
    /* Email composition works even if the mailbox is unavailable. */
  }
  return {
    status: "outbound-only",
    message:
      "Outbound only. Replies are not synced. Connect the Outlook reply-to mailbox with Mail.Read to enable Sync replies.",
  };
}
const address = (value: unknown) =>
  String(object(object(value).emailAddress).address || "").toLowerCase();
function header(message: Row, name: string) {
  const headers = Array.isArray(message.internetMessageHeaders)
    ? message.internetMessageHeaders
    : [];
  return String(
    headers.map(object).find((h) => String(h.name).toLowerCase() === name)
      ?.value || "",
  );
}
export async function associateMail(message: Row, account: string) {
  const sender = address(message.from),
    ids =
      [header(message, "in-reply-to"), header(message, "references")]
        .join(" ")
        .match(/<[^<>\s]+>/g)
        ?.filter(validMessageId) || [];
  if (
    !sender ||
    sender.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender)
  )
    return null;
  let matches = ids.length
    ? await query(
        `SELECT * FROM inquiry_messages WHERE lead_id IS NOT NULL AND internet_message_id=ANY($1::text[])`,
        [ids],
      )
    : [];
  if (!matches.length && message.conversationId)
    matches = await query(
      `SELECT * FROM inquiry_messages WHERE lead_id IS NOT NULL
      AND provider_account_id=$1 AND provider_thread_id=$2`,
      [account, String(message.conversationId)],
    );
  if (matches.length) {
    const owners = new Set(matches.map((m) => m.lead_id));
    const threads = new Set(matches.map((m) => m.thread_id));
    // Never let a header move an email from another sender into a Lead's conversation.
    if (
      owners.size !== 1 ||
      threads.size !== 1 ||
      !matches.some(
        (m) =>
          String(
            m.direction === "inbound" ? m.from_email : m.to_email,
          ).toLowerCase() === sender,
      )
    )
      return null;
    return matches.sort(
      (a, b) =>
        ids.indexOf(String(b.internet_message_id)) -
        ids.indexOf(String(a.internet_message_id)),
    )[0];
  }
  // Address fallback is allowed only for a unique contact; it starts a new conversation.
  // Subjects are never used to infer ownership or thread identity.
  const contacts = await query(
    `SELECT id,'lead' AS kind FROM leads WHERE lower(email)=$1
    UNION ALL SELECT id,'inquiry' AS kind FROM inquiries WHERE lower(email)=$1`,
    [sender],
  );
  if (contacts.length !== 1 || contacts[0].kind !== "lead") return null;
  return { lead_id: contacts[0].id, thread_id: randomUUID(), id: null };
}
export async function importMail(message: Row, account: string) {
  const replyTo = emailConfiguration(false).replyTo.toLowerCase();
  const recipients = Array.isArray(message.toRecipients)
    ? message.toRecipients.map(address)
    : [];
  if (
    !recipients.includes(replyTo) ||
    message.isDraft === true ||
    message["@removed"]
  )
    return false;
  const parent = await associateMail(message, account);
  if (!parent) return false;
  const providerId = String(message.id || ""),
    internetId = message.internetMessageId;
  const body = object(message.uniqueBody ?? message.body),
    text = String(body.content || "").replace(
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,
      "",
    );
  const received = new Date(String(message.receivedDateTime));
  if (
    !providerId ||
    providerId.length > 2048 ||
    String(message.conversationId || "").length > 2048 ||
    !validMessageId(internetId) ||
    !Number.isFinite(received.getTime()) ||
    body.contentType !== "text"
  )
    return false;
  // Store a safe text snapshot. Inbound HTML/attachments/remote images never execute in admin.
  const snapshot =
    text.length > 20000
      ? text.slice(0, 19930) +
        "\n[Message shortened. View the complete email in Outlook.]"
      : text;
  const inReplyTo = header(message, "in-reply-to");
  const references = (header(message, "references").match(/<[^<>\s]+>/g) || [])
    .filter(validMessageId)
    .slice(-10)
    .join(" ");
  const rows = await query(
    `WITH saved AS (
    INSERT INTO inquiry_messages(lead_id,direction,status,provider,provider_account_id,provider_message_id,
      internet_message_id,provider_thread_id,thread_id,reply_message_id,in_reply_to,reference_ids,
      from_email,reply_to_email,to_email,subject,message_text,body_text,body_html,template_key,format,
      request_key,payload_fingerprint,sent_at,received_at)
    VALUES($1,'inbound','sent','outlook',$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12,$13::text,$13::text,$14,'personal','quick',gen_random_uuid(),$15,$16,$16)
    ON CONFLICT(provider,provider_account_id,provider_message_id) WHERE provider='outlook' DO NOTHING RETURNING *
  ), activity AS (
    INSERT INTO inquiry_activity(lead_id,activity_type,actor,note,message_id)
    SELECT lead_id,'email_received','client',subject,id FROM saved RETURNING id
  ) SELECT id FROM saved`,
    [
      parent.lead_id,
      account,
      providerId,
      internetId,
      String(message.conversationId || ""),
      parent.thread_id,
      parent.id,
      validMessageId(inReplyTo) ? inReplyTo : null,
      references,
      address(message.from),
      replyTo,
      String(message.subject || "(No subject)")
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .slice(0, 200),
      snapshot,
      escapeHtml(snapshot),
      createHash("sha256")
        .update(account + providerId)
        .digest("hex"),
      received.toISOString(),
    ],
  );
  return rows.length > 0;
}
export async function syncMailbox() {
  const c = await connection();
  if (!c)
    throw new HttpError(
      409,
      "Inbound mail is unavailable. Connect the Outlook reply-to mailbox with Mail.Read; outbound email remains available.",
    );
  const account = String(c.account_id),
    lease = randomUUID();
  await query(
    "INSERT INTO mailbox_sync_state(account_id) VALUES($1) ON CONFLICT DO NOTHING",
    [account],
  );
  const state = (
    await query(
      `UPDATE mailbox_sync_state SET lease=$2,lease_until=clock_timestamp()+interval '45 seconds'
    WHERE account_id=$1 AND (lease_until IS NULL OR lease_until<clock_timestamp()) RETURNING *`,
      [account, lease],
    )
  )[0];
  if (!state)
    throw new HttpError(
      409,
      "Replies are already syncing. Refresh history shortly.",
    );
  const deadline = AbortSignal.timeout(14000);
  try {
    const initial =
      "me/mailFolders/inbox/messages/delta?" +
      new URLSearchParams({ $select: "id", $top: "10" });
    const page = object(
      await microsoftApi(
        c,
        state.cursor ? graphPath(String(state.cursor)) : initial,
        { headers: { Prefer: "odata.maxpagesize=10" } },
        deadline,
      ),
    );
    if (!Array.isArray(page.value)) throw new ProviderError("invalid_response");
    let imported = 0;
    const incoming: Row[] = [];
    const fetchOne = async (value: unknown) => {
      const item = object(value);
      if (item["@removed"]) return;
      try {
        const message = object(
          await microsoftApi(
            c,
            `me/messages/${encodeURIComponent(String(item.id))}?` +
              new URLSearchParams({
                $select:
                  "id,from,toRecipients,subject,body,uniqueBody,receivedDateTime,internetMessageId,internetMessageHeaders,conversationId,isDraft",
              }),
            { headers: { Prefer: 'outlook.body-content-type="text"' } },
            deadline,
          ),
        );
        incoming.push(message);
      } catch (error) {
        // A message moved/deleted between delta and GET must not stall the Inbox cursor.
        if (
          !(
            error instanceof ProviderError &&
            ["not_found", "gone"].includes(error.code)
          )
        )
          throw error;
      }
    };
    for (let i = 0; i < page.value.length; i += 2)
      await Promise.all(page.value.slice(i, i + 2).map(fetchOne));
    // Import parents before descendants within each page, regardless of delta ordering.
    incoming.sort(
      (a, b) =>
        Date.parse(String(a.receivedDateTime)) -
        Date.parse(String(b.receivedDateTime)),
    );
    for (const message of incoming)
      if (await importMail(message, account)) imported++;
    const cursor = page["@odata.nextLink"] || page["@odata.deltaLink"];
    if (!cursor) throw new ProviderError("invalid_response");
    // A disconnected/reconnected account cannot advance a newer connection's cursor.
    const current = await microsoftConnection();
    if (current?.generation !== c.generation || current.status !== "connected")
      throw new ProviderError("reconnect_required");
    await query(
      `UPDATE mailbox_sync_state SET cursor=$3,last_synced_at=clock_timestamp(),lease=NULL,lease_until=NULL
      WHERE account_id=$1 AND lease=$2`,
      [account, lease, graphPath(String(cursor))],
    );
    return { imported, more: !!page["@odata.nextLink"] };
  } catch (error) {
    if (error instanceof ProviderError && ["gone"].includes(error.code))
      await query(
        "UPDATE mailbox_sync_state SET cursor=NULL WHERE account_id=$1 AND lease=$2",
        [account, lease],
      );
    throw new HttpError(
      503,
      "Outlook replies could not finish syncing. Check the mailbox connection and try again. Saved messages are preserved.",
    );
  } finally {
    await query(
      "UPDATE mailbox_sync_state SET lease=NULL,lease_until=NULL WHERE account_id=$1 AND lease=$2",
      [account, lease],
    );
  }
}
