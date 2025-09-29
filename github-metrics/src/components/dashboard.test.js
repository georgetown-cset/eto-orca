import React from 'react';
import { screen, act, getAllByRole, getByRole, getByText } from '@testing-library/react';

import Dashboard from './dashboard';
import { userEventSetup } from '../util/testing';

window.HTMLElement.prototype.scrollIntoView = jest.fn();

const currentlyTrackingHeading = (num, field) => {
  return `Currently tracking ${num} software repositories mentioned in research into ${field} .`;
}

describe("filter panel", () => {
  it("toggle modes and adjust sorts", async () => {
    const { user } = userEventSetup(
      <Dashboard />
    );

    let topReposHeading;
    let topEntries;
    let cards;
    let dropdownList;

    expect(screen.getByRole("heading", { name: currentlyTrackingHeading(9781, "artificial intelligence") })).toBeVisible();
    topReposHeading = screen.getByRole("heading", { name: "Top repositories by stars" });
    topEntries = getAllByRole(topReposHeading.parentElement, "listitem");
    expect(topEntries[0].textContent).toMatch("public-apis/public-apis364420 stars (-99.91%, 2024-2025)");
    expect(topEntries[1].textContent).toEqual("facebook/react238519 stars (-99.99%, 2024-2025)");

    // Switch research fields
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText("Astrobiology")).toBeVisible();
    await act(() => {
      user.click(screen.getByText("Astrobiology"));
    });
    await new Promise(res => setTimeout(res, 500));
    expect(screen.getByRole("heading", { name: currentlyTrackingHeading(102, "astrobiology") })).toBeVisible();
    topReposHeading = screen.getByRole("heading", { name: "Top repositories by stars" });
    topEntries = getAllByRole(topReposHeading.parentElement, "listitem");
    expect(topEntries[0].textContent).toEqual("jax-ml/jax33360 stars (+3.60%, 2023-2024)");
    expect(topEntries[1].textContent).toEqual("astropy/astropy4815 stars (-99.80%, 2024-2025)");


    // Toggle between summary and list view
    await user.click(screen.getByRole('checkbox'));
    await new Promise(res => setTimeout(res, 500));
    expect(screen.getByRole("button", { name: "Show Filters" })).toBeVisible();
    cards = screen.getAllByTestId("project-card");
    expect(getByRole(cards[0], "heading", { name: "jlillo/tpfplotter" })).toBeVisible();
    expect(cards[0].textContent).toContain("Stars: 36");
    expect(cards[0].textContent).toContain("Top Programming Language: Python");
    expect(cards[0].textContent).toContain("Commits over time");
    expect(getByRole(cards[1], "heading", { name: "hannorein/rebound" })).toBeVisible();
    expect(cards[1].textContent).toContain("Date created: 2011-07-02");
    expect(cards[1].textContent).toContain("License: GNU General Public License v3.0");


    // Switch the sort criteria
    cards = screen.getAllByTestId("project-card");
    expect(screen.getByRole("button", { name: "Show Filters" })).toBeVisible();
    await user.click(screen.getByRole('button', { name: "Sort by Relevance" }));
    dropdownList = screen.getByRole('listbox');
    expect(getByRole(dropdownList, 'option', { name: "Open issues and PRs" })).toBeVisible();
    await user.click(getByRole(dropdownList, 'option', { name: "Open issues and PRs" }));
    cards = screen.getAllByTestId("project-card");
    expect(getByRole(cards[0], "heading", { name: "jax-ml/jax" })).toBeVisible();


    // Switch the displayed graphs
    cards = screen.getAllByTestId("project-card");
    expect(cards[0].textContent).toContain("Commits over time");
    await user.click(screen.getByRole('button', { name: "Show graphs for Commits over time" }));
    dropdownList = screen.getByRole('listbox');
    expect(getByRole(dropdownList, 'option', { name: "Contributor distribution" })).toBeVisible();
    await user.click(getByRole(dropdownList, 'option', { name: "Contributor distribution" }));
    cards = screen.getAllByTestId("project-card");
    expect(cards[0].textContent).not.toContain("Commits over time");
    expect(cards[0].textContent).toContain("Contributor distribution");


    // Reset filters as expected
    expect(screen.getByRole('combobox')).toHaveValue("Astrobiology");
    expect(screen.getByRole('button', { name: "Sort by Open issues and PRs" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Show graphs for Contributor distribution" })).toBeVisible();
    await user.click(screen.getByRole('button', { name: "Reset" }));
    expect(screen.getByRole('combobox')).toHaveValue("Artificial Intelligence");
    expect(screen.getByRole('button', { name: "Sort by Relevance" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Show graphs for Commits over time" })).toBeVisible();
  }, 15000);


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
    expect(getByText(topPanel, "Showing 9781 repositories", { exact: false })).toBeVisible();
    let cards = screen.getAllByTestId("project-card");
    expect(cards.length).toEqual(10); // Pagination shows only 10 per page
    expect(getByRole(cards[0], "heading", { name: "huggingface/transformers" })).toBeVisible();
    expect(getByRole(cards[1], "heading", { name: "facebookresearch/fairseq" })).toBeVisible();

    // Filter by language
    await user.click(screen.getByRole('button', { name: "Filter by top programming language All" }));
    const languageDropdownList = screen.getByRole('listbox');
    expect(getByRole(languageDropdownList, 'option', { name: "C++" })).toBeVisible();
    await user.click(getByRole(languageDropdownList, 'option', { name: "C++" }));

    topPanel = screen.getByTestId('top-panel');
    expect(getByText(topPanel, "Showing 373 repositories", { exact: false })).toBeVisible();
    cards = screen.getAllByTestId("project-card");
    expect(cards.length).toEqual(10);
    expect(getByRole(cards[0], "heading", { name: "google/sentencepiece" })).toBeVisible();

    // Filter by license
    await user.click(screen.getByRole('button', { name: "Filter by license All" }));
    const licenseDropdownList = screen.getByRole('listbox');
    expect(getByRole(licenseDropdownList, 'option', { name: "GNU" })).toBeVisible();
    await user.click(getByRole(licenseDropdownList, 'option', { name: "GNU" }));

    topPanel = screen.getByTestId('top-panel');
    expect(getByText(topPanel, "Showing 33 repositories", { exact: false })).toBeVisible();
    cards = screen.getAllByTestId("project-card");
    expect(cards.length).toEqual(10);
    expect(getByRole(cards[0], "heading", { name: "argotorg/solidity" })).toBeVisible();
    expect(getByRole(cards[1], "heading", { name: "neubig/lamtram" })).toBeVisible();


    // Reset filters as expected
    expect(screen.getByRole('combobox')).toHaveValue("Artificial Intelligence");
    expect(screen.getByRole('button', { name: "Filter by top programming language C++" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Filter by license GNU" })).toBeVisible();
    await user.click(screen.getByRole('button', { name: "Reset" }));
    expect(screen.getByRole('combobox')).toHaveValue("Artificial Intelligence");
    expect(screen.getByRole('button', { name: "Filter by top programming language All" })).toBeVisible();
    expect(screen.getByRole('button', { name: "Filter by license All" })).toBeVisible();
  }, 10000);
});
