# Qualtrics LLM Chat Widget

Embed a multi-turn LLM chat interface inside a Qualtrics survey, with full conversation data recorded in embedded data fields for export and analysis.

Built for researchers who want to study human–AI interaction within a controlled survey context. Supports multiple API backends and experimental conditions, with the ability to vary model behaviour across participants via randomisation.

---

## How it works

A chat interface is hosted on GitHub Pages and embedded in a Qualtrics survey via an `<iframe>`. Qualtrics pipes configuration values (API key, assistant ID, turn limit, condition label) into the iframe URL at render time. Values that could be blank in some conditions (model name, system prompt) are sent to the iframe via `postMessage` from the Qualtrics JS tab rather than the URL, preventing blank parameters from corrupting the URL string. When the participant finishes the chat, the hosted page sends the full conversation back to Qualtrics via `postMessage`, where a JS listener writes it to embedded data fields that appear in the survey export.

```
Qualtrics Survey
│
├── Survey Flow: Randomiser
│   ├── Branch A → condition = A, llm_assistant_id = asst_xxx
│   ├── Branch B → condition = B, llm_assistant_id = asst_xxx
│   └── Branch C → condition = C, llm_assistant_id = asst_xxx
│
├── Survey Flow: Shared Embedded Data
│   └── llm_api_key, llm_max_turns, + output fields
│
├── Question: iframe → GitHub Pages/index.html
│   │         ?key=...&aid=...&turns=...&condition=...
│   │
│   └── postMessage (llm_chat_finished)
│           ↓
└── Question JS tab: writes data to embedded fields → advances survey
```

---

## Two API paths

The widget supports two modes selected automatically based on which fields are populated:

### Assistant mode
Uses the OpenAI Assistants API. The system prompt and model settings are baked into a pre-created Assistant object on OpenAI's platform — the widget passes only the assistant ID. This produces more consistent and reliable behavioural differentiation across conditions than passing system prompts at runtime, because the model's behaviour is set at the assistant level rather than overridable by RLHF training defaults.

**Use this when:** you need consistent, distinct behavioural profiles across experimental conditions.

### Completion mode
Uses the standard chat completions API (OpenAI, xAI/Grok, Anthropic, or any OpenAI-compatible endpoint including custom/RAG backends). The model and system prompt are passed via postMessage from the Qualtrics JS tab.

**Use this when:** you are testing different models, using a custom or fine-tuned backend, or running a standard unmodified model condition.

**Routing logic:** if the `aid` URL parameter starts with `asst_` → Assistant mode. Otherwise → completion mode. The two modes can be mixed across conditions in the same study.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | The chat widget — host this on GitHub Pages |
| `qualtrics_iframe_embed.html` | iframe snippet — paste into Qualtrics question body HTML |
| `qualtrics_iframe_javascript.js` | postMessage listener — paste into Qualtrics question JS tab |

---

## Setup

### 1. (Assistant mode only) Create OpenAI Assistants

For each condition that requires a distinct behavioural profile:

