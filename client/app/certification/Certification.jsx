import React, { PropTypes } from 'react';

// components
import Alert from '../components/Alert';

export default class Certification extends React.Component {
  constructor(props) {
    super(props);

  }

  handleAlert = (type, title, message) => {
    this.setState({
      alert: {
        message,
        title,
        type
      }
    });
  }

  handleAlertClear = () => {
    this.setState({ alert: null });
  }

  render() {
    // `rest` signifies all the props passed in from Rails that
    // we want to send directly to the PageComponent
    let {
      page,
      ...rest
    } = this.props;

    let {
      alert
    } = this.state;

    let PageComponent = Pages[page];

    return <div>
      {alert && <Alert
        type={alert.type}
        title={alert.title}
        message={alert.message}
        handleClear={this.handleAlertClear}
      />}
      <PageComponent
        {...rest}
        handleAlert={this.handleAlert}
        handleAlertClear={this.handleAlertClear}
      />
    </div>;
  }
}

BaseContainer.propTypes = {
  page: PropTypes.string.isRequired
};