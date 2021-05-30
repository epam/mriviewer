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

import { Container, ListGroup } from 'react-bootstrap';



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
      <ListGroup>
        {arrErr.map((d, i) => {
          const strErr = d;
          const strKey = `key_${i}`;
          return <ListGroup.Item key={strKey} > {strErr} </ListGroup.Item>;
        })}
      </ListGroup>
    </Container>;
    return jsx;
  }
}
export default connect(store => store)(UiErrConsole);
