Qualtrics.SurveyEngine.addOnReady(function() {

  // Hide Next button — Finish & save advances the survey instead
  document.getElementById('NextButton').style.display = 'none';

  var frame = document.getElementById('llm-chat-frame');

  // System prompt is read here from the Qualtrics pipe and sent to
  // the iframe via postMessage — NOT via the URL — so special
  // characters, apostrophes, and long text all arrive intact.
  var systemPrompt = '${e://Field/llm_system_prompt}';
  var condition    = '${e://Field/condition}';

  window.addEventListener('message', function(e) {

    // Step 1: iframe signals it loaded — send system prompt immediately
    if (e.data && e.data.type === 'llm_chat_ready') {
      frame.contentWindow.postMessage({
        type: 'llm_chat_config',
        config: {
          systemPrompt: systemPrompt,
          condition:    condition
        }
      }, '*');
    }

    // Step 2: save data to embedded fields on every turn
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
