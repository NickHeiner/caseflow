class EstablishClaim < Task
  attr_accessor :show_textbox
  attr_accessor :email_address
  attr_accessor :limited_textbox

  def start_text
    "Establish Next Claim"
  end
end
