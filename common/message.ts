import { Message, MessageType, InputMessage } from "./interfaces";

export const createMessage = (subject: MessageType, data: any): Message => {
  return { subject, ...data };
};

export const getMessages = (
  messages: Message[],
  subject: MessageType,
  entityId?: string
) => {
  const filter = entityId
    ? m => m.subject === subject && entityId === m.entityId
    : m => m.subject === subject;
  return messages.filter(filter);
};
