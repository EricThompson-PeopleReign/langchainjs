import { ChatPromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";

// We can also construct an LLMChain from a ChatPromptTemplate and a chat model.
const chat = new ChatOpenAI({ temperature: 0 });
const chatPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant that translates {input_language} to {output_language}.",
  ],
  ["human", "{text}"],
]);
const chainB = new LLMChain({
  prompt: chatPrompt,
  llm: chat,
});

const resB = await chainB.call({
  input_language: "English",
  output_language: "French",
  text: "I love programming.",
});
console.log({ resB });
// { resB: { text: "J'adore la programmation." } }
