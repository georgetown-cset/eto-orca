import React from 'react';
import { screen, act, getAllByRole, getByRole, getByText } from '@testing-library/react';

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
    expect(cards[0].textContent).toContain("Commits over time");
    expect(getByRole(cards[1], "heading", { name: "jlillo/tpfplotter" })).toBeVisible();
    expect(cards[1].textContent).toContain("Date created: 2020-02-02");
    expect(cards[1].textContent).toContain("License: MIT License");
  });


  it("switches the sort criteria", async () => {
    const { user } = userEventSetup(
      <Dashboard />
    );

    let cards = screen.getAllByTestId("project-card");
    expect(getByRole(cards[0], "heading", { name: "hannorein/rebound" })).toBeVisible();

    await user.click(screen.getByRole('button', { name: "Sort by Relevance Documentation" }));

    const dropdownList = screen.getByRole('listbox');
    expect(getByRole(dropdownList, 'option', { name: "Open issues and PRs" })).toBeVisible();
    await user.click(getByRole(dropdownList, 'option', { name: "Open issues and PRs" }));

    cards = screen.getAllByTestId("project-card");
    expect(getByRole(cards[0], "heading", { name: "astropy/astropy" })).toBeVisible();

  });


  it("switches the displayed graphs", async () => {
    const { user } = userEventSetup(
      <Dashboard />
    );

    let cards = screen.getAllByTestId("project-card");
    expect(getByRole(cards[0], "heading", { name: "astropy/astropy" })).toBeVisible();
    expect(cards[0].textContent).toContain("Commits over time");

    await user.click(screen.getByRole('button', { name: "Show graphs for Commits over time" }));
    const dropdownList = screen.getByRole('listbox');
    expect(getByRole(dropdownList, 'option', { name: "Contributor distribution" })).toBeVisible();
    await user.click(getByRole(dropdownList, 'option', { name: "Contributor distribution" }));

    cards = screen.getAllByTestId("project-card");
    expect(cards[0].textContent).not.toContain("Commits over time");
    expect(cards[0].textContent).toContain("Contributor distribution");
  });


  it("applies filters as expected", async () => {
    const { user } = userEventSetup(
      <Dashboard />
    );

    // Filters are currently hidden
    expect(screen.getByRole('button', { name: "Show Filters" })).toBeVisible();
    expect(screen.queryByRole('button', { name: "Hide Filters" })).not.toBeInTheDocument();
    expect(screen.queryByText("Filter by top programming language")).not.toBeInTheDocument();
    expect(screen.queryByText("Filter by license")).not.toBeInTheDocument();

    // Enable filters
    await user.click(screen.getByRole('button', { name: "Show Filters" }));
    expect(screen.queryByRole('button', { name: "Show Filters" })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Hide Filters" })).toBeVisible();
    expect(screen.getByText("Filter by top programming language")).toBeVisible();
    expect(screen.getByText("Filter by license")).toBeVisible();

    // Check prior state
    let topPanel = screen.getByTestId('top-panel');
    expect(getByText(topPanel, "Showing 59 repositories", { exact: false })).toBeVisible();
    let cards = screen.getAllByTestId("project-card");
    expect(cards.length).toEqual(10); // Pagination shows only 10 per page
    expect(getByRole(cards[0], "heading", { name: "astropy/astropy" })).toBeVisible();

    // Filter by language
    await user.click(screen.getByRole('button', { name: "Filter by top programming language All" }));
    const languageDropdownList = screen.getByRole('listbox');
    expect(getByRole(languageDropdownList, 'option', { name: "C++" })).toBeVisible();
    await user.click(getByRole(languageDropdownList, 'option', { name: "C++" }));

    topPanel = screen.getByTestId('top-panel');
    expect(getByText(topPanel, "Showing 2 repositories", { exact: false })).toBeVisible();
    cards = screen.getAllByTestId("project-card");
    expect(cards.length).toEqual(2);
    expect(getByRole(cards[0], "heading", { name: "exoplanet-dev/celerite2" })).toBeVisible();

    // Filter by license
    await user.click(screen.getByRole('button', { name: "Filter by license All" }));
    const licenseDropdownList = screen.getByRole('listbox');
    expect(getByRole(licenseDropdownList, 'option', { name: "GNU" })).toBeVisible();
    await user.click(getByRole(licenseDropdownList, 'option', { name: "GNU" }));

    topPanel = screen.getByTestId('top-panel');
    expect(getByText(topPanel, "Showing 1 repositories", { exact: false })).toBeVisible();
    cards = screen.getAllByTestId("project-card");
    expect(cards.length).toEqual(1);
    expect(getByRole(cards[0], "heading", { name: "exoclime/FastChem" })).toBeVisible();
  }, 15000);


  it("resets filters as expected", async () => {
    const { user } = userEventSetup(
      <Dashboard />
    );

    expect(screen.getByRole('combobox')).toHaveValue("Astrobiology");
    expect(screen.getByRole('button', { name: "Filter by top programming language C++" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Filter by license GNU" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Sort by Open issues and PRs" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Show graphs for Contributor distribution" })).toBeVisible();

    await user.click(screen.getByRole('button', { name: "Reset" }));

    expect(screen.getByRole('combobox')).toHaveValue("Artificial intelligence");
    expect(screen.getByRole('button', { name: "Filter by top programming language All" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Filter by license All" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Sort by Relevance Documentation" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Show graphs for Commits over time" })).toBeVisible();
  });
});
