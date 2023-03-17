import React from "react"
import {getCountryTraces, getBarTraces} from "../utils"

describe("getCountryTraces", () => {
  it("has expected output", () => {
    const input_countries = [[2018, "China", 880], [2018, "Canada", 102], [2018, "Korea, Republic of", 153], [2018, "United States", 1633], [2018, "Belgium", 13], [2019, "Belgium", 41], [2019, "Canada", 216], [2019, "China", 3178], [2019, "United States", 51299], [2019, "Korea, Republic of", 788], [2020, "China", 4688], [2020, "Korea, Republic of", 1187], [2020, "Canada", 2817], [2020, "Belgium", 31], [2020, "United States", 39448], [2021, "Canada", 1542], [2021, "United States", 8552], [2021, "Belgium", 2877], [2021, "Korea, Republic of", 1776], [2021, "China", 2222], [2022, "Belgium", 4314], [2022, "Canada", 1666], [2022, "China", 1135], [2022, "Korea, Republic of", 932], [2022, "United States", 3592]];
    expect(getCountryTraces(input_countries)).toStrictEqual([
      {
        "name": "United States",
        "x": [
          "2018",
          "2019",
          "2020",
          "2021",
          "2022",
        ],
        "y": [
          1633,
          51299,
          39448,
          8552,
          3592,
        ],
      },
      {
        "name": "China",
        "x": [
          "2018",
          "2019",
          "2020",
          "2021",
          "2022",
        ],
        "y": [
          880,
          3178,
          4688,
          2222,
          1135,
        ],
      },
      {
        "name": "Belgium",
        "x": [
          "2018",
          "2019",
          "2020",
          "2021",
          "2022",
        ],
        "y": [
          13,
          41,
          31,
          2877,
          4314,
        ],
      },
      {
        "name": "Canada",
        "x": [
          "2018",
          "2019",
          "2020",
          "2021",
          "2022",
        ],
        "y": [
          102,
          216,
          2817,
          1542,
          1666,
        ],
      },
      {
        "name": "Korea, Republic of",
        "x": [
          "2018",
          "2019",
          "2020",
          "2021",
          "2022",
        ],
        "y": [
          153,
          788,
          1187,
          1776,
          932,
        ],
      },
    ]
    );
  });
});

describe("getBarTraces", () => {
  it("has expected output", () => {
    const issue_dates = [[2019, 7, 6], [2020, 13, 14], [2021, 4, 4], [2022, 3, 2]];
    expect(getBarTraces("issue_dates", {"issue_dates": issue_dates})).toStrictEqual([
      {
        "name": "Opened",
        "x": [2019, 2020, 2021, 2022],
        "y": [7, 13, 4, 3],
      },
      {
        "name": "Closed",
        "x": [2019, 2020, 2021, 2022],
        "y": [6, 14, 4, 2]
      }
    ]);
  });
});
