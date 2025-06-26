import React from 'react';

import { userEventSetup } from '../util/testing';
import StatBox from "./StatBox";
import { DATA_MOCK } from '../test/mock-data';

describe("StatBox", () => {
  test('renders relevance as expected', () => {
    const { asFragment } = userEventSetup(
      <StatBox
        data={DATA_MOCK}
        field="Artificial intelligence"
        fieldName="artificial intelligence"
        key="relevance"
        stat="relevance"
      />
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
