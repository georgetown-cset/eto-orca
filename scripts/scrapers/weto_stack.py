"""
Retrieves repos funded by the WETO, from WETOStack
"""

import os
import re

import requests
from utils import GH_LINK_REGEX, OUTPUT_SCRAPER_PARENT, OUTPUT_WEBSITE_PARENT


def scrape() -> None:
    """
    Retrieve repos listed in the WETOStack between two markdown headers, and write out as a manually
    curated list
    :return: None
    """
    md_resp = requests.get(
        "http://www.rafmudaf.com/WETOStack/_sources/software_list.md"
    )
    md_file = md_resp.text
    start = "## WETO Software"
    end = "## Other Funding Status"
    seen_start, seen_end = False, False
    out_website = open(os.path.join(OUTPUT_WEBSITE_PARENT, "weto.txt"), mode="w")
    out_scraper = open(os.path.join(OUTPUT_SCRAPER_PARENT, "weto.txt"), mode="w")
    for line in md_file.split("\n"):
        line = line.strip()
        seen_start |= line == start
        seen_end |= line == end
        if seen_start and not seen_end:
            repo = re.search(GH_LINK_REGEX, line)
            if repo:
                out_scraper.write(repo.group(0) + "\n")
                out_website.write(repo.group(2) + "\n")
    out_website.close()
    out_scraper.close()


if __name__ == "__main__":
    scrape()
