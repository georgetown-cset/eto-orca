INT_KEYS = {
    "subscribers_count",
    "stargazers_count",
    "open_issues",
    "num_releases",
    "num_contributors",
    "id",
    "used_by",
}
UNUSED_KEYS = {
    "matched_name",
    "topics",
    "sources",
    "issue_open_events",
    "ultimate_fork_of",
    "country_year_contributions",
    "org_year_contributions",
}

MIN_FIELD_REFERENCES = 3

OTHER_LICENSE = "Other"

LICENSE_TO_GROUP = {
    'BSD 2-Clause "Simplified" License': "BSD",
    'BSD 3-Clause "New" or "Revised" License': "BSD",
    'BSD 4-Clause "Original" or "Old" License': "BSD",
    "Academic Free License v3.0": OTHER_LICENSE,
    "Apache License 2.0": "Apache",
    "Artistic License 2.0": OTHER_LICENSE,
    "BSD 3-Clause Clear License": "BSD",
    "BSD Zero Clause License": "BSD",
    "Boost Software License 1.0": OTHER_LICENSE,
    "Creative Commons Attribution 4.0 International": "CC",
    "Creative Commons Attribution Share Alike 4.0 International": "CC",
    "Creative Commons Zero v1.0 Universal": "CC",
    "Do What The F*ck You Want To Public License": OTHER_LICENSE,
    "Eclipse Public License 1.0": OTHER_LICENSE,
    "Eclipse Public License 2.0": OTHER_LICENSE,
    "European Union Public License 1.1": OTHER_LICENSE,
    "European Union Public License 1.2": OTHER_LICENSE,
    "GNU Affero General Public License v3.0": "GNU",
    "GNU General Public License v2.0": "GNU",
    "GNU General Public License v3.0": "GNU",
    "GNU Lesser General Public License v2.1": "GNU",
    "GNU Lesser General Public License v3.0": "GNU",
    "ISC License": OTHER_LICENSE,
    "MIT License": "MIT",
    "MIT No Attribution": "MIT",
    "Mozilla Public License 2.0": OTHER_LICENSE,
    "Open Data Commons Open Database License v1.0": OTHER_LICENSE,
    "Other": OTHER_LICENSE,
    "The Unlicense": OTHER_LICENSE,
    "Universal Permissive License v1.0": OTHER_LICENSE,
    "University of Illinois/NCSA Open Source License": OTHER_LICENSE,
    "Vim License": OTHER_LICENSE,
    "zlib License": OTHER_LICENSE,
    None: "No license detected",
}