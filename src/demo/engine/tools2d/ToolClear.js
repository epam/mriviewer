/**
 * @fileOverview ToolClear
 * @author Epam
 * @version 1.0.0
 */


// **********************************************
// Imports
// **********************************************

// **********************************************
// Class
// **********************************************

class ToolClear {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
  }
  clear() {
    this.m_objGraphics2d.clear();
  }
}
export default ToolClear;
