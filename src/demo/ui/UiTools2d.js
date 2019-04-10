/**
 * @fileOverview UiTools2d
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import StoreActionType from '../store/ActionTypes';
import Tools2dType from '../engine/tools2d/ToolTypes';

// ********************************************************
// Class
// ********************************************************
class UiTools2d extends React.Component {
  constructor(props) {
    super(props);
    this.onClickButtonTools = this.onClickButtonTools.bind(this);
    this.state = {
      data: [
        { img: 'images/icon_tools2d_intensity.png', txt: 'intensity', ke: Tools2dType.INTENSITY },
        { img: 'images/icon_tools2d_distance.png', txt: 'distance', ke: Tools2dType.DISTANCE },
        { img: 'images/icon_tools2d_angle.png', txt: 'angle', ke: Tools2dType.ANGLE },
        { img: 'images/icon_tools2d_area.png', txt: 'area', ke: Tools2dType.AREA },
        { img: 'images/icon_tools2d_rect.png', txt: 'rect', ke: Tools2dType.RECT },
        { img: 'images/icon_tools2d_text.png', txt: 'text', ke: Tools2dType.TEXT },
        { img: 'images/icon_tools2d_edit.png', txt: 'edit', ke: Tools2dType.EDIT },
        { img: 'images/icon_tools2d_delete.png', txt: 'delete', ke: Tools2dType.DELETE },
        { img: 'images/icon_tools2d_clear.png', txt: 'clear', ke: Tools2dType.CLEAR },
        { img: 'images/icon_tools2d_zoom.png', txt: 'zoom', ke: Tools2dType.ZOOM },
        { img: 'images/icon_tools2d_default.png', txt: 'default', ke: Tools2dType.DEFAULT },
        // { img: 'images/icon_tools2d_filter.png', txt: 'filter', ke: Tools2dType.FILTER },
        { img: 'images/icon_tools2d_empty.png', txt: 'none', ke: Tools2dType.NONE },
      ],
    };
  }
  onClickButtonTools(evt) {
    // console.log('UiTools2d. onClickButtonTools');
    const btn = evt.target;
    const idx = this.state.data.findIndex(obj => (obj.txt === btn.alt) );
    if (idx >= 0) {
      // set new toools 2s index to global store
      const store = this.props;
      store.dispatch({ type: StoreActionType.SET_2D_TOOLS_INDEX, indexTools2d: idx });
      // console.log(`UiTools2d. onClickButton index = ${idx}`);
      if( idx === Tools2dType.DEFAULT) {
        store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.0 });
        store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: 0.0 });
        store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: 0.0 });
      }
      if( idx === Tools2dType.CLEAR) {
        const gra2d = store.graphics2d;
        if (gra2d !== null) {
          gra2d.clear();
        }
      }

    } // if button index valid
  } // end of onClickButtonTools
  render() {
    const strTitle = 'Tools';

    //
    // TODO: add select new item
    //

    const store = this.props;
    const indexCur = store.indexTools2d;

    const jsx = 
    <div className="card" >
      <div className="card-header">
        {strTitle}
      </div>
      <div className="card-body">
        <div className="btn-group row">

          {this.state.data.map(d => 
          {
            const strAttr = (indexCur === d.ke) ? 'col-2 btn btn-outline-secondary' : 'col-2 btn';
            return <button type='button' className={strAttr} key={d.ke} id={d.ke} onClick={this.onClickButtonTools} >
              <img className='img-thumbnail' src={d.img} alt={d.txt} />
            </button>
          })}

        </div>
      </div>
    </div>
    return jsx;
  }
}

export default connect(store => store)(UiTools2d);

