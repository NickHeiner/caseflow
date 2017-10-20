import React from 'react';
import { PAGE_PATHS, RAMP_INTAKE_STATES } from './constants';
import { connect } from 'react-redux';
import { getRampElectionStatus } from './redux/selectors';
import Alert from '../components/Alert';
import CancelButton from './components/CancelButton';
import { Link } from 'react-router-dom';

const getDisplayName = (klass) => klass.displayName || klass.name;

export default (InnerClass, veteranNameLabel) => {
  class Wrapper extends React.PureComponent {
    render() {
      let destinationPath;

      switch (this.props.rampElectionStatus) {
      case RAMP_INTAKE_STATES.STARTED:
        destinationPath = PAGE_PATHS.REVIEW;
        break;
      case RAMP_INTAKE_STATES.REVIEWED:
        destinationPath = PAGE_PATHS.FINISH;
        break;
      case RAMP_INTAKE_STATES.COMPLETED:
        destinationPath = PAGE_PATHS.COMPLETED;
        break;
      default:
      }

      let navMessage = null;

      if (destinationPath) {
        navMessage = <Alert title="Intake in progress" lowerMargin type="error">
          You already have an intake in progress for <b>{veteranNameLabel}</b>.
          You must <Link to={destinationPath}>continue</Link> or 
          <CancelButton /> before starting a new intake.
        </Alert>
      }

      return <InnerClass {...this.props} navMessage={navMessage} />
    }
  }

  Wrapper.displayName = `NavigationHelper(${getDisplayName(InnerClass)})`;

  const ConnectedWrapper = connect(
    (state) => ({
      rampElectionStatus: getRampElectionStatus(state),
    })
  )(Wrapper);
  
  return ConnectedWrapper;
}

