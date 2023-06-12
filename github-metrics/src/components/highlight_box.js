import React from "react";
import {css} from "@emotion/react";

const styles = {
  wrapper: css`
    display: inline-block;
    width: 350px;
    vertical-align: top;
    border: 3px solid var(--bright-blue);
    padding: 10px 20px;
    margin: 10px;
    text-align: left;
    min-height: 350px;
  `,
  tallBox: css`
    min-height: 350px;
  `,
  shortBox: css`
    min-height: 270px;
  `
};

const HighlightBox = ({title, isTall=false, children}) => {
  return (
    <div css={[styles.wrapper, isTall ? styles.tallBox : styles.shortBox]}>
      <h3>{title}</h3>
      {children}
    </div>
  )
};

export default HighlightBox;
