# Allows models to cache immutable attribtues in order to
# save time consuming calls to dependencies like VACOLS and VBMS.
#
# See cached_attributes_spec.rb for example usage.
#
module CachedAttributes
  extend ActiveSupport::Concern

  def clear_cached_attrs!
    Rails.cache.write(cache_id, nil)
  end

  private

  def cached_values
    json_values = Rails.cache.read(cache_id)
    return {} unless json_values

    JSON.parse(json_values)
  end

  def get_cached_value(attr_name)
    cached_values[attr_name.to_s]
  end

  def set_cached_value(attr_name, value)
    new_cached_values = cached_values.merge(attr_name => value)
    Rails.cache.write(cache_id, new_cached_values.to_json)
    value
  end

  def cache_id
    "#{self.class.name}-cached-values-#{id}"
  end

  module ClassMethods
    def cache_attribute(attr_name)
      alias_method "#{attr_name}_without_cache", attr_name

      define_method attr_name do
        cached_value = get_cached_value(attr_name)

        if cached_value
          Rails.logger.info("Retrieving cached value for #{self.class.name}##{attr_name}")
          return cached_value
        end

        value = send "#{attr_name}_without_cache"
        set_cached_value(attr_name, value)
      end
    end
  end
end
