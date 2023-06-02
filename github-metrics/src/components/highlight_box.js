import React from "react";
import {css} from "@emotion/react";

const styles = {
  wrapper: css`
    display: inline-block;
    width: 350px;
    vertical-align: top;
    border: 3px solid var(--bright-blue);
    padding: 10px 20px 30px 20px;
    margin: 10px;
    text-align: left;
    min-height: 175px;
  `
};

const HighlightBox = ({title, children}) => {
  return (
    <div css={styles.wrapper}>
      <h3>{title}</h3>
      {children}
    </div>
  )
};

export default HighlightBox;
