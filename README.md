# Qualtrics LLM Chat Widget

Embed a multi-turn LLM chat interface inside a Qualtrics survey, with full conversation data recorded in embedded data fields for export and analysis.

Built for researchers who want to study human–AI interaction within a controlled survey context. Model behaviour is controlled by plain-text prompt files stored in a `prompts/` folder — no code editing required to add or change conditions.

---

## How it works

```
Qualtrics Survey Flow
│
├── Randomiser
│   ├── Branch A  →  condition = aristotle
│   ├── Branch B  →  condition = pirate
│   └── Branch C  →  condition = limerick
│
├── Shared Embedded Data
│   └── llm_api_key, llm_model, llm_max_turns, llm_temperature
│
└── Chat question block
        │
        ▼
    iframe → GitHub Pages/index.html?condition=sycophantic&...
                    │
                    ├── fetches prompts/sycophantic.prompt
                    ├── runs chat with that system prompt
                    └── postMessage → Qualtrics JS tab → embedded data fields
```

A chat interface is hosted on GitHub Pages and embedded via `<iframe>`. On load, the widget reads the `condition` URL parameter and fetches the matching `.prompt` file from the `prompts/` folder on the same domain. This text becomes the system prompt for every API call in that session. When the participant clicks "Finish & save", the full conversation is written to Qualtrics embedded data fields and the survey advances.

---

## Repository structure

```
your-repo/
├── index.html                  ← the chat widget (host on GitHub Pages)
├── prompts/
│   ├── pirate.prompt           ← example: pirate dialect
│   ├── aristotle.prompt        ← example: Aristotelian philosopher
│   └── limerick.prompt         ← example: responds only in limericks
└── README.md
```

**Adding a new condition** is a two-step process:
1. Create `prompts/{condition_name}.prompt` — plain text, any content
2. Add a Randomiser branch in Qualtrics that sets `condition = {condition_name}`

No code changes needed.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | The chat widget — host on GitHub Pages |
| `prompts/*.prompt` | Plain-text system prompts, one per condition |
| `qualtrics_iframe_embed.html` | iframe snippet — paste into Qualtrics question body HTML |
| `qualtrics_iframe_javascript.js` | postMessage listener — paste into Qualtrics question JS tab |

---

## Setup

### 1. Host on GitHub Pages

1. Create a GitHub repository
2. Add `index.html` and the `prompts/` folder to the root
3. Go to **Settings → Pages**, set source to `main` branch, root folder
4. Your widget URL will be:
   ```
   https://YOUR-USERNAME.github.io/YOUR-REPO/index.html
   ```
5. Test a condition by visiting directly:
   ```
   https://YOUR-USERNAME.github.io/YOUR-REPO/index.html?key=sk-xxx&model=gpt-4o&condition=pirate&turns=6&temp=0.7
   ```

### 2. Configure Qualtrics Survey Flow

#### Shared Embedded Data block (above the Randomiser)

**Input fields — set values here:**

| Field | Value | Notes |
|---|---|---|
| `llm_api_key` | `sk-...` | Your OpenAI API key |
| `llm_model` | `gpt-4o` | Model name (see supported models below) |
| `llm_max_turns` | `6` | Max exchanges per participant; blank = unlimited |
| `llm_temperature` | `0.3` | 0–1; lower = more consistent behaviour |

**Placeholder fields — declare blank, Randomiser overwrites:**

| Field | Value |
|---|---|
| `condition` | *(blank)* |

**Output fields — declare blank, widget writes to these:**

| Field |
|---|
| `chat_conversation_json` |
| `chat_model` |
| `chat_assistant_id` |
| `chat_thread_id` |
| `chat_total_turns` |
| `chat_system_prompt` |
| `chat_timestamp` |
| `chat_condition` |
| `chat_mode` |
| `chat_temperature` |

#### Randomiser block (below the shared block)

Each branch sets only the fields that vary by condition:

