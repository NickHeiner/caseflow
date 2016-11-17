//= require jquery
//= require application/form.js

(function(){
  window.Form8 = function() {
    
    interactiveQuestions = [
      "5A", "5B",
      "6A", "6B",
      "7A", "7B",
      "8A2", "8A3", "8B1", "8B2", "8C",
      "9A", "9B",
      "10A", "10B1", "10B2", "10C",
      "11A", "11B",
      "132"
    ];

    requiredQuestions = {
      "2":   { message: "" },
      "3":   { message: "Please enter the veteran's full name." },
      "5B":  { message: "Please enter the date of notification." },
      "6B":  { message: "Please enter the date of notification." },
      "7B":  { message: "Please enter the date of notification." },
      "8A1": { message: "Please enter the representative name." },
      "8A2": { message: Form.DEFAULT_RADIO_ERROR_MESSAGE },
      "8A3": { message: "" },
      "8B2": { message: "Please provide the location." },
      "8C":  { message: "" },
      "9A":  { message: Form.DEFAULT_RADIO_ERROR_MESSAGE },
      "9B":  { message: Form.DEFAULT_RADIO_ERROR_MESSAGE },
      "10A": { message: Form.DEFAULT_RADIO_ERROR_MESSAGE },
      "10B2": { message: Form.DEFAULT_RADIO_ERROR_MESSAGE },
      "11A": { message: Form.DEFAULT_RADIO_ERROR_MESSAGE },
      "11B": { message: Form.DEFAULT_RADIO_ERROR_MESSAGE },
      "12A": { message: "Please enter the date of the statement of the case." },
      "12B": { message: Form.DEFAULT_RADIO_ERROR_MESSAGE },
      "15":  { message: "" },
      "16":  { message: "" },
      "17A": { message: "Please enter the name of the Certifying Official (usually your name)." },
      "17B": { message: "Please enter the title of the Certifying Official (e.g. Decision Review Officer)." },
      "17C": { message: "" }
    };

    this.fetchState = function() {
      Form.prototype.fetchState.call(this)

      this.state.question13other = ($("#question13 #form8_record_other:checked").length === 1);
    };

    this.processState = function() {
      var state = this.state;
      var self = this;

      state.question5B.show = !!state.question5A.value;
      state.question6B.show = !!state.question6A.value;
      state.question7B.show = !!state.question7A.value;

      ["8A3", "8C", "9A", "9B"].forEach(function(questionNumber) {
        state["question" + questionNumber].show = false;
      });

      switch (state.question8A2.value) {
      case "Agent":
        state.question8C.show = true;
        break;
      case "Organization":
        state.question9A.show = true;
        state.question9B.show = (state.question9A.value === "No");
        break;
      case "Other":
        state.question8A3.show = true;
      }

      state.question8B2.show = (state.question8B1.value === "Certification that valid POA is in another VA file");
      state.question10B1.show = state.question10C.show = (state.question10A.value === "Yes");
      state.question10B2.show = (state.question10B1.value === "Yes");
      state.question11B.show = (state.question11A.value === "Yes");
      state.question132.show = state.question13other;
      
      Form.prototype.processState.call(this);

      return state;
    };

    ["5A", "6A", "7A", "14"].forEach(function(questionNumber) {
      new window.CharacterCounter(Form.$question(questionNumber));
    });

    Form.call(this, "form8", interactiveQuestions, requiredQuestions);
  };

  Form8.prototype = Object.create(Form.prototype);
  Form8.prototype.constructor = Form8;
})();


