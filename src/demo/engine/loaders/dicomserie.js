//
//
//

import DicomSlice from "./dicomslice";

const FLOAT_TOO_LARGE_VALUE = 555555555555.5;


class DicomSerie {
  constructor(hash) {
    console.assert(hash !== undefined);
    console.assert(typeof hash === "number", "hash shold be number");

    this.m_hash = hash;
    this.m_slices = [];
    this.m_minSlice = +FLOAT_TOO_LARGE_VALUE;
    this.m_maxSlice = -FLOAT_TOO_LARGE_VALUE;
  }
  addSlice(slice) {
    console.assert(slice !== undefined);
    console.assert(slice instanceof DicomSlice, "added slice should be DicomSlice object");
    this.m_slices.push(slice);
    this.m_minSlice = (slice.m_sliceNumber < this.m_minSlice) ? slice.m_sliceNumber : this.m_minSlice;
    this.m_maxSlice = (slice.m_sliceNumber > this.m_maxSlice) ? slice.m_sliceNumber : this.m_maxSlice;
  }

} // end DicomSerie

export default DicomSerie;