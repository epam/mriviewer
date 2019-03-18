

// *****************************************************************
// Const 
// *****************************************************************

const TAG_TRANSFER_SYNTAX = [0x0002, 0x0010];
const TAG_META_LENGTH = [0x0002, 0x0000];
const TAG_PIXEL_DATA = [0x7FE0, 0x0010];

/**
* class DicomTag is used for parse tags inside dicom file structure
*/
class DicomTag {
  /**
   * @param {number} group - group in pair group:element
   * @param {number} element - element in pair group:element
   * @param {string} vr - special string for tag
   * @param {object} value - tag value: data array
   * @param {number} offsetStart - start of tag
   * @param {number} offsetValue - offset value
   * @param {number} offsetEnd - offset in stream
   * @param {number} littleEndian - is in little endian mode numbers encoding
   */
  constructor(group,
    element,
    vr,
    value,
    offsetStart,
    offsetValue,
    offsetEnd,
    littleEndian) {
    /** @property {number} m_group - group for group:element pair */
    this.m_group = group;
    /** @property {number} m_element - element for group:element pair */
    this.m_element = element;
    /** @property {string} m_vr - special VR text for tag */
    this.m_vr = vr;
    /** @property {object} m_value - array with content */
    this.m_value = value;
    /** @property {number} m_offsetStart - start of tag */
    this.m_offsetStart = offsetStart;
    /** @property {number} m_offsetValue - value of tag */
    this.m_offsetValue = offsetValue;
    /** @property {number} m_offsetEnd - end of tag */
    this.m_offsetEnd = offsetEnd;
    /** @property {number} m_littleEndian - is in big/little endian */
    this.m_littleEndian = littleEndian;
  }
  /**
  * get value
  * @return {object} data content of this tag
  */
  value() {
    return this.m_value;
  }
  /**
  * check has transform syntax or not
  * @return {boolean} is transform
  */
  isTransformSyntax() {
    if ((this.m_group === TAG_TRANSFER_SYNTAX[0]) && (this.m_element === TAG_TRANSFER_SYNTAX[1])) {
      return true;
    }
    return false;
  }
  /**
  * check is this tag meta
  * @return {boolean} true, if this tag is meta tag
  */
  isMetaLength() {
    if ((this.m_group === TAG_META_LENGTH[0]) && (this.m_element === TAG_META_LENGTH[1])) {
      return true;
    }
    return false;
  }
  /**
  * check has image bits in this tag data
  * @return {boolean} true, if image bits is inside tag data
  */
  isPixelData() {
    if ((this.m_group === TAG_PIXEL_DATA[0]) && (this.m_element === TAG_PIXEL_DATA[1])) {
      return true;
    }
    return false;
  }
}
export default DicomTag;