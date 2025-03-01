import { PromptTemplate } from "langchain/prompts";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "langchain/schema/runnable";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { StringOutputParser } from "langchain/schema/output_parser";
import { formatDocumentsAsString } from "langchain/util/document";

const model = new ChatOpenAI({});

const condenseQuestionTemplate = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;
const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(
  condenseQuestionTemplate
);

const answerTemplate = `Answer the question based only on the following context:
{context}

Question: {question}
`;
const ANSWER_PROMPT = PromptTemplate.fromTemplate(answerTemplate);

const formatChatHistory = (chatHistory: [string, string][]) => {
  const formattedDialogueTurns = chatHistory.map(
    (dialogueTurn) => `Human: ${dialogueTurn[0]}\nAssistant: ${dialogueTurn[1]}`
  );
  return formattedDialogueTurns.join("\n");
};

const vectorStore = await HNSWLib.fromTexts(
  [
    "mitochondria is the powerhouse of the cell",
    "mitochondria is made of lipids",
  ],
  [{ id: 1 }, { id: 2 }],
  new OpenAIEmbeddings()
);
const retriever = vectorStore.asRetriever();

type ConversationalRetrievalQAChainInput = {
  question: string;
  chat_history: [string, string][];
};

const standaloneQuestionChain = RunnableSequence.from([
  {
    question: (input: ConversationalRetrievalQAChainInput) => input.question,
    chat_history: (input: ConversationalRetrievalQAChainInput) =>
      formatChatHistory(input.chat_history),
  },
  CONDENSE_QUESTION_PROMPT,
  model,
  new StringOutputParser(),
]);

const answerChain = RunnableSequence.from([
  {
    context: retriever.pipe(formatDocumentsAsString),
    question: new RunnablePassthrough(),
  },
  ANSWER_PROMPT,
  model,
]);

const conversationalRetrievalQAChain =
  standaloneQuestionChain.pipe(answerChain);

const result1 = await conversationalRetrievalQAChain.invoke({
  question: "What is the powerhouse of the cell?",
  chat_history: [],
});
console.log(result1);
/*
  AIMessage { content: "The powerhouse of the cell is the mitochondria." }
*/

const result2 = await conversationalRetrievalQAChain.invoke({
  question: "What are they made out of?",
  chat_history: [
    [
      "What is the powerhouse of the cell?",
      "The powerhouse of the cell is the mitochondria.",
    ],
  ],
});
console.log(result2);
/*
  AIMessage { content: "Mitochondria are made out of lipids." }
*/
