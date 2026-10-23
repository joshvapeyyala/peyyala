// What a contact message is about. Kept apart from schemas.ts so the public
// contact form can use the labels without loading the validation library.

export const messageTopics = ["job", "project", "other"] as const;

export type MessageTopic = (typeof messageTopics)[number];

export const messageTopicLabels: Record<MessageTopic, string> = {
  job: "A job role",
  project: "A freelance project",
  other: "Something else",
};
