Qualtrics.SurveyEngine.addOnReady(function() {

  // Hide the Qualtrics Next button until participant clicks "Finish & save".
  // If the button doesn't hide, check the ID — it may be 'NextButton' in
  // older Qualtrics themes. Run document.querySelectorAll('button').forEach(
  // b => console.log(b.id)) in the browser console to find the correct ID.
  function hideNextButton() {
    var btn = document.getElementById('next-button');
    if (btn) {
      btn.style.display = 'none';
    } else {
      setTimeout(hideNextButton, 100);
    }
  }
  hideNextButton();

  var frame = document.getElementById('llm-chat-frame');

  // Config is sent via postMessage — not via URL — to avoid encoding issues
  // with long or special-character values like system prompts.
  var config = {
    model:        "${e://Field/llm_model|js}",
    assistantId:  "${e://Field/llm_assistant_id|js}",
    systemPrompt: "${e://Field/llm_system_prompt|js}",
    condition:    "${e://Field/condition|js}",
    temperature:  "${e://Field/llm_temperature|js}"
  };

  function sendConfig() {
    frame.contentWindow.postMessage({ type: 'llm_chat_config', config: config }, '*');
  }

  // Send immediately and again whenever the iframe signals it is ready,
  // to handle timing differences between iframe load and JS tab execution.
  sendConfig();

  window.addEventListener('message', function(e) {

    if (e.data && e.data.type === 'llm_chat_ready') {
      sendConfig();
    }

    // Write conversation data to embedded fields after every turn and on finish.
    // Fields must be declared as __js_* in the Survey Flow (New Experience requirement).
    if (e.data && (e.data.type === 'llm_chat_update' || e.data.type === 'llm_chat_finished')) {
      var p = e.data.data;
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_conversation_json', JSON.stringify(p.conversation));
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_model',             p.metadata.model);
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_assistant_id',      p.metadata.assistantId);
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_thread_id',         p.metadata.threadId);
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_total_turns',       String(p.metadata.totalTurns));
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_system_prompt',     p.metadata.systemPrompt);
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_timestamp',         p.metadata.timestamp);
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_condition',         p.metadata.condition);
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_mode',              p.metadata.mode);
      Qualtrics.SurveyEngine.setJSEmbeddedData('chat_temperature',       String(p.metadata.temperature));
    }

    // On finish: show Next button and advance the survey.
    if (e.data && e.data.type === 'llm_chat_finished') {
      var btn = document.getElementById('next-button');
      if (btn) btn.style.display = '';
      setTimeout(function() {
        Qualtrics.SurveyEngine.navClick(null, 'NEXT');
      }, 400);
    }

  });

});
