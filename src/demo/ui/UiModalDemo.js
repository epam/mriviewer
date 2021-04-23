
import React from 'react';
import { connect } from 'react-redux';

class UiModalDemo extends React.Component {
  constructor(props) {
    super(props);
    this.onModalShow = this.onModalShow.bind(this);
    this.onModalHide = this.onModalHide.bind(this);
    this.onButton0 = this.onButton0.bind(this);
    this.onButton1 = this.onButton1.bind(this);
    this.onButton2 = this.onButton2.bind(this);
    this.onButton3 = this.onButton3.bind(this);
    this.onButton4 = this.onButton4.bind(this);
    this.onButton5 = this.onButton5.bind(this);
    this.onButton6 = this.onButton6.bind(this);
    this.onButton7 = this.onButton7.bind(this);
    this.onDemo = this.onDemo.bind(this);
    this.state = {
      showModalDemo: false
    };
  }
  onModalShow() {
    this.setState({ showModalDemo: true });
  }
  onModalHide() {
    this.setState({ showModalDemo: false });
  }
  onDemo(index) {
    const onSelectFunc = this.props.onSelectDemo;
    const onHideFunc = this.props.onHide;
    onHideFunc();
    onSelectFunc(index);
  }
  onButton0() {
    this.onDemo(0);
  }
  onButton1() {
    this.onDemo(1);
  }
  onButton2() {
    this.onDemo(2);
  }
  onButton3() {
    this.onDemo(3);
  }
  onButton4() {
    this.onDemo(4);
  }
  onButton5() {
    this.onDemo(5);
  }
  onButton6() {
    this.onDemo(6);
  }
  onButton7() {
    this.onDemo(7);
  }
  render() {
    const iconsSet = [
      {
        tooltip: 'Lungs 20101108 from ktx',
        image: 'images/thumb_lungs.png',
        alt: 'lungs',
        func: this.onButton0,
      },
      {
        tooltip: 'Brain set from ktx',
        image: 'images/thumb_brain.png',
        alt: 'lungs',
        func: this.onButton1,
      },
      {
        tooltip: 'Grandmother (gm3) from nifti',
        image: 'images/thumb_gm3_512_512_165.png',
        alt: 'gm3',
        func: this.onButton2,
      },
      {
        tooltip: 'Woman pelvis from dicom',
        image: 'images/thumb_woman_pelvis.png',
        alt: 'woman_pelvis',
        func: this.onButton3,
      },
      {
        tooltip: 'Lungs 00cba...957e from dicom',
        image: 'images/thumb_ocb.png',
        alt: 'lungs_ocb',
        func: this.onButton4,
      },
      {
        tooltip: 'CT 256^3 from ktx',
        image: 'images/thumb_ct_256.png',
        alt: 'ct_256',
        func: this.onButton5,
      },
      {
        tooltip: 'Lungs 256^3 from ktx',
        image: 'images/thumb_lungs_256.png',
        alt: 'lungs_256',
        func: this.onButton6,
      },
      {
        tooltip: 'Brain with ROI (colored) from Hdr+Img',
        image: 'images/thumb_set.png',
        alt: 'hdr_set_roi',
        func: this.onButton7,
      },
    ];

    const jsxModalDemo = 
      <dialog >
        <h3>Load demo data</h3>
        {iconsSet.map( ({ tooltip, image, alt }) => {
          return <img src={image} alt={alt} title={tooltip} />
        })}
      </dialog>;

    return jsxModalDemo;
  }
}

export default connect(store => store)(UiModalDemo);
