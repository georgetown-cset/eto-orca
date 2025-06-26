import React from "react";
import {css} from "@emotion/react";
import {breakpointStops} from "@eto/eto-ui-components";

const styles = {
  wrapper: css`
    display: inline-block;
    vertical-align: top;
    border: 3px solid var(--bright-blue);
    padding: 10px 20px;
    margin: 10px;
    text-align: left;
    min-height: 350px;
    @media (max-width: ${breakpointStops.tablet_regular}px) {
      width: 80%;
      margin: 10px auto;
    }
  `,
  tallBox: css`
    min-height: 350px;
  `,
  shortBox: css`
    min-height: 270px;
  `,
  wideBox: css`
    width: 400px;
    @media (max-width: ${breakpointStops.phone_regular}px ) {
      width: 100%;
    }
  `,
  narrowBox: css`
    width: 350px;
    @media (max-width: ${breakpointStops.phone_regular}px ) {
      width: 100%;
    }
  `
};

const HighlightBox = ({
  children,
  className=undefined,
  isTall=false,
  isWide=false,
  title,
}) => {
  return (
    <div
      className={className}
      css={[styles.wrapper, isTall ? styles.tallBox : styles.shortBox, isWide ? styles.wideBox : styles.narrowBox]}
    >
      <h3>{title}</h3>
      {children}
    </div>
  )
};

export default HighlightBox;
