import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { sendInquiryEmail, emailReceipt } from "./lib/email";
const mail = {
  id: "56f7cf24-af2a-47ac-bc87-6e78bb95c336",
  from: "Anthony <hello@example.test>",
  replyTo: "reply@example.test",
  to: "client@example.test",
  subject: "Test email",
  html: "<p>Escaped safe text</p>",
  text: "Escaped safe text",
};
beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "synthetic-test-only");
  vi.stubEnv("EMAIL_FROM", mail.from);
  vi.stubEnv("EMAIL_REPLY_TO", mail.replyTo);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("installed Resend SDK integration without network delivery", () => {
  it("sends both formats with stable idempotency and a bounded request signal", async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "accepted-sdk-test-id" }));
    vi.stubGlobal("fetch", transport);
    expect(await sendInquiryEmail(mail)).toBe("accepted-sdk-test-id");
    const [url, options] = transport.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.headers.get("Idempotency-Key")).toBe(
      "crm-message/" + mail.id,
    );
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(options.body)).toMatchObject({
      from: mail.from,
      to: [mail.to],
      reply_to: mail.replyTo,
      html: mail.html,
      text: mail.text,
    });
  });
  it("passes actual reply identifiers through the installed SDK", async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "accepted-reply" }));
    vi.stubGlobal("fetch", transport);
    await sendInquiryEmail({
      ...mail,
      inReplyTo: "<parent@example.test>",
      references: "<root@example.test> <parent@example.test>",
    });
    expect(JSON.parse(transport.mock.calls[0][1].body).headers).toEqual({
      "In-Reply-To": "<parent@example.test>",
      References: "<root@example.test> <parent@example.test>",
    });
  });
  it("retrieves the actual RFC Message-ID and delivery event without sending again", async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          message_id: "<actual@example.test>",
          last_event: "delivered",
        }),
      );
    vi.stubGlobal("fetch", transport);
    expect(await emailReceipt("provider-id")).toEqual({
      internetMessageId: "<actual@example.test>",
      state: "delivered",
    });
    expect(transport.mock.calls[0][0]).toBe(
      "https://api.resend.com/emails/provider-id",
    );
    expect(transport.mock.calls[0][1].method).toBe("GET");
  });
  it("keeps unavailable receipt access separate from confirmed send outcomes", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { name: "restricted_api_key", message: "PRIVATE" },
            { status: 403 },
          ),
        ),
    );
    expect(await emailReceipt("provider-id")).toBeNull();
  });
  it("suppresses the SDK development error logger and sanitizes known rejection", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            name: "validation_error",
            statusCode: 403,
            message: "PRIVATE provider details",
          },
          { status: 403 },
        ),
      ),
    );
    await expect(sendInquiryEmail(mail)).rejects.toMatchObject({
      code: "provider_rejected",
    });
    expect(logger).not.toHaveBeenCalled();
  });
  it("treats transport errors as unconfirmed rather than certainly unsent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Private connection detail")),
    );
    await expect(sendInquiryEmail(mail)).rejects.toMatchObject({
      code: "delivery_unconfirmed",
    });
  });
  it("does not interpret an empty provider response as acceptance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    await expect(sendInquiryEmail(mail)).rejects.toMatchObject({
      code: "delivery_unconfirmed",
    });
  });
});
