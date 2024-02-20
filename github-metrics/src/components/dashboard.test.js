import React from 'react';
import { screen, act, getAllByRole, getByRole } from '@testing-library/react';

import Dashboard from './dashboard';
import { userEventSetup } from '../util/testing';

window.HTMLElement.prototype.scrollIntoView = jest.fn();

const currentlyTrackingHeading = (num, field) => {
  return `Currently tracking ${num} software repositories mentioned in research into ${field} .`;
}

describe("filter panel", () => {
  it("switches research fields", async () => {
    const { user } = userEventSetup(
      <Dashboard />
    );

    let topReposHeading;
    let topEntries

    expect(screen.getByRole("heading", { name: currentlyTrackingHeading(413, "artificial intelligence") })).toBeVisible();
    topReposHeading = screen.getByRole("heading", { name: "Top repositories by stars" });
    topEntries = getAllByRole(topReposHeading.parentElement, "listitem");
    expect(topEntries[0].textContent).toEqual("facebook/react215865 stars (-32.65%, 2022-2023)");
    expect(topEntries[1].textContent).toEqual("tensorflow/tensorflow179194 stars (-11.62%, 2022-2023)");

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText("Astrobiology")).toBeVisible();
    await act(() => {
      user.click(screen.getByText("Astrobiology"));
    });
    await new Promise(res => setTimeout(res, 500));

    expect(screen.getByRole("heading", { name: currentlyTrackingHeading(59, "astrobiology") })).toBeVisible();
    topReposHeading = screen.getByRole("heading", { name: "Top repositories by stars" });
    topEntries = getAllByRole(topReposHeading.parentElement, "listitem");
    expect(topEntries[0].textContent).toEqual("astropy/astropy4028 stars (-46.90%, 2022-2023)");
    expect(topEntries[1].textContent).toEqual("dfm/emcee1384 stars (-16.50%, 2022-2023)");
  });


  it("toggles between summary and list view", async () => {
    const { user } = userEventSetup(
      <Dashboard />
    );

    expect(screen.getByRole("heading", { name: currentlyTrackingHeading(59, "astrobiology") })).toBeVisible();

    await user.click(screen.getByRole('checkbox'));
    await new Promise(res => setTimeout(res, 500));

    expect(screen.getByRole("button", { name: "Show Filters" })).toBeVisible();

    const cards = screen.getAllByTestId("project-card");
    expect(getByRole(cards[0], "heading", { name: "hannorein/rebound" })).toBeVisible();
    expect(cards[0].textContent).toContain("Stars: 570");
    expect(cards[0].textContent).toContain("Top Programming Language: C");
    expect(getByRole(cards[1], "heading", { name: "jlillo/tpfplotter" })).toBeVisible();
    expect(cards[1].textContent).toContain("Date created: 2020-02-02");
    expect(cards[1].textContent).toContain("License: MIT License");
  });
});
