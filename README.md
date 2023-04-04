# Obsidian Chat

> _Yet another way to chat with an OpenAI model from within Obsidian._

## Goals

I have a few very simple goals with this plugin:

1. I want to be able to start a chat anywhere on any page.
2. I want to be able to have multiple chats happening on the same page.
3. I want the chat to fit into the document structure.
4. I want the chats to be permanent parts of my vault.
5. I want to get the settings boilerplate out of the current page.

## Quick and Simple "How-To"

1. Install the plugin via [BRAT][brat]
2. Add your API Key and modify settings to your liking
3. Open one of your documents, and run the command: "Start a new chat"
4. Type your message
5. Run the command "Chat with XXX" (where XXX is whatever you called the assistant in settings)
6. Watch the little chatbot spin in the statusbar till the response arrives
7. Repeat from step 4.

### Templates

You can set a templates folder where you can add any amount of prompt templates.
These can contain any of the chat properties, and any messages you want to
always be included. An example template could be:

#### My Favorite Chat Prompt.md

```
model:: gpt-4

# System

You are a witty and clever personal assistant.
You answer questions briefly and to the point.
If you format content, you use markdown.
```

### Chat Properties

You can set chat properties either directly under the chat heading, or in the
templates. They are specified as inline properties, using the dataview syntax:
`property::value`

Here are the default "built-in" properties:

- `model::gtp-3.5-turbo`
- `max_tokens::512`
- `temperature::0`
- `top_p::1`
- `presence_penalty::0`
- `frequency_penalty::0`
- `stream::false`

---

[brat]: https://github.com/TfTHacker/obsidian42-brat
