import React from "react"
import {render} from "@testing-library/react"
import ProjectMetadata from "../project_metadata"

describe("Project metadata", () => {
  it("renders correctly with no references", () => {
    const card = render(
      <ProjectMetadata
        data={{
          "stargazers_count": 123,
          "num_contributors": 45,
          "open_issues": 56,
          "created_at": "2023-01-01",
          "pushed_at": "2023-03-14",
          "license": "MIT",
          "language": "Python"
        }}
      />
    );
    expect(card).toMatchSnapshot();
    expect(card.queryAllByText("Mentions")).toHaveLength(0);
  });

  it("renders correctly with references", () => {
    const card = render(
      <ProjectMetadata
        field={"Algebraic Geometry"}
        showNumReferences={true}
        data={{
          "stargazers_count": 123,
          "num_contributors": 45,
          "open_issues": 56,
          "created_at": "2023-01-01",
          "pushed_at": "2023-03-14",
          "license": "MIT",
          "language": "Python",
          "num_references": {"Algebraic Geometry": 76},
          "relevance": {"Algebraic Geometry": 42.42}
        }}
      />
    );
    expect(card).toMatchSnapshot();
    expect(card.queryAllByText("mentions", {exact: false})).toHaveLength(1);
  });

});
