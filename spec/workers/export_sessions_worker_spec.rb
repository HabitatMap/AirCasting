require 'rails_helper'

describe ExportSessionsWorker do
  it 'calls the export service and emails the result' do
    session_ids = [1, 2]
    email = 'user@example.com'
    zip_path = Rails.root.join('tmp', 'test_export.zip').to_s
    zip_content = 'zip content'

    service = instance_double(
      Csv::ExportSessionsToCsv,
      call: zip_path,
      clean: nil,
    )
    allow(Csv::ExportSessionsToCsv).to receive(:new).and_return(service)
    allow(File).to receive(:read).with(zip_path).and_return(zip_content)
    allow(File).to receive(:basename).with(zip_path).and_return('test_export.zip')
    allow(UserMailer).to receive_message_chain(:with, :export_sessions, :deliver_later)

    subject.perform(session_ids, email)

    expect(service).to have_received(:call).with(session_ids)
    expect(service).to have_received(:clean)
    expect(UserMailer).to have_received(:with).with(
      email: email,
      zip_file: zip_content,
      zip_filename: 'test_export.zip',
    )
  end

  it 'cleans up the service even if mailing raises an error' do
    service = instance_double(Csv::ExportSessionsToCsv, call: '/tmp/x.zip', clean: nil)
    allow(Csv::ExportSessionsToCsv).to receive(:new).and_return(service)
    allow(File).to receive(:read).and_return('')
    allow(File).to receive(:basename).and_return('x.zip')
    allow(UserMailer).to receive_message_chain(:with, :export_sessions, :deliver_later).and_raise(StandardError)

    expect { subject.perform([1], 'user@example.com') }.to raise_error(StandardError)

    expect(service).to have_received(:clean)
  end
end
