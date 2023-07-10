"""
Retrieves repos aggregated by Open Sustainable Technology
"""

import os
import re

import requests
from utils import GH_LINK_REGEX, OUTPUT_SCRAPER_PARENT, OUTPUT_WEBSITE_PARENT


def scrape() -> None:
    """
    Retrieve repos listed in Open Sustainable Technology, and write out as manually curated lists
    :return: None
    """
    md_resp = requests.get(
        "https://raw.githubusercontent.com/protontypes/open-sustainable-technology/main/README.md"
    )
    md_file = md_resp.text
    start = "<!--toc_end-->"
    end = "### Curated Lists"
    seen_start, seen_end = False, False
    out_scraper = open(
        os.path.join(OUTPUT_SCRAPER_PARENT, "open_sustainable_technology.txt"), mode="w"
    )
    out_website = None
    curr_general_topic, curr_specific_topic = None, None
    for line in md_file.split("\n"):
        line = line.strip()
        seen_start |= line == start
        seen_end |= line == end
        if seen_start and not seen_end:
            if line.startswith("### "):
                curr_specific_topic = line.replace("### ", "").strip()
                if out_website:
                    out_website.close()
                out_subject_parent = os.path.join(
                    OUTPUT_WEBSITE_PARENT,
                    "open_sustainable_technology",
                    curr_general_topic,
                )
                os.makedirs(out_subject_parent, exist_ok=True)
                out_website = open(
                    os.path.join(out_subject_parent, curr_specific_topic + ".txt"),
                    mode="w",
                )
            elif line.startswith("## "):
                curr_general_topic = line.replace("## ", "").strip()
            repo = re.search(GH_LINK_REGEX, line)
            if repo:
                out_scraper.write(repo.group(0) + "\n")
                out_website.write(repo.group(2) + "\n")
    out_website.close()
    out_scraper.close()


if __name__ == "__main__":
    scrape()
