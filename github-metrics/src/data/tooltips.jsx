import React from "react";
import {ExternalLink} from "@eto/eto-ui-components";

export const tooltips = {
  "relevance": "Relevance is a TIFIDF-based metric we use to rank repositories by their salience to the field, where terms are repository mentions and documents are fields - i.e. we calculate (number of articles mentioning a repository within a field) * log(number of total fields / (number of fields mentioning the repository + 1)).",
  "research_field": "Select a research field to view relevant repositories, as determined by human curation or by automatic assignment based on article field of study tags.",
  "mentions": "Selecting 'mentions' will order by the list by the number of mentions each repository received in the current research field. We say that an article mentions a repository if we find a mention of that repository in the article's title, abstract, or fulltext (where available), if the article is affiliated with the repository in Papers with Code, or if we find a link to the article's DOI in the repository's README, for articles that are part of The Stack.",
  "criticality": <span>An <ExternalLink href={"https://github.com/ossf/criticality_score"}>OpenSSF measure</ExternalLink> of the project's influence and importance.</span>,
  "field_references": "Number of mentions in articles that were automatically assigned to a field of study.",
  "number_of_mentions": <span>We <ExternalLink href={"https://aclanthology.org/2022.sdp-1.12/"}>automatically assign</ExternalLink> papers to research fields, then count the number of repository mentions within papers in that field.</span>
};
