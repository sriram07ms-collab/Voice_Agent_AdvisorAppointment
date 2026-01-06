import Groq from 'groq-sdk';
import { ConversationState, Intent, Topic, GroqFunctionCall } from '../../shared/types/conversation';
import { SYSTEM_MESSAGES } from '../../shared/constants/messages';
import { TOPICS } from '../../shared/constants/topics';

// Initialize Groq client lazily (after dotenv.config() is called)
let groqClient: Groq | null = null;

const getGroqClient = (): Groq => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.trim() === '') {
      throw new Error('GROQ_API_KEY is not set or invalid. Please set it in backend/.env file. Get your key from https://console.groq.com/');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

// Groq function definitions for function calling
export const GROQ_FUNCTIONS = [
  {
    name: 'select_topic',
    description: 'Select or confirm the consultation topic',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: TOPICS,
          description: 'The selected consultation topic',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'collect_time_preference',
    description: 'Collect user preference for date and time',
    parameters: {
      type: 'object',
      properties: {
        datePreference: {
          type: 'string',
          description: 'User preferred date (e.g., "tomorrow", "Jan 6", "January 6, 2026", "next Monday")',
        },
        timePreference: {
          type: 'string',
          description: 'User preferred time (e.g., "2pm", "11am", "morning", "afternoon", "evening", "2 PM")',
        },
      },
    },
  },
  {
    name: 'select_slot',
    description: 'User selects a specific time slot',
    parameters: {
      type: 'object',
      properties: {
        slotId: {
          type: 'string',
          description: 'The ID of the selected slot',
        },
      },
      required: ['slotId'],
    },
  },
  {
    name: 'provide_booking_code',
    description: 'Provide booking code for reschedule or cancel operations',
    parameters: {
      type: 'object',
      properties: {
        bookingCode: {
          type: 'string',
          description: 'The booking code (format: NL-XXXX)',
        },
      },
      required: ['bookingCode'],
    },
  },
  {
    name: 'confirm_action',
    description: 'User confirms an action (booking, reschedule, cancel)',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['confirm_booking', 'confirm_reschedule', 'confirm_cancel'],
          description: 'The action being confirmed',
        },
      },
      required: ['action'],
    },
  },
];

export interface GroqResponse {
  message: string;
  functionCalls?: GroqFunctionCall[];
  intent?: Intent;
}

export async function processUserMessage(
  userMessage: string,
  conversationState: ConversationState
): Promise<GroqResponse> {
  const systemPrompt = buildSystemPrompt(conversationState);
  
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...conversationState.history
          .filter(turn => {
            // Filter out system messages and any messages with function call syntax
            if (turn.role === 'system') return false;
            // Remove function call text patterns
            const hasFunctionCall = turn.content.includes('<function=') || 
                                   turn.content.includes('function=') ||
                                   turn.content.match(/<function[^>]*>/);
            return !hasFunctionCall;
          })
          .map(turn => ({
            role: turn.role as 'user' | 'assistant',
            content: turn.content
              .replace(/<function=[^>]+>.*?<\/function>/g, '')
              .replace(/<function[^>]*>/g, '')
              .replace(/function=[^>]+>/g, '')
              .trim(),
          })),
        {
          role: 'user',
          content: userMessage,
        },
      ],
      model: 'llama-3.1-8b-instant', // Groq model - using 8b-instant (supports function calling)
      tools: [
        {
          type: 'function',
          function: {
            name: 'select_topic',
            description: GROQ_FUNCTIONS[0].description,
            parameters: GROQ_FUNCTIONS[0].parameters,
          },
        },
        {
          type: 'function',
          function: {
            name: 'collect_time_preference',
            description: GROQ_FUNCTIONS[1].description,
            parameters: GROQ_FUNCTIONS[1].parameters,
          },
        },
        {
          type: 'function',
          function: {
            name: 'select_slot',
            description: GROQ_FUNCTIONS[2].description,
            parameters: GROQ_FUNCTIONS[2].parameters,
          },
        },
        {
          type: 'function',
          function: {
            name: 'provide_booking_code',
            description: GROQ_FUNCTIONS[3].description,
            parameters: GROQ_FUNCTIONS[3].parameters,
          },
        },
        {
          type: 'function',
          function: {
            name: 'confirm_action',
            description: GROQ_FUNCTIONS[4].description,
            parameters: GROQ_FUNCTIONS[4].parameters,
          },
        },
      ],
      tool_choice: 'auto', // Let the model decide when to use tools
      // Reduce temperature to make responses more deterministic
      temperature: 0.3, // Lower temperature for more consistent function calling
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message;
    if (!assistantMessage) {
      throw new Error('No response from Groq');
    }

    let responseMessage = assistantMessage.content || '';
    const response: GroqResponse = {
      message: responseMessage,
      functionCalls: [],
    };

    // Extract function calls from tool_calls API
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      response.functionCalls = assistantMessage.tool_calls.map(call => {
        try {
          const args = typeof call.function.arguments === 'string' 
            ? JSON.parse(call.function.arguments) 
            : call.function.arguments;
          return {
            name: call.function.name,
            arguments: args || {},
          };
        } catch (e) {
          console.error('Error parsing function arguments:', e);
          return {
            name: call.function.name,
            arguments: {},
          };
        }
      });
      // Remove function call text from message if it exists
      responseMessage = responseMessage.replace(/<function=[^>]+>.*?<\/function>/g, '').trim();
    }
    
    // Fallback: Parse function calls from text if Groq outputs them as text
    // This handles cases where Groq writes <function=name>{args} in the response
    if (response.functionCalls.length === 0 && responseMessage.includes('<function=')) {
      const functionCallRegex = /<function=([^>]+)>(\{.*?\})/g;
      let match;
      while ((match = functionCallRegex.exec(responseMessage)) !== null) {
        try {
          const functionName = match[1];
          const argsJson = match[2];
          const args = JSON.parse(argsJson);
          response.functionCalls.push({
            name: functionName,
            arguments: args,
          });
          // Remove the function call text from the message
          responseMessage = responseMessage.replace(match[0], '').trim();
        } catch (e) {
          console.error('Error parsing function call from text:', e);
        }
      }
    }
    
    response.message = responseMessage;

    // Detect intent from message
    response.intent = detectIntent(userMessage, conversationState);

    return response;
  } catch (error: any) {
    console.error('Groq API error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Try to extract function call from error message if Groq wrote it as text
    if (error?.error?.failed_generation) {
      const failedGen = error.error.failed_generation;
      console.log('Attempting to parse function call from failed_generation:', failedGen);
      
      // Try to extract function call from the failed generation text
      const functionCallRegex = /<function=([^>]+)>(\{.*?\})/g;
      let match;
      const extractedCalls: Array<{ name: string; arguments: any }> = [];
      
      while ((match = functionCallRegex.exec(failedGen)) !== null) {
        try {
          const functionName = match[1].trim();
          const argsJson = match[2];
          const args = JSON.parse(argsJson);
          extractedCalls.push({
            name: functionName,
            arguments: args,
          });
          console.log(`✅ Extracted function call from error: ${functionName}`, args);
        } catch (e) {
          console.error('Error parsing function call from error:', e);
        }
      }
      
      // If we extracted function calls, return them instead of throwing
      if (extractedCalls.length > 0) {
        // Extract the natural language response (before the function call)
        const naturalResponse = failedGen
          .replace(/<function=[^>]+>.*?$/g, '')
          .replace(/<function[^>]*>.*?$/g, '')
          .trim();
        
        return {
          message: naturalResponse || 'I understand. Let me process that for you.',
          functionCalls: extractedCalls,
          intent: detectIntent(userMessage, conversationState),
        };
      }
    }
    
    if (error?.message) {
      throw new Error(`Groq API error: ${error.message}`);
    }
    throw new Error('Failed to process message with Groq AI');
  }
}

