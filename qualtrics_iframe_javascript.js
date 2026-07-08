Qualtrics.SurveyEngine.addOnReady(function() {

  // Hide Next button — Finish & save advances the survey instead
  document.getElementById('NextButton').style.display = 'none';

  // Read sensitive config from embedded data fields.
  // These are passed to the iframe via postMessage — NOT via the URL —
  // so long system prompts with special characters arrive intact.
  var config = {
    apiKey:       '${e://Field/llm_api_key}',
    model:        '${e://Field/llm_model}',
    systemPrompt: '${e://Field/llm_system_prompt}',
    maxTurns:     '${e://Field/llm_max_turns}',
    condition:    '${e://Field/condition}'
  };

  var frame = document.getElementById('llm-chat-frame');

  // ── Handshake ─────────────────────────────────────────────
  // The iframe posts 'llm_chat_ready' when it has loaded.
  // We respond with the config. Using a handshake (rather than
  // posting immediately) ensures the iframe listener is ready.
  window.addEventListener('message', function(e) {

    // Step 1: iframe signals it is ready — send config
    if (e.data && e.data.type === 'llm_chat_ready') {
      frame.contentWindow.postMessage({
        type:   'llm_chat_config',
        config: config
      }, '*');
    }

    // Step 2: write data to embedded fields on every turn
    if (e.data && (e.data.type === 'llm_chat_update' || e.data.type === 'llm_chat_finished')) {
      var p = e.data.data;
      Qualtrics.SurveyEngine.setEmbeddedData('chat_conversation_json', JSON.stringify(p.conversation));
      Qualtrics.SurveyEngine.setEmbeddedData('chat_model',             p.metadata.model);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_total_turns',       String(p.metadata.totalTurns));
      Qualtrics.SurveyEngine.setEmbeddedData('chat_system_prompt',     p.metadata.systemPrompt);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_timestamp',         p.metadata.timestamp);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_condition',         p.metadata.condition);
    }

    // Step 3: advance survey when participant clicks Finish & save
    if (e.data && e.data.type === 'llm_chat_finished') {
      document.getElementById('NextButton').style.display = '';
      setTimeout(function() {
        Qualtrics.SurveyEngine.navClick(null, 'NEXT');
      }, 400);
    }

  });

});
