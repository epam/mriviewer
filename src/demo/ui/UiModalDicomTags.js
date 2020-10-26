/**
 * @fileOverview UiModalDicomTags
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import { Modal, Table, Form } from 'react-bootstrap';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiModalDicomTags some text later...
 */
class UiModalDicomTags extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onModalHide = this.onModalHide.bind(this);

    this.state = {
      showModalDemo: false,
      currentSlice: 0,
    };
  }
  onModalHide() {
    this.setState({ showModalDemo: false });
  }
  onSelectSlice(evt) {
    // const nam = evt.target.name;
    const val = evt.target.value;
    // console.log(`onSelectSlice. name = ${nam} val = ${val}`);
    const arr = val.split(' ');
    const ind = parseInt(arr[1]);
    console.log(`onSelectSlice. index = ${ind}`);
    this.setState({ currentSlice: ind });
  }
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;

    const store = this.props;
    const dicomInfo = store.dicomInfo;
    let slicesInfo = [];
    let tagsList = [];
    
    if (dicomInfo !== null) {
      slicesInfo = dicomInfo.m_sliceInfo;
      if (slicesInfo.length > 0) {
        tagsList = slicesInfo[this.state.currentSlice].m_tags;
      }
      /*
      const numSlices = slicesInfo.length;
      console.log(`UiModalDicomTags.render. num slices = ${numSlices}`);
      for (let i = 0; i < numSlices; i++) {
        const sliceInfo = slicesInfo[i];
        console.log(`UiModalDicomTags.render. slice = ${sliceInfo.m_sliceName} file = ${sliceInfo.m_fileName}`);
        const tagsInfo = sliceInfo.m_tags;
        const numTags = tagsInfo.length;
        for (let j = 0; j < numTags; j++) {
          const tagInfo = tagsInfo[j];
          console.log(`UiModalDicomTags.render. tag = ${tagInfo.m_tag} name = ${tagInfo.m_attrName} value = ${tagInfo.m_attrValue}`);
        }
      }
      */
    }
    

    const jsxModalDemo = 
      <Modal show={stateVis} onHide={onHideFunc} size="xl" >
        <Modal.Header closeButton>
          <Modal.Title>
            Dicom information
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Form>
            <Form.Group controlId="modalDicomTags.slice">
              <Form.Label>
                Choose slice
              </Form.Label>

              <Form.Control as="select" onChange={this.onSelectSlice.bind(this)}>
                {slicesInfo.map( (d, i) => {
                  const sn = d.m_sliceName;
                  const fn = d.m_fileName;
                  const str = sn + ' (' + fn + ')';
                  return <option key={i} value={str}> {str} </option>;
                })}
              </Form.Control>

            </Form.Group>

          </Form>

          <Table striped bordered responsive>
            <thead>

              <tr>
                <th>
                  Tag
                </th>
                <th>
                  Attribute Name
                </th>
                <th>
                  Attribute Value
                </th>
              </tr>

            </thead>
            <tbody>
              {tagsList.map( (d, i) => {
                const strTag = d.m_tag;
                const strNam = d.m_attrName;
                const strVal = (d.m_attrValue.length > 0) ? d.m_attrValue : '_';
                // return <tr key={i}><td>{strTag}</td><td>{i}</td><td>{i}</td></tr>;
                return <tr key={i}><td>{strTag}</td><td>{strNam}</td><td>{strVal}</td></tr>;
              })}
            </tbody>

          </Table>              

        </Modal.Body>
      </Modal>
    return jsxModalDemo;
  } // end render
} // end class

export default connect(store => store)(UiModalDicomTags);