function buildSystemPrompt(state: ConversationState): string {
  let prompt = `You are a helpful assistant for Groww, helping users schedule advisor consultations.

CRITICAL INSTRUCTIONS - READ CAREFULLY:
- You have function calling tools available through the API's tool system
- NEVER write function calls as text in your response
- NEVER use syntax like <function=name> or function=name in your text
- NEVER include JSON function calls in your message text
- NEVER write <function=select_topic> or any function tags
- When you need to record information, use the tool system ONLY - do not write it in text
- Your response should be PURE natural language - just talk to the user normally
- If you need to use a tool, respond with ONLY the tool_calls object, not with text
- The API will automatically call the appropriate tools based on your conversation
- Example: If user says "nominee changes", just respond "You'd like to discuss Account Changes/Nominee. Is that correct?" - DO NOT write <function=select_topic>

IMPORTANT RULES:
1. Always start with a greeting and the disclaimer: "${SYSTEM_MESSAGES.DISCLAIMER}"
2. Never provide investment advice. If asked, redirect to educational resources.
3. Do not collect PII (phone, email, account numbers) during the conversation.
4. All times are in IST (Indian Standard Time).
5. Always confirm important information before proceeding.

Current conversation state: ${state.currentStep}
${state.context.topic ? `Selected topic: ${state.context.topic}` : ''}
${state.context.datePreference ? `Date preference: ${state.context.datePreference}` : ''}
${state.context.timePreference ? `Time preference: ${state.context.timePreference}` : ''}

Available topics:
${TOPICS.map(t => `- ${t}`).join('\n')}

Available tools (use through tool system, NOT as text):
- select_topic: When user chooses a topic (use tool, don't write <function=select_topic>)
- collect_time_preference: When user mentions date/time (use tool, don't write function tags)
- select_slot: When user chooses a slot (use tool, don't write function tags)
- provide_booking_code: When user provides booking code (use tool, don't write function tags)
- confirm_action: When user confirms an action (use tool, don't write function tags)

CRITICAL: When you need to use a tool:
1. Respond with ONLY the tool_calls object through the API
2. DO NOT include any function call syntax in your text response
3. DO NOT write <function=name> or function=name anywhere
4. Just respond naturally in plain text, and the tool system will handle the rest

Example of CORRECT behavior:
User: "I need help with nominee changes"
You: "You'd like to discuss Account Changes/Nominee. Is that correct?"
[Tool system automatically calls select_topic in the background]

Example of WRONG behavior (DO NOT DO THIS):
User: "I need help with nominee changes"
You: "You'd like to discuss Account Changes/Nominee. <function=select_topic>{\"topic\": \"Account Changes/Nominee\"}"
[This is WRONG - never write function calls as text]`;

  return prompt;
}

function detectIntent(message: string, state: ConversationState): Intent {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('book') || lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
    return 'book_new';
  }
  if (lowerMessage.includes('reschedule') || lowerMessage.includes('change time') || lowerMessage.includes('different time')) {
    return 'reschedule';
  }
  if (lowerMessage.includes('cancel') || lowerMessage.includes('cancel appointment')) {
    return 'cancel';
  }
  if (lowerMessage.includes('prepare') || lowerMessage.includes('what to bring') || lowerMessage.includes('documents')) {
    return 'what_to_prepare';
  }
  if (lowerMessage.includes('available') || lowerMessage.includes('slots') || lowerMessage.includes('when can')) {
    return 'check_availability';
  }
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return 'greeting';
  }
  
  return 'unknown';
}

