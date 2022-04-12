import argparse
import json


def get_topics(input_fi: str, output_fi: str) -> None:
    all_topics = set()
    with open(input_fi) as f:
        for line in f:
            js = json.loads(line)
            topics = js.get("full_metadata", {}).get("topics")
            if topics:
                all_topics.update(topics)
    with open(output_fi, mode="w") as f:
        for topic in all_topics:
            f.write(topic + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="curr_repos.jsonl")
    parser.add_argument("--output", default="curr_repo_topics.txt")
    args = parser.parse_args()

    get_topics(args.input, args.output)
