import type { Composition } from "./contract";
export const EMAIL_TEMPLATES: {
  key: Composition["templateKey"];
  label: string;
  subject: string;
  message: string;
  bookingMessage?: string;
}[] = [
  {
    key: "personal",
    label: "Personal response",
    subject: "Your project with Volatile Solutions",
    message: "",
  },
  {
    key: "thanks",
    label: "Thanks for reaching out",
    subject: "Thanks for reaching out to Volatile Solutions",
    message:
      "Thanks for sharing your project. I’ll review what you have in mind and get back to you with any questions and suggested next steps.",
  },
  {
    key: "discovery",
    label: "Discovery call invitation",
    bookingMessage:
      "I’d like to learn more about your goals and what you need from this project. Choose a time that works for you using the booking link below.",
    subject: "Let’s discuss your project",
    message:
      "I’d like to learn more about your goals and what you need from this project. Could you send a few times that work for a conversation, along with your timezone?",
  },
  {
    key: "proposal",
    label: "Proposal ready",
    subject: "Your proposal: {{proposalNumber}}",
    message:
      "Your proposal is ready to review. It outlines the scope and pricing for our work together. Please take a look and let me know if you have any questions.",
  },
  {
    key: "follow-up",
    label: "Follow-up",
    subject: "Following up on your project",
    message:
      "I wanted to check in on your project and see whether you have any questions or updates. Let me know when you’re ready to discuss the next step.",
  },
];
export function personalize(
  value: string,
  variables: Record<string, string>,
): string {
  return value.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, key: string) => {
    if (!Object.hasOwn(variables, key))
      throw new Error("Use only supported personalization variables.");
    if (
      ["proposalUrl", "proposalNumber"].includes(key) &&
      !variables.proposalUrl
    )
      throw new Error(
        "A current sent proposal is required for proposal variables.",
      );
    if (key === "bookingUrl" && !variables.bookingUrl)
      throw new Error("Create a booking link before using booking variables.");
    return variables[key];
  });
}
