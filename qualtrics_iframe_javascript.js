Qualtrics.SurveyEngine.addOnReady(function() {

  document.getElementById('NextButton').style.display = 'none';

  var frame = document.getElementById('llm-chat-frame');

  var model        = "${e://Field/llm_model|js}";
  var assistantId  = "${e://Field/llm_assistant_id|js}";
  var systemPrompt = "${e://Field/llm_system_prompt|js}";
  var condition    = "${e://Field/condition|js}";

  var config = {
    model:        model,
    assistantId:  assistantId,
    systemPrompt: systemPrompt,
    condition:    condition
  };

  function sendConfig() {
    frame.contentWindow.postMessage({ type: 'llm_chat_config', config: config }, '*');
  }

  // Send config immediately and on every llm_chat_ready signal.
  // The iframe retries llm_chat_ready every 500ms until it gets
  // a response, so one of these calls will always get through.
  sendConfig();

  window.addEventListener('message', function(e) {

    // Respond to ready signal from iframe
    if (e.data && e.data.type === 'llm_chat_ready') {
      sendConfig();
    }

    // Write data to embedded fields on every turn
    if (e.data && (e.data.type === 'llm_chat_update' || e.data.type === 'llm_chat_finished')) {
      var p = e.data.data;
      Qualtrics.SurveyEngine.setEmbeddedData('chat_conversation_json', JSON.stringify(p.conversation));
      Qualtrics.SurveyEngine.setEmbeddedData('chat_model',             p.metadata.model);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_assistant_id',      p.metadata.assistantId);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_thread_id',         p.metadata.threadId);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_total_turns',       String(p.metadata.totalTurns));
      Qualtrics.SurveyEngine.setEmbeddedData('chat_system_prompt',     p.metadata.systemPrompt);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_timestamp',         p.metadata.timestamp);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_condition',         p.metadata.condition);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_mode',              p.metadata.mode);
    }

    // Advance survey on finish
    if (e.data && e.data.type === 'llm_chat_finished') {
      document.getElementById('NextButton').style.display = '';
      setTimeout(function() {
        Qualtrics.SurveyEngine.navClick(null, 'NEXT');
      }, 400);
    }

  });

});
