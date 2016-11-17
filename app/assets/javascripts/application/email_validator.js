window.EmailValidator = (function($) {
  let emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i

  return function($field) {
    var $validation, $inputField;

    function onInput() {
      var text = $inputField.val();

      emailRegex.exec(text) ? message = "" : message = "Not a valid email.";

      $validation.html(message);
    }

    $inputField = $field.find("input, textarea");
    $validation = $("<span class='cf-validation'></span>");
    $field.append($validation);


    $inputField.on('input change keyup paste mouseup', onInput);
  };
})($);