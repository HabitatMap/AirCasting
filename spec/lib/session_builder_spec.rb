require './lib/session_builder'

describe SessionBuilder do
  let(:session_data) { { :some => :data, :notes => :note_data, :tag_list => :denormalized_tags, :measurements => [:measurement_data] } }
  let(:session) { stub("session", :id => :session_id) }
  let(:measurement) { stub("measurement") }
  let(:user) { stub("user") }
  let(:photos) { stub("photos") }

  subject { SessionBuilder.new(session_data, photos, user) }

  before do
    ::Session = stub("Session") unless Module.const_defined?(:Session)
    ::Measurement = stub("Measurement") unless Module.const_defined?(:Measurement)
  end

  describe "#build!" do
    before { Session.should_receive(:transaction).and_yield }

    it "should build all the parts" do
      subject.should_receive(:build_session!).and_return(session)
      subject.should_receive(:build_measurements!).with(session)

      subject.build!.should == session
    end
  end

  describe "#build_session!" do
    it "should process the data" do
      SessionBuilder.should_receive(:prepare_notes).with(:note_data, photos).and_return(:prepared_notes)
      SessionBuilder.should_receive(:normalize_tags).with(:denormalized_tags).and_return(:normalized_tags)
      Session.should_receive(:new).with(:some => :data, :notes_attributes => :prepared_notes,
                                        :tag_list => :normalized_tags, :user => user).
                                        and_return(session)
      session.should_receive(:save!)

      subject.build_session!.should == session
    end
  end

  describe ".prepare_notes" do
    it "should match the photos" do
      SessionBuilder.prepare_notes([{:note => :one}, {:note => :two}], [:photo1, :photo2]).
        should == [{:note => :one, :photo => :photo1}, {:note => :two, :photo => :photo2}]
    end
  end

  describe "#build_measurements!" do
    before do
      Measurement.should_receive(:new).with(:measurement_data).and_return(measurement)
      measurement.should_receive(:session=).with(session)
      measurement.should_receive(:set_timezone_offset)
      Measurement.should_receive(:import).with(any_args) do |measurements|
        measurements.should include measurement
        import_result
      end
    end

    context "the measurements are valid" do
      let(:import_result) { stub(:failed_instances => []) }

      it "should import the measurements" do
        Session.should_receive(:update_counters).with(:session_id, :measurements_count => 1)
        session.should_receive(:set_timeframe!)

        subject.build_measurements!(session)
      end
    end

    context "the measurements are invalid" do
      let(:import_result) { stub(:failed_instances => [1,2,3]) }

      it "should cause an error" do
        lambda { subject.build_measurements!(session) }.should raise_error
      end
    end
  end

  describe '.normalize_tags' do
    it 'should replace spaces and commas with commas as tag delimiters' do
      SessionBuilder.normalize_tags('jola misio, foo').should == 'jola,misio,foo'
    end
  end
end

