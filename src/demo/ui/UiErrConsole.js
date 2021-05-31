/**
 * @fileOverview UiErrConsole
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import { Container } from 'react-bootstrap';



// ********************************************************
// Const
// ********************************************************


// ********************************************************
// Class
// ********************************************************

/**
 * Class UiErrConsole some text later...
 */
class UiErrConsole extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const arrErr = store.arrErrors;
    const jsx = <Container>
      Errors during read
        {arrErr.map((d) => {
          const strErr = d;
          return { strErr };
        })}
    </Container>;
    return jsx;
  }
}
export default connect(store => store)(UiErrConsole);