| Field | Value |
|---|---|
| `condition` | Must match a `.prompt` filename exactly (e.g. `sycophantic`) |

Optionally override per-condition:

| Field | Value |
|---|---|
| `llm_model` | Override model for this condition only |
| `llm_temperature` | Override temperature for this condition only |

### 3. Add the chat question

1. Add a **Text/Graphic** question where you want the chat
2. Click `</>` **HTML source** → paste `qualtrics_iframe_embed.html`, substituting your GitHub URL:
   ```html
   <iframe
     id="llm-chat-frame"
     src="https://YOUR-USERNAME.github.io/YOUR-REPO/index.html?key=${e://Field/llm_api_key}&model=${e://Field/llm_model}&aid=${e://Field/llm_assistant_id}&turns=${e://Field/llm_max_turns}&condition=${e://Field/condition}&temp=${e://Field/llm_temperature}"
     style="width:100%; height:640px; border:none; border-radius:12px; display:block;"
     allow="clipboard-write">
   </iframe>
   ```
3. Gear icon → **Add JavaScript** → paste `qualtrics_iframe_javascript.js`

---

## Writing prompt files

Each `.prompt` file is plain text read directly into the model's system prompt. There is no required format — write whatever you would put in a system prompt. Some conventions that work well:

**Put formatting instructions first.** Models weight earlier instructions more heavily. If you want plain prose output, say so at the top before the persona description.

**Use identity framing, not rule lists.** "You are a person who believes X" produces more consistent behaviour than "Your goal is to do X". Give the persona a motivation and a point of view, not just a checklist.

**Explicitly prohibit default behaviours.** GPT models default to markdown formatting, hedging language ("however", "on the other hand"), and ending with "good luck". Name these explicitly if you don't want them.

**Example structure:**
```
RESPONSE FORMAT — MANDATORY: [formatting rules]

PERSONA: [who the model is, what it believes, why it behaves that way]

NEVER USE: [specific words or phrases to suppress]
```

---

## Included example prompts

| File | Behaviour |
|---|---|
| `pirate.prompt` | Responds entirely in pirate dialect — good for testing the prompt system |
| `aristotle.prompt` | Responds as Aristotle — reasoning from first principles, virtue ethics framing |
| `limerick.prompt` | Responds only in limericks — useful for verifying the widget is applying system prompts |

The three novelty prompts (pirate, Aristotle, limerick) are included for testing purposes. Because they produce responses that are unmistakably different from the default, they make it immediately obvious whether the system prompt is being applied correctly. Use `limerick` or `pirate` to verify your setup before running real conditions.

---

## Supported models (completion mode)

| Model | Notes |
|---|---|
| `gpt-4o` | Recommended — good instruction following, strong persona adherence |
| `gpt-4.1` | Current OpenAI recommendation for instruction-following tasks |
| `gpt-4-turbo` | Older but stable |
| `grok-3` | xAI — requires xAI API key |
| `grok-3-mini` | xAI — faster, lower cost |
| `claude-sonnet-4-20250514` | Anthropic — requires Anthropic API key |

Set `llm_model` in your Survey Flow to any of these. To add a new provider, add an entry to the `ENDPOINTS` object in `index.html`.

---

## URL parameter reference

All parameters travel in the iframe URL. Only short, always-present values go here — the system prompt travels via file fetch, not URL.

| Parameter | Qualtrics field | Always present? | Notes |
|---|---|---|---|
| `key` | `llm_api_key` | Yes | API key |
| `model` | `llm_model` | Yes | Model name |
| `condition` | `condition` | Yes | Must match a `.prompt` filename |
| `turns` | `llm_max_turns` | Yes (blank = unlimited) | Max exchanges |
| `temp` | `llm_temperature` | Yes (blank = 0.3) | Temperature |
| `aid` | `llm_assistant_id` | Optional | For Responses API mode (see below) |

---

## Responses API mode (advanced)

