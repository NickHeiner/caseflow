//= require jquery

(function(){
  window.Form = function(form_id, interactiveQuestions, requiredQuestions) {
    this.interactiveQuestions = interactiveQuestions;
    this.requiredQuestions = requiredQuestions;
    
    this.toggleQuestion = function(questionNumber) {
      var $q = Form.$question(questionNumber);
      var hideQuestion = !this.state["question" + questionNumber].show;

      $q.toggleClass('hidden-field', hideQuestion);
      $q.find('input, textarea').prop('disabled', hideQuestion);
    };

    var self = this;
    window.DateField.init();

    this.initState();
    this.reevalulate();


    $("#"+form_id+" input, #"+form_id+" textarea").on("change keyup paste mouseup", function() {
      return self.reevalulate();
    });

    $("#"+form_id).on("submit", function() {
      return self.onSubmit();
    });

    this.getRequiredQuestions().forEach(function(questionNumber) {
      Form.$question(questionNumber).find(".question-label").append(
        $("<span class='cf-required'> (Required)</span>")
      );
    });
  };

  Form.prototype = {
    getRequiredQuestions: function() {
      return Object.keys(this.requiredQuestions);
    },

    getWatchedQuestions: function() {
      if(this.watchedQuestions) { return this.watchedQuestions; }

      this.watchedQuestions = $.unique(this.interactiveQuestions.concat(this.getRequiredQuestions()));
      return this.watchedQuestions;
    },

    initState: function() {
      this.state = {};
      var state = this.state;

      this.getWatchedQuestions().forEach(function(questionNumber) {
        state["question" + questionNumber] = { show: true };
      });
    },

    fetchState: function() {
      var state = this.state;

      this.getWatchedQuestions().forEach(function(questionNumber) {
        state["question" + questionNumber].value = Form.questionValue(questionNumber);
      });

      state.question13other = ($("#question13 #form8_record_other:checked").length === 1);
    },

    processState: function() {
      var state = this.state;
      var self = this;

      this.getRequiredQuestions().forEach(function(questionNumber) {
        self.validateRequiredQuestion(questionNumber, false);
      });

      return state;
    },

    validateRequiredQuestion: function(questionNumber, showError) {
      var questionState = this.state["question" + questionNumber];
      var isValid = !!questionState.value || !questionState.show;

      if(isValid) {
        questionState.error = null;
      }
      else if(showError) {
        questionState.error = this.requiredQuestions[questionNumber];
      }

      return isValid;
    },

    getInvalidQuestionNumbers: function() {
      var self = this;

      var invalidQuestionNumbers = this.getRequiredQuestions().filter(function(questionNumber){
        return !self.validateRequiredQuestion(questionNumber, true);
      });

      return invalidQuestionNumbers;
    },

    render: function() {
      var self = this;

      this.getRequiredQuestions().forEach(function(questionNumber) {
        var error = self.state["question" + questionNumber].error;
        var errorMessage = error ? error.message : "";
        var $q = Form.$question(questionNumber);

        $q.find(".usa-input-error-message").html(errorMessage);
        $q.toggleClass("usa-input-error", !!error);
      });

      this.interactiveQuestions.forEach(function(questionNumber) {
        self.toggleQuestion(questionNumber);
      });
    },

    reevalulate: function() {
      this.fetchState();
      this.processState();
      this.render();
    },

    onSubmit: function() {
      this.fetchState();
      var invalidQuestionNumbers = this.getInvalidQuestionNumbers();
      this.render();

      if (invalidQuestionNumbers.length > 0) {
        // invalid, focus first invalid field
        Form.$question(invalidQuestionNumbers[0]).find("input, textarea, select").first().focus();

        // remove loading style
        $(".cf-form").removeClass("cf-is-loading");
      }

      return invalidQuestionNumbers.length === 0;
    }
  };

  Form.DEFAULT_RADIO_ERROR_MESSAGE = "Oops! Looks like you missed one! Please select one of these options.";
  Form.$question = function (questionNumber) {
    return $("#question" + questionNumber);
  }
  Form.questionValue = function(questionNumber) {
    return Form.$question(questionNumber).find("input[type='text'], textarea, input[type='radio']:checked").val();
  }
})();