1. Go to [platform.openai.com](https://platform.openai.com) → Assistants
2. Create one Assistant per condition
3. For each, set:
   - **System instructions**: your condition-specific persona or instruction prompt
   - **Model**: `gpt-4-turbo` (recommended — follows instructions more reliably than gpt-4o)
   - **Temperature**: `0.3` (lower temperature produces more consistent within-condition behaviour)
   - **Top P**: `0.9`
4. Copy each Assistant ID (`asst_xxxxxxxxxxxx`)

### 2. Host the chat widget on GitHub Pages

1. Create a GitHub repository
2. Add `index.html` to the root
3. Go to **Settings → Pages**, set source to `main` branch, root folder
4. Your widget URL will be:
   ```
   https://YOUR-USERNAME.github.io/YOUR-REPO/index.html
   ```
5. Test by visiting with parameters directly in a browser:
   ```
   https://YOUR-USERNAME.github.io/YOUR-REPO/index.html?key=sk-xxx&aid=asst_xxx&turns=6&condition=test
   ```

### 3. Configure Qualtrics Survey Flow

#### Randomiser block (one branch per condition)

Each branch sets the fields that vary by condition:

**Assistant mode condition:**

| Field | Value |
|---|---|
| `condition` | Your condition label (e.g. `A`, `treatment`, `control`) |
| `llm_assistant_id` | `asst_xxxxxxxxxxxx` for that condition |

**Completion mode condition:**

| Field | Value |
|---|---|
| `condition` | Your condition label |
| `llm_assistant_id` | (leave blank) |
| `llm_model` | e.g. `gpt-4-turbo`, `grok-3`, `claude-sonnet-4-20250514` |
| `llm_system_prompt` | Your system prompt text (safe to include apostrophes — sent via postMessage with `\|js` filter) |

#### Shared Embedded Data block (below Randomiser, above question block)

**Input fields** (set values here):

| Field | Value |
|---|---|
| `llm_api_key` | Your API key |
| `llm_max_turns` | Max exchanges per participant (leave blank for unlimited) |

**Output fields** (leave values blank — widget writes to these at runtime):

| Field | Contents |
|---|---|
| `chat_conversation_json` | Full conversation as JSON array |
| `chat_model` | Model name used |
| `chat_assistant_id` | OpenAI Assistant ID used (if applicable) |
| `chat_thread_id` | OpenAI thread ID (allows retrieval from OpenAI platform) |
| `chat_total_turns` | Number of exchanges completed |
| `chat_system_prompt` | System prompt used (completion mode only) |
| `chat_timestamp` | ISO timestamp of conversation end |
| `chat_condition` | Condition label assigned to this participant |
| `chat_mode` | `assistant` or `completion` |

### 4. Add the chat question

1. Add a **Text/Graphic** question where you want the chat to appear
2. Click `</>` **HTML source** → paste `qualtrics_iframe_embed.html`, substituting your GitHub URL:
   ```html
   <iframe
     id="llm-chat-frame"
     src="https://YOUR-USERNAME.github.io/YOUR-REPO/index.html?key=${e://Field/llm_api_key}&aid=${e://Field/llm_assistant_id}&turns=${e://Field/llm_max_turns}&condition=${e://Field/condition}"
     style="width:100%; height:640px; border:none; border-radius:12px; display:block;"
     allow="clipboard-write">
   </iframe>
   ```
3. Gear icon → **Add JavaScript** → paste `qualtrics_iframe_javascript.js` contents

---

## URL parameter design

Only values that are **always non-blank** should go in the iframe URL. A blank parameter corrupts the URL string and strips all subsequent parameters, breaking the widget.

| Parameter | Transport | Always present? | Notes |
|---|---|---|---|
| `key` | URL | Yes | API key |
| `aid` | URL | Yes (blank for completion) | Widget checks `startsWith('asst_')` so blank is safe |
| `turns` | URL | Yes (blank = unlimited) | Handled safely when blank |
| `condition` | URL | Yes | Condition label |
| `model` | postMessage | No — blank in assistant conditions | Never put in URL |
| `systemPrompt` | postMessage | No — blank in assistant conditions | Never put in URL; also avoids encoding issues with long text |

---

## Supported models (completion mode)

| Provider | Model value |
|---|---|
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| xAI | `grok-3`, `grok-3-mini` |
| Anthropic | `claude-sonnet-4-20250514` |
| Custom / RAG | Any OpenAI-compatible endpoint (see below) |

To add a new model, add an entry to the `ENDPOINTS` object in `index.html`:
```javascript
'your-model-name': 'https://api.provider.com/v1/chat/completions'
```

---

## Experimental design

### Varying model behaviour across conditions (Assistant mode)

Pre-create one OpenAI Assistant per condition with distinct System Instructions. The key levers are:

- **Persona framing** — define the assistant as a specific type of person with a motivation, not just a set of rules. Models follow identity-based instructions more reliably than behavioural constraints.
- **Explicit phrase prohibition** — list specific words or phrases the model should never use. This prevents drift toward trained defaults (e.g. GPT defaults to "however", "that said", "good luck" regardless of instructions).
- **Low temperature (0.3)** — critical for consistent within-condition behaviour across participants.

### Varying models across conditions (completion mode)

Use the Randomiser to assign different `llm_model` values per branch. The iframe URL, JS tab, and widget code require no changes — only the Survey Flow field values change.

### Mixing assistant and completion conditions

You can run assistant conditions and completion conditions in the same study. The widget routes automatically based on whether `aid` contains a valid assistant ID. For example:

```
Randomiser
├── Branch A → llm_assistant_id = asst_xxx  (assistant mode)
├── Branch B → llm_model = gpt-4-turbo      (completion mode, unmodified)
└── Branch C → llm_model = grok-3           (completion mode, different provider)
```

---

## Data recorded per participant

`chat_conversation_json` contains the full conversation as a JSON array:

```json
[
  { "turn": 1, "user": "participant message",  "assistant": "model response" },
  { "turn": 2, "user": "follow-up message",    "assistant": "model response" }
]
```

Additional fields recorded: `chat_model`, `chat_assistant_id`, `chat_thread_id`, `chat_total_turns`, `chat_system_prompt`, `chat_timestamp`, `chat_condition`, `chat_mode`.

The `chat_thread_id` field records the OpenAI thread ID, which allows you to retrieve the full conversation directly from the OpenAI platform independently of Qualtrics.

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

Deploy a server that exposes an OpenAI-compatible endpoint:

```
POST https://your-backend.com/v1/chat/completions
Authorization: Bearer <your-internal-token>
Content-Type: application/json

{
  "model": "your-model-name",
  "messages": [{"role": "user", "content": "..."}],
  "max_tokens": 1024
}
```

In your Survey Flow set:
- `llm_assistant_id` → blank
- `llm_model` → your model name
- Add `&endpoint=https://your-backend.com/v1/chat/completions` to the iframe URL

A minimal FastAPI wrapper:

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import your_pipeline

app = FastAPI()

@app.post("/v1/chat/completions")
async def chat(request: Request):
    body = await request.json()
    messages = body["messages"]
    user_text = messages[-1]["content"]
    history   = messages[:-1]
    answer = your_pipeline.generate(user_text, history=history)
    return JSONResponse({
        "choices": [{"message": {"role": "assistant", "content": answer}}],
        "usage":   {"total_tokens": len(answer) // 4}
    })
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Mode shows `completion` instead of `assistant` | `aid` URL param not arriving or not starting with `asst_` | Run `new URLSearchParams(window.location.search).get('aid')` in browser console on the preview page |
| API 400: must provide model parameter | Falling into completion path with no model set | Assistant ID not routing correctly — see above |
| API 404: no assistant found | API key belongs to different account or project than the assistant | Ensure key and assistant are under the same OpenAI project |
| `llm_assistant_id` empty in JS tab | Field not declared in shared Embedded Data block | Add `llm_assistant_id` as a blank field in the shared block below the Randomiser |
| All conditions respond identically | System prompt overridden by model's training defaults | Switch to Assistant mode with Temperature 0.3 |
| URL parameters not arriving in iframe | Blank parameters corrupting URL string | Never put potentially-blank fields in the URL — use postMessage |
| Pipe value contains literal `${e://Field/...}` | Embedded Data block is below the question block in Survey Flow | Move all Embedded Data blocks above the question block |
| postMessage config not reaching iframe | Timing issue — iframe loaded before Qualtrics JS tab registered | Widget retries `llm_chat_ready` every 500ms; JS tab sends config immediately on load as fallback |

---

## Security notes

- API keys are passed as URL parameters and visible in the iframe `src` attribute in page source. Acceptable for research use with a rate-limited, project-scoped API key.
- For production deployments with sensitive keys, use a backend proxy so keys never reach the browser.
- Create project-scoped API keys in OpenAI (Settings → API Keys) to limit the blast radius if a key is exposed.
- OpenAI standard API accounts may use conversation data for training. Use an enterprise agreement or opt out via OpenAI privacy settings if this is a concern for your IRB or data governance requirements.
