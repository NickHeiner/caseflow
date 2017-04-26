class Task < ActiveRecord::Base
  include AASM

  belongs_to :user
  belongs_to :appeal

  validate :no_open_tasks_for_appeal, on: :create

  class MustImplementInSubclassError < StandardError; end
  class UserAlreadyHasTaskError < StandardError; end

  enum completion_status: {
    routed_to_arc: 0,
    canceled: 1,
    expired: 2,
    routed_to_ro: 3,
    assigned_existing_ep: 4,
    special_issue_emailed: 5,
    special_issue_vacols_routed: 7,
    invalidated: 8,

    # These statuses are not in use anymore
    special_issue_not_emailed: 6
  }

  # Use this to define custom completion status texts
  COMPLETION_STATUS_TEXT = {
    routed_to_arc: "EP created for ARC - 397",
    assigned_existing_ep: "Assigned Existing EP",
    special_issue_vacols_routed: "Routed in VACOLS",
    expired: "Released to Work Queue"
  }.freeze

  REASSIGN_OLD_TASKS = [:EstablishClaim].freeze

  class << self
    # Returns either the users currently assigned task, or
    # assigns the next assignable task to the user.
    def assign_next_to!(user)
      user.current_task(self) || find_and_assign_next!(user)
    end

    def any_assignable_to?(user)
      !(user.current_task(self).nil? && next_assignable.nil?)
    end

    def completed_by(user)
      where(user_id: user.id, aasm_state: "completed")
    end

    def assigned_not_completed
      to_complete.where.not(assigned_at: nil)
    end

    def newest_first
      order(created_at: :desc)
    end

    def oldest_first
      order(created_at: :asc)
    end

    def completed_today
      where(aasm_state: "completed", completed_at: Time.zone.now.beginning_of_day..Time.zone.now.end_of_day)
    end

    def completed_today_by_user(user_id)
      completed_today.where(user_id: user_id)
    end

    def to_complete
      where.not(aasm_state: "completed").where.not(aasm_state: "unprepared")
    end

    def completed_success
      where(completion_status: [0, 3, 4, 5, 7])
    end

    def to_complete_task_for_appeal(appeal)
      to_complete.where(appeal: appeal)
    end

    def tasks_completed_by_users(tasks)
      tasks.each_with_object({}) do |task, user_numbers|
        user_numbers[task.user.full_name] = (user_numbers[task.user.full_name] || 0) + 1
      end
    end

    # Generic relation method for joining the result of the task
    # ie: EstablishClaim.joins(:claim_establishment)
    def joins_task_result
      fail MustImplementInSubclassError
    end

    private

    def find_and_assign_next!(user)
      next_assignable.tap { |task| task && task.assign!(user) }
    end

    def next_assignable
      assignable.oldest_first.find(&:should_assign?)
    end

    def assignable
      where(user_id: nil, aasm_state: "unassigned")
    end
  end

  aasm do
    state :unprepared, initial: true
    state :unassigned, :assigned, :started, :reviewed, :completed

    ## The 'unprepared' state is being used for establish claim tasks to designate
    #  tasks attached to appeals that do not have decision documents. Tasks that are
    #  in this state cannot be assigned to users. All tasks are in this state
    #  immediately after creation.
    event :prepare do
      transitions from: :unprepared, to: :unassigned
    end

    event :assign do
      before { |*args| assign_user(*args) }

      transitions from: :unassigned, to: :assigned
    end

    event :start do
      before :before_started
      transitions from: :assigned, to: :started
    end

    # The 'review' state is being used for establish claim tasks to designate that an
    # external action has been completed, and we want to the user to perform one more
    # action or review the external action. In the case of establish claim we're letting
    # them add a note to VBMS
    event :review do
      before { |*args| assign_review_attributes(*args) }

      transitions from: :started, to: :reviewed
    end

    event :complete do
      before { |*args| assign_completion_attribtues(*args); }
      success :recalculate_quota_assignees!

      transitions from: :reviewed, to: :completed
      transitions from: :started, to: :completed
    end

    event :invalidate do
      before :before_invalidation
      transitions to: :completed
    end
  end

  def expire!
    transaction do
      complete!(status: :expired)
      recreate!
    end
  end

  def cancel!(feedback = nil)
    assign_attributes(comment: feedback)

    complete!(status: :canceled)
  end

  def progress_status
    {
      assigned: "Not Started",
      started: "In Progress",
      reviewed: "In Progress",
      completed: "Completed"
    }[aasm_state.to_sym] || "Unassigned"
  end

  def days_since_creation
    (Time.zone.now - created_at).to_i / 1.day
  end

  def completion_status_text
    completion_status ? (COMPLETION_STATUS_TEXT[completion_status.to_sym] || completion_status.titleize) : ""
  end

  def attributes
    super.merge(type: type)
  end

  # There are some additional criteria we need to know from our dependencies
  # whether a task is assignable by the current_user.
  def should_assign?
    appeal.can_be_accessed_by_current_user? && !check_and_invalidate!
  end

  def vbms_id
    appeal.sanitized_vbms_id
  end

  private

  def recreate!
    self.class.create!(appeal_id: appeal_id, type: type)
  end

  def assign_review_attributes(outgoing_reference_id: nil)
    assign_attributes(outgoing_reference_id: outgoing_reference_id)
  end

  def assign_completion_attribtues(status:, outgoing_reference_id: nil)
    assign_review_attributes(outgoing_reference_id: outgoing_reference_id) unless reviewed?

    assign_attributes(
      completed_at: Time.now.utc,
      completion_status: status
    )
  end

  def assign_user(user)
    fail(UserAlreadyHasTaskError) if user.tasks.to_complete.where(type: type).count > 0

    assign_attributes(
      user: user,
      assigned_at: Time.now.utc
    )
  end

  def before_started
    assign_attributes(started_at: Time.now.utc)
  end

  def before_invalidation
    assign_attributes(completion_status: :invalidated)
  end

  def recalculate_quota_assignees!
    quota.recalculate_assignee_count!
  end

  def quota
    Quota.new(date: Time.zone.today, task_klass: self.class)
  end

  def check_and_invalidate!
    invalidate! if should_invalidate?
    invalidated?
  end

  # Changes in VACOLS or VBMS can cause tasks to become invalid.
  # This is a method for determining that. It can be overridden by subclasses.
  def should_invalidate?
    false
  end

  def no_open_tasks_for_appeal
    if self.class.to_complete_task_for_appeal(appeal).count > 0
      errors.add(:appeal, "Uncompleted task already exists for this appeal")
    end
  end
end
