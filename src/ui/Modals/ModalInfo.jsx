/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */


import React, { useCallback, useMemo, useState } from "react";
import { connect } from "react-redux";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./ModalBase";
import { UIButton } from "../Button/Button";

import css from "./ModalInfo.module.css";
import styles from "./Modals.module.css";

const getVolInfo = (volSet, vol) => {
    const strMsg = [];
    const xSize = Math.floor(vol.m_boxSize.x);
    const ySize = Math.floor(vol.m_boxSize.y);
    const zSize = Math.floor(vol.m_boxSize.z);

    strMsg.push('volume dim = ' + vol.m_xDim.toString() + ' * ' +
        vol.m_yDim.toString() + ' * ' +
        vol.m_zDim.toString());
    strMsg.push( 'vol phys size = ' + xSize.toString() + ' * ' +
        ySize.toString() + ' * ' +
        zSize.toString());
    const patName = volSet.m_patientName;
    if (patName.length > 1) {
        strMsg.push('patient name = ' + patName);
    }
    const patBirth = volSet.m_patientBirth;
    if (patBirth.length > 1) {
        strMsg.push('patient birth = ' + patBirth);
    }
    const seriesDescr = volSet.m_seriesDescr;
    if (seriesDescr.length > 1) {
        strMsg.push('series descr = ' + seriesDescr);
    }
    const institutionName = volSet.m_institutionName;
    if (institutionName.length > 1) {
        strMsg.push('institution name = ' + institutionName);
    }
    const operatorsName = volSet.m_operatorsName;
    if (operatorsName.length > 1) {
        strMsg.push('operators name = ' + operatorsName);
    }
    const physicansName = volSet.m_physicansName;
    if (physicansName.length > 1) {
        strMsg.push('physicans name = ' + physicansName);
    }
    return strMsg;
};

const VolInfo = ({ info }) => (
    <>
        <p className={ css.subtitle }>Volume information:</p>
        <ul className={ css.list }>
            {info.map(info => (
                <li key={info} className={ css.item }>
                    {info}
                </li>
            ))}
        </ul>
    </>
);

const SliceSelect = ({ slices, onValueChange, value }) => {
    return (
        <>
            <label className={ css.subtitle } htmlFor="slice-select">Choose slice</label>
            <div className={ css.selectWrapper }>
                <select value={ value } onChange={ onValueChange } id="slice-select" className={ css.select}>
                    { slices.map(({ m_sliceName: sliceName, m_fileName: fileName }) => {
                        const str = `${sliceName} (${fileName})`;
                        const fileIndex = parseInt(sliceName.split(" ")[1]);
                        return <option key={ fileIndex } value={ fileIndex }> {str} </option>;
                    }) }
                </select>
            </div>
        </>
    )
};

const TagsList = ({ tags }) => (
    <table className={ css.table }>
        <thead>
        <tr>
            <th>Tag</th>
            <th>Attribute Name</th>
            <th>Attribute Value</th>
        </tr>
        </thead>
        <tbody>
        {tags.map( ({ m_tag: tag, m_attrName: attrName, m_attrValue: attrValue }, i) => {
            const strVal = attrValue.length > 0 ? attrValue : '-';
            return <tr key={i}><td>{tag}</td><td>{attrName}</td><td>{strVal}</td></tr>;
        })}
        </tbody>
    </table>
);

const mockedSlices  = [
    { m_sliceName: "Slice 0", m_fileName: "file0", m_tags: [
            { m_tag: "(#005500, #452211)", m_attrName: "?desc" || "", m_attrValue: "(Sequence Data)" || "" },
            { m_tag: "(#ffffff, #452211)", m_attrName:  "", m_attrValue: "" }
        ] },
    { m_sliceName: "Slice 1", m_fileName: "file1", m_tags: [
            { m_tag: "(#sdv0, #4csdc)", m_attrName: "?dvdf", m_attrValue: "(Sequence Data)" },
            { m_tag: "(#1353, #45684)", m_attrName: "?vds", m_attrValue: "lorem10 data data tsafdskf ewfqwef" },
            { m_tag: "(#ddccs, #fsadc)", m_attrName: "?decsdc", m_attrValue: "(Sequence Data)" },
        ] },
    { m_sliceName: "Slice 2", m_fileName: "file2", m_tags: [] },
    { m_sliceName: "Slice 3", m_fileName: "file3", m_tags: [] },
];

const ModalInfo = (props) => {
    const { stateVis, onHide, store: { dicomInfo, volumeSet, volumeIndex } } = props;
    const [currentSlice, setCurrentSlice] = useState(0);

    const onSelectSlice = useCallback(evt => {
        const newVal = evt.target.value;
        setCurrentSlice(newVal);
    }, []);

    const volInfo = useMemo(() => {
        const volume = volumeSet.getVolume(volumeIndex);
        return getVolInfo(volumeSet, volume);
    }, [volumeSet, volumeIndex]);

    const slicesInfo = dicomInfo?.m_sliceInfo || mockedSlices || [];
    const tagsList = slicesInfo[currentSlice]?.m_tags || [];

    return (
        <Modal isOpen={ stateVis } close={ onHide }>
            <ModalHeader title="Volume and dicom information" close={ onHide } />
            <ModalBody>
                { volInfo.length > 0 && <VolInfo info={ volInfo }/> }
                { slicesInfo.length > 0 && (
                    <SliceSelect
                        slices={ slicesInfo }
                        value={ currentSlice }
                        onValueChange={ onSelectSlice }
                    />
                ) }
                { tagsList.length > 0 && <TagsList tags={ tagsList } /> }
                { slicesInfo.length > 0 && tagsList.length === 0 && <p className={ css.item }>No tags found</p>}
            </ModalBody>
            <ModalFooter>
                <UIButton
                    caption="Ok"
                    cx={ styles.button }
                    handler={ onHide }
                />
            </ModalFooter>
        </Modal>
    );
}

export default connect((store, props) => ({ store, ...props }))(ModalInfo);