The widget also supports OpenAI's Responses API using a Prompt object ID. This mode is for advanced users who want to manage model configuration entirely within the OpenAI platform rather than via `.prompt` files.

Set `llm_assistant_id` to a valid Prompt ID (`pmpt_xxx`) in a Randomiser branch. The widget detects this and routes to the Responses API instead of chat completions. The `.prompt` file is ignored in this mode — system instructions come from the Prompt object definition.

Note: OpenAI Prompt objects are scheduled for deprecation on November 30, 2026. For new studies, the `.prompt` file approach is recommended.

---

## Data recorded per participant

`chat_conversation_json` contains the full conversation as a JSON array:

```json
[
  { "turn": 1, "user": "participant message",  "assistant": "model response" },
  { "turn": 2, "user": "follow-up message",    "assistant": "model response" }
]
```

Additional fields recorded: `chat_model`, `chat_condition`, `chat_mode`, `chat_temperature`, `chat_total_turns`, `chat_timestamp`, `chat_system_prompt`, `chat_assistant_id`, `chat_thread_id`.

### Parsing in R

```r
library(tidyverse)
library(jsonlite)

df <- read_csv("qualtrics_export.csv") |>
  mutate(chat = map(chat_conversation_json, ~ fromJSON(.x))) |>
  unnest_wider(chat)
```

### Parsing in Python

```python
import pandas as pd, json

df = pd.read_csv("qualtrics_export.csv")
df["chat"] = df["chat_conversation_json"].apply(json.loads)
turns = df["chat"].explode().apply(pd.Series)
```

---

## Using a custom or RAG model backend

Deploy a server that exposes an OpenAI-compatible `/v1/chat/completions` endpoint. Add it to the `ENDPOINTS` object in `index.html`:

```javascript
'my-rag-model': 'https://your-backend.com/v1/chat/completions'
```

Set `llm_model = my-rag-model` in your Survey Flow. A minimal FastAPI wrapper:

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import your_pipeline

app = FastAPI()

@app.post("/v1/chat/completions")
async def chat(request: Request):
    body = await request.json()
    messages = body["messages"]
    answer = your_pipeline.generate(
        messages[-1]["content"], history=messages[:-1]
    )
    return JSONResponse({
        "choices": [{"message": {"role": "assistant", "content": answer}}],
        "usage": {"total_tokens": len(answer) // 4}
    })
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Blue "Loading…" never goes away | Prompt file not found or wrong condition name | Check `prompts/{condition}.prompt` exists; condition name is case-sensitive |
| Red error: "Prompt file not found" | Filename doesn't match condition value | Condition `sycophantic` requires `prompts/sycophantic.prompt` exactly |
| Generic response ignoring persona | Prompt file empty or not loading | Visit `https://your-github-pages-url/prompts/{condition}.prompt` directly to confirm it loads |
| API 400: must provide model | `llm_model` empty or not arriving | Check `new URLSearchParams(...).get('model')` in browser console |
| API 401: invalid key | Wrong API key or wrong project | Confirm key in Survey Flow matches the project your model is under |
| API 404: model not found | Invalid model name | Check spelling; see supported models table above |
| Turns counter not incrementing | Finish & save not writing data | Check `chat_conversation_json` is declared in Survey Flow output fields |
| `llm_assistant_id` empty in JS | Field not declared in shared Embedded Data block | Add `llm_assistant_id` as blank field in shared block above Randomiser |
| All conditions respond identically | System prompt not loading | Test condition prompt URL directly in browser |

---

## Security notes

- API keys travel as URL parameters and are visible in the iframe `src` attribute. Acceptable for research use with a rate-limited, project-scoped key.
- For production deployments, use a backend proxy so keys never reach the browser.
- Create project-scoped API keys in OpenAI (Settings → API Keys) to limit exposure.
- OpenAI standard accounts may use conversation data for model training. Use an enterprise agreement or opt out via OpenAI privacy settings if this is a concern for your IRB.
