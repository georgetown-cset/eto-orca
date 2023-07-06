"""
Retrieves repos funded by the WETO, from WETOStack
"""

import os
import re

import requests
from utils import GH_LINK_REGEX, OUTPUT_PARENT


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
    with open(os.path.join(OUTPUT_PARENT, "weto.txt"), mode="w") as out:
        for line in md_file.split("\n"):
            line = line.strip()
            seen_start |= line == start
            seen_end |= line == end
            if seen_start and not seen_end:
                repo = re.search(GH_LINK_REGEX, line)
                if repo:
                    out.write(repo.group(0) + "\n")


if __name__ == "__main__":
    scrape()
