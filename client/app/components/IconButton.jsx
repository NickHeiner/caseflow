import React, { PropTypes } from 'react';

const IconButton = ({
  handleActivate, label, getRef, iconName, iconFunction, className = ''
}) => {
  const handleKeyDown = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      handleActivate(event);
      event.preventDefault();
    }
  };

  const buttonProps = {
    role: 'button',
    ref: getRef,
    'aria-label': label,
    tabIndex: '0',
    onKeyDown: handleKeyDown,
    onClick: handleActivate,
    className
  };

  if (iconFunction) {
    return <div {...buttonProps}>
      {iconFunction()}
    </div>;
  }

  return <i {...buttonProps}
    className={`${className} fa fa-1 ${iconName} cf-icon-button`}></i>;
};

IconButton.displayName = 'IconButton';

IconButton.propTypes = {
  label: PropTypes.string.isRequired,
  iconName: PropTypes.string,
  iconFunction: PropTypes.func,
  handleActivate: PropTypes.func
};

export default IconButton;
