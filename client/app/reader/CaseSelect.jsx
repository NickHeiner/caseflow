import React from 'react';
import { connect } from 'react-redux';
import ApiUtil from '../util/ApiUtil';
import { onReceiveAssignments, onInitialDataLoadingFail } from './actions';
import { bindActionCreators } from 'redux';
import Table from '../components/Table';
import Link from '../components/Link';
import _ from 'lodash';

class CaseSelect extends React.PureComponent {
  getAssignmentColumn = () => [
    {
      header: 'Veteran',
      valueName: 'veteran_full_name'
    },
    {
      header: 'Veteran ID',
      valueName: 'vbms_id'
    },
    {
      header: 'View Case File',
      valueFunction: (row) => {
        let buttonText = 'New';
        let buttonType = 'primary';

        if (row.viewed) {
          buttonText = 'Continue';
          buttonType = 'secondary';
        }

        return <Link
            name="view doc"
            button={buttonType}
            to={`/${row.vacols_id}/documents`}>
              {buttonText}
            </Link>;
      }
    }
  ];

  getKeyForRow = (index, row) => row.vacols_id;

  render() {
    if (!this.props.assignments) {
      return null;
    }

    return <div className="usa-grid">
      <div className="cf-app">
        <div className="cf-app-segment cf-app-segment--alt">
          <h1>Welcome to Reader!</h1>
          <p className="cf-lead-paragraph">
            Reader allows attorneys and judges to review
            and annotate Veteran claims folders.
            Learn more about Reader on our <a href="/reader/help">Help page</a>.
          </p>
          <h1>Work Assignments</h1>
          <Table
            columns={this.getAssignmentColumn}
            rowObjects={this.props.assignments.cases}
            summary="Work Assignments"
            getKeyForRow={this.getKeyForRow}
          />
        </div>
      </div>
    </div>;
  }

  componentDidMount() {
    ApiUtil.get('/reader/appeal').then((response) => {
      const returnedObject = JSON.parse(response.text);

      this.props.onReceiveAssignments(returnedObject);
    }, this.props.onInitialDataLoadingFail);
  }
}

const mapStateToProps = (state) => _.pick(state, 'assignments');

const mapDispatchToProps = (dispatch) => (
  bindActionCreators({
    onInitialDataLoadingFail,
    onReceiveAssignments
  }, dispatch)
);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CaseSelect);
