class AuthenticationService
  def self.default_user_session
    nil
  end

  def self.authenticate_vacols(regional_office, password)
    db = Rails.application.config.database_configuration["#{Rails.env}_vacols"]

    begin
      oci = OCI8.new(regional_office, password, "#{db['host']}:#{db['port']}/#{db['database']}")
    rescue OCIError
      return false
    end

    oci.logoff
    true
  end
end
