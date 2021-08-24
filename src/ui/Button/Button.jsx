/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import cx from "classnames";

import { SVG } from "./SVG";
import { Tooltip } from "../Tooltip/Tooltip";

import css from "./Button.module.css";


export const ButtonContainer = ({ children, onClick, type = "button", caption, cx: styles }) => (
	<button
		type={type}
		className={cx(css.reset, styles)}
		onClick={onClick}
		caption={caption}
	>
		{children}
	</button>
)


export const UIButton = ({ icon, caption, handler, active, rounded, type, mode, cx: customStyle }) => {
	const modeStyle = (mode === "light" && css.light) || (mode === "accent" && css.accent);
	const isOnlyCaption = icon === undefined && caption;
	
	return (
		<ButtonContainer
			type={type}
			cx={cx(css.button, active && css.active, rounded && css.rounded, isOnlyCaption && css.captionButton, modeStyle, customStyle)}
			onClick={handler}
			caption={icon && caption}
		>
			{icon ? <SVG name={icon} title={caption}/> : caption}
		</ButtonContainer>
	);
}

export const buttonsBuilder = (buttons, options = { activeButton: null }, tooltipPosition) =>
	buttons.map(({ id, caption, ...props }) => (
		<Tooltip content={caption} placement={tooltipPosition} key={id.toString()}>
			<UIButton {...props} key={id} active={id === options.activeButton}/>
		</Tooltip>
	));
