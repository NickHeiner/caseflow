import React, { PropTypes } from 'react';
import TextField from '../../components/TextField';
import Checkbox from '../../components/Checkbox';
import Button from '../../components/Button';
import { dateFormatString } from '../../util/DateUtil';
import StringUtil from '../../util/StringUtil';
import SPECIAL_ISSUES from '../../constants/SpecialIssues';
import Table from '../../components/Table';
import TabWindow from '../../components/TabWindow';
import LoadingContainer from '../../components/LoadingContainer';
import { connect } from 'react-redux';
import * as Constants from '../../establishClaim/constants';
import moment from 'moment';

export class EstablishClaimDecision extends React.Component {
  constructor(props) {
    super(props);
    let endProductButtonText;

    if (this.hasMultipleDecisions()) {
      endProductButtonText = 'Route claim for Decision 1';
    } else {
      endProductButtonText = 'Route claim';
    }
    this.state = {
      endProductButtonText
    };
  }

  onTabSelected = (tabNumber) => {
    this.setState({
      endProductButtonText: `Route claim for Decision ${tabNumber + 1}`
    });
  }

  hasMultipleDecisions() {
    return this.props.task.appeal.decisions.length > 1;
  }

  render() {
    let {
      loading,
      decisionType,
      handleSubmit,
      handleCancelTask,
      handleSpecialIssueFieldChange,
      pdfLink,
      pdfjsLink,
      specialIssues,
      task
    } = this.props;

    let issueColumns = [
      {
        header: 'Program',
        valueName: 'program_description'
      },
      {
        header: 'VACOLS Issue(s)',
        valueFunction: (issue, index) => {
          return issue.description.map((descriptor) =>
            <div key={`${descriptor}-${index}`}>{descriptor}</div>, null
          );
        }
      },
      {
        header: 'Disposition',
        valueFunction: (issue) => StringUtil.titleCase(issue.disposition)
      }
    ];

    let decisionDateStart = moment(task.appeal.serialized_decision_date).
      add(-3, 'days').
      format(dateFormatString);

    let decisionDateEnd = moment(task.appeal.serialized_decision_date).
      add(3, 'days').
      format(dateFormatString);

    // Sort in reverse chronological order
    let decisions = task.appeal.decisions.sort((decision1, decision2) =>
      new Date(decision2.received_at) - new Date(decision1.received_at));

    let tabs = decisions.map((decision, index) => {
      let tab = {};

      tab.disable = false;

      tab.label = `Decision ${(index + 1)} ` +
        `(${moment(decision.received_at).format(dateFormatString)})`;

      /* This link is here for 508 compliance, and shouldn't be visible to sighted
        users. We need to allow non-sighted users to preview the Decision. Adobe Acrobat
        is the accessibility standard and is used across gov't, so we'll recommend it
        for now. The usa-sr-only class will place an element off screen without
        affecting its placement in tab order, thus making it invisible onscreen
        but read out by screen readers. */

      tab.page = <div>
         <a
           className="usa-sr-only"
           id="sr-download-link"
           href={`${pdfLink}&decision_number=${index}`}
           download
           target="_blank">
           The PDF viewer in your browser may not be accessible. Click to download
           the Decision PDF so you can preview it in a reader with accessibility features
           such as Adobe Acrobat.
         </a>
         <a className="usa-sr-only" href="#establish-claim-buttons">
           If you are using a screen reader and have downloaded and verified the Decision
           PDF, click this link to skip past the browser PDF viewer to the
           establish-claim buttons.
         </a>
         <div>
           <LoadingContainer>
             <iframe
               aria-label="The PDF embedded here is not accessible. Please use the above
                 link to download the PDF and view it in a PDF reader. Then use the
                 buttons below to go back and make edits or upload and certify
                 the document."
               className="cf-doc-embed cf-iframe-with-loading"
               title="Form8 PDF"
               src={`${pdfjsLink}&decision_number=${index}`}>
             </iframe>
           </LoadingContainer>
         </div>
       </div>;

      return tab;
    });

    return (
      <div>
        <div className="cf-app-segment cf-app-segment--alt">
          <h2>Review Decision</h2>
          Review the final decision from VBMS below to determine the next step.
          {this.hasMultipleDecisions() && <div className="usa-alert usa-alert-warning">
            <div className="usa-alert-body">
              <div>
                <h3 className="usa-alert-heading">Multiple Decision Documents</h3>
                <p className="usa-alert-text">
                  We found more than one decision document for the dispatch date
                  range {decisionDateStart} - {decisionDateEnd}.
                  Please review the decisions in the tabs below and select the document
                  that best fits the decision criteria for this case.
                </p>
              </div>
            </div>
          </div>}
        </div>
        {this.hasMultipleDecisions() &&
          <div className="cf-app-segment cf-app-segment--alt">
            <h3>VACOLS Decision Criteria</h3>
            <Table
              columns={issueColumns}
              rowObjects={task.appeal.issues}
              summary="VACOLS decision criteria issues"
            />
          </div>}
        {

        /* This link is here for 508 compliance, and shouldn't be visible to sighted
         users. We need to allow non-sighted users to preview the Decision. Adobe Acrobat
         is the accessibility standard and is used across gov't, so we'll recommend it
         for now. The usa-sr-only class will place an element off screen without
         affecting its placement in tab order, thus making it invisible onscreen
         but read out by screen readers. */
        }
        <div className="cf-app-segment cf-app-segment--alt">
          {this.hasMultipleDecisions() && <div>
            <h2>Select a Decision Document</h2>
            <p>Use the tabs to review the decision documents below and
            select the decision that best fits the VACOLS Decision Criteria.</p>
            <TabWindow
              tabs={tabs}
              onChange={this.onTabSelected}/>
          </div>}
          {!this.hasMultipleDecisions() && tabs[0].page}

          <div className="usa-width-one-half">
            <TextField
             label="Decision type"
             name="decisionType"
             readOnly={true}
             {...decisionType}
            />
          </div>

          <label><b>Select Special Issue(s)</b></label>
          <div className="cf-multiple-columns">
            {
              SPECIAL_ISSUES.map((issue, index) => {

                return <Checkbox
                  id={issue.specialIssue}
                  label={issue.node || issue.display}
                  name={issue.specialIssue}
                  onChange={handleSpecialIssueFieldChange(issue.specialIssue)}
                  key={index}
                  value={specialIssues[issue.specialIssue]}
                />;
              })
            }
          </div>
        </div>
        <div className="cf-app-segment" id="establish-claim-buttons">
          <div className="cf-push-right">
            <Button
                name="Cancel"
                onClick={handleCancelTask}
                classNames={['cf-btn-link', 'cf-adjacent-buttons']}
            />
            <Button
              app="dispatch"
              name={this.state.endProductButtonText}
              onClick={handleSubmit}
              loading={loading}
            />
          </div>
        </div>
    </div>
    );
  }
}

EstablishClaimDecision.propTypes = {
  decisionType: PropTypes.object.isRequired,
  handleCancelTask: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  pdfLink: PropTypes.string.isRequired,
  pdfjsLink: PropTypes.string.isRequired,
  specialIssues: PropTypes.object.isRequired,
  task: PropTypes.object.isRequired
};

const mapStateToProps = (state) => {
  return {
    specialIssues: state.specialIssues
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    handleSpecialIssueFieldChange: (specialIssue) => (value) => {
      dispatch({
        type: Constants.CHANGE_SPECIAL_ISSUE,
        payload: {
          specialIssue,
          value
        }
      });
    }
  };
};

const ConnectedEstablishClaimDecision = connect(
    mapStateToProps,
    mapDispatchToProps
)(EstablishClaimDecision);

export default ConnectedEstablishClaimDecision;
