require "rails_helper"

RSpec.feature "Confirm Certification" do
  before do
    Timecop.freeze(Time.utc(2015, 1, 1, 12, 0, 0))
    User.authenticate!
    Form8.pdf_service = FakePdfService

    Fakes::AppealRepository.records = {
      "5555C" => Fakes::AppealRepository.appeal_ready_to_certify,
      ENV["TEST_APPEAL_ID"] => Fakes::AppealRepository.appeal_ready_to_certify
    }

    certification = Certification.create!(vacols_id: "5555C")
    form8 = Form8.create!(certification_id: certification.id)
    form8.assign_attributes_from_appeal(certification.appeal)
    form8.save
    certification.form8.save_pdf!
  end

  scenario "Screen reader user visits pdf link" do
    visit "certifications/5555C"

    # We want this content to only appear for screen reader users, so
    # it will not be visible, but it **should** be in the DOM.
    expect(page).to have_text(:all, "The PDF viewer in your browser may not be accessible.")
    expect(page).to have_css(".usa-sr-only", visible: false)

    # Sending click or keypress events to elements that are not in the DOM doesn't seem to work,
    # so let's find the hidden link's href and visit it manually to check that the pdf can be
    # found there.
    pdf_href = page.find("#sr-download-link", visible: false)[:href]
    expect(pdf_href).to include("/5555C/pdf")
  end

  scenario "Successful confirmation" do
    visit "certifications/5555C"
    expect(page).to have_content("Review Form 8")
    click_on "Upload and certify"

    expect(Fakes::AppealRepository.certified_appeal).to_not be_nil
    expect(Fakes::AppealRepository.certified_appeal.vacols_id).to eq("5555C")
    expect(Fakes::AppealRepository.uploaded_form8.vacols_id).to eq("5555C")
    expect(Fakes::AppealRepository.uploaded_form8_appeal.vacols_id).to eq("5555C")

    expect(page).to have_content("Congratulations!")

    certification = Certification.find_or_create_by_vacols_id("5555C")
    expect(certification.reload.completed_at).to eq(Time.zone.now)
  end
end
