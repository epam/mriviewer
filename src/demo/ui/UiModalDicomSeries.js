import React from 'react';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';

import BootstrapTable from 'react-bootstrap-table-next';

class UiModalDicomSeries extends React.Component {
  constructor(props) {
    super(props);
    this.m_onHide = null;
    this.m_onSelect = null;
    this.m_strStyle = '';

    this.onClickRow = this.onClickRow.bind(this);
  }
  onClickRow(evt, row, rowIndex) {
    // console.log(`clicked row = ${rowIndex}`);
    this.m_onHide();
    this.m_onSelect(rowIndex);
  }
  // special code to fix bootstrap table 
  // clippimng problem
  componentWillUpdate(){
    // document.querySelector('.react-bs-table-container').style.height = "auto";
    this.m_strStyle = 'auto';
  }
  componentDidUpdate(){
    // document.querySelector('.react-bs-table-container').style.height = "100%";
    this.m_strStyle = '100%';
  }  
  render() {
    const isVisible = this.props.stateVis;
    const store = this.props;
    const arrSeries = store.dicomSeries;
    this.m_onHide = this.props.onHide;
    this.m_onSelect = this.props.onSelect;

    const strColumns = [
      {
        dataField: 'm_patientName',
        text: 'Patient name',
      },
      {
        dataField: 'm_studyDescr',
        text: 'Study description',
      },
      {
        dataField: 'm_studyDate',
        text: 'Study date',
      },
      {
        dataField: 'm_seriesTime',
        text: 'Series time',
      },
      {
        dataField: 'm_seriesDescr',
        text: 'Series descriotpon',
      },
      {
        dataField: 'm_bodyPartExamined',
        text: 'Body part examined',
      },
      {
        dataField: 'm_numSlices',
        text: 'Number of slices',
      },
      {
        dataField: 'm_hash',
        text: 'Hash code',
      },
    ];
    const rowEvents = {
      onClick: this.onClickRow,
    };
    const strWidth = this.m_strStyle;

    const jsxModalDicomSeries = 
      <Modal show={isVisible} onHide={this.m_onHide} size="xl" >
        <Modal.Header closeButton>
          <Modal.Title>
            Select Dicom series
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div>
            <BootstrapTable bootsrap4 stripped hover keyField='m_hash' data={arrSeries} columns={strColumns} 
              rowEvents={rowEvents}  
              style={{ width: { strWidth }, overflow: 'overlay' }}  />
          </div>
        </Modal.Body>
      </Modal>;

    return jsxModalDicomSeries;
  } // end render 
} // end class
export default connect(store => store)(UiModalDicomSeries);