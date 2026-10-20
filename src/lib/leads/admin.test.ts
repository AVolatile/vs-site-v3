import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { load } from "cheerio";
import LeadsAdmin from "@components/admin/LeadsAdmin.astro";
import AdminLayout from "@layouts/AdminLayout.astro";
import { safeInquiryBack } from "@/lib/proposals/contract";
import { calendarReturnUrl } from "@/lib/bookings/admin-session";

describe("lead workspace shell and navigation contracts", () => {
  it("renders private shells without prospect data, with unique field IDs and supported panels", async () => {
    const container = await AstroContainer.create();
    const $ = load(await container.renderToString(LeadsAdmin));
    const ids = $("[id]")
      .toArray()
      .map((node) => $(node).attr("id"));
    expect(new Set(ids).size).toBe(ids.length);
    expect($("[data-lead-workspace]").attr("hidden")).toBeDefined();
    expect($("[data-lead-rows]").children()).toHaveLength(0);
    expect(
      $("[data-lead-form] [required]")
        .map((_, node) => $(node).attr("name"))
        .get()
        .sort(),
    ).toEqual(["company", "priority", "status"]);
    for (const selector of [
      "[data-inquiry-communication]",
      "[data-inquiry-booking]",
      "[data-inquiry-proposal]",
      "[data-invoice-context]",
      "[data-admin-activity-list]",
    ])
      expect($(selector)).toHaveLength(1);
    expect(
      $("[data-lead-conversion] select")
        .toArray()
        .every((node) => $(node).find("option[selected]").length === 0),
    ).toBe(true);
    expect($("[data-lead-delete]").attr("aria-label")).toBe(
      "Permanently delete lead",
    );
  });
  it("keeps the workspace noindex and adds Leads using existing navigation markup", async () => {
    const container = await AstroContainer.create(),
      $ = load(await container.renderToString(AdminLayout));
    expect($('meta[name="robots"]').attr("content")).toBe("noindex, nofollow");
    expect(
      $('nav[aria-label="Admin workspace"] a[href="/admin/leads/"]')
        .text()
        .trim(),
    ).toBe("Leads");
  });
  it("returns from builders and sign-in to the right owner while rejecting external destinations", () => {
    const id = "12c6b43f-a223-44fd-98be-333745aca870",
      back = "/admin/leads/?status=interested&lead=" + id;
    expect(safeInquiryBack(back, null, id)).toBe(back);
    expect(
      safeInquiryBack(
        "https://attacker.test/admin/leads/?lead=" + id,
        null,
        id,
      ),
    ).toBe("/admin/leads/?lead=" + id);
    expect(safeInquiryBack("/admin/?inquiry=" + id, id)).toBe(
      "/admin/?inquiry=" + id,
    );
    expect(calendarReturnUrl(back)).toBe(back);
    expect(calendarReturnUrl("https://attacker.test/admin/leads/")).toBeNull();
  });
});
