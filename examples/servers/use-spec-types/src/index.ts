import { CallToolResult } from "@zuplo/mcp/types";

const helloWorldToolResult: CallToolResult = {
  type: "text",
  content: ["Hello world!"],
  isError: false
};

console.log(helloWorldToolResult);
