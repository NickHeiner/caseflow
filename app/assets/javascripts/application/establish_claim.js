//= require jquery
//= require application/form.js

(function(){
  window.EstablishClaim = function() {
    this.processState = function() {
      this.state.question3.show = this.state.question2.value == "Yes";
      
      Form.prototype.processState.call(this);

      return this.state;
    };

    ["3"].forEach(function(questionNumber) {
      new window.CharacterCounter(Form.$question(questionNumber));
    });

    ["1"].forEach(function(questionNumber) {
      new window.EmailValidator(Form.$question(questionNumber));
    });

    interactiveQuestions = [
      "1", "3"
    ];

    requiredQuestions = {
      "2":   { message: "" }
    };

    Form.call(this, "establishClaim", interactiveQuestions, requiredQuestions);

  };

  EstablishClaim.prototype = Object.create(Form.prototype);
  EstablishClaim.prototype.constructor = EstablishClaim;
})();
