Qualtrics.SurveyEngine.addOnReady(function() {

  // Hide Next button until participant clicks Finish & save
  document.getElementById('NextButton').style.display = 'none';

  // Listen for messages from the hosted chat iframe
  window.addEventListener('message', function(e) {

    // Ignore messages that aren't from our chat widget
    if (!e.data || !e.data.type) return;

    if (e.data.type === 'llm_chat_update' || e.data.type === 'llm_chat_finished') {
      var p = e.data.data;

      // Write conversation data to Qualtrics embedded data fields
      Qualtrics.SurveyEngine.setEmbeddedData('chat_conversation_json', JSON.stringify(p.conversation));
      Qualtrics.SurveyEngine.setEmbeddedData('chat_model',             p.metadata.model);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_total_turns',       String(p.metadata.totalTurns));
      Qualtrics.SurveyEngine.setEmbeddedData('chat_system_prompt',     p.metadata.systemPrompt);
      Qualtrics.SurveyEngine.setEmbeddedData('chat_timestamp',         p.metadata.timestamp);
    }

    // Advance survey when participant clicks Finish & save
    if (e.data.type === 'llm_chat_finished') {
      document.getElementById('NextButton').style.display = '';
      setTimeout(function() {
        Qualtrics.SurveyEngine.navClick(null, 'NEXT');
      }, 400);
    }

  });

});
