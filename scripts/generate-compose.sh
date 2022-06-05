#!/bin/sh
CONFIG_FOLDER="config/$1"
TEMPLATE_FILE="$CONFIG_FOLDER/docker-compose.yml"
CONFIG_FILE="$CONFIG_FOLDER/config.json"

if [ ! -n "$1" ]; then
  echo "Error: Provide config folder"
  exit 1
fi

if [ ! -d "$CONFIG_FOLDER" ]; then
  echo "Error: Folder does not exist"
  exit 1
fi

END_LINE=$(grep -n "^services:" "$TEMPLATE_FILE" | cut -d: -f1)
START_LINE=$(($END_LINE - 1))

WORKERS="\nx-workers: &workers"
for KEY in $(jq '.targets | keys[]' -r "$CONFIG_FILE"); do
  WORKERS+="\n"
  WORKERS+="$(
    cat <<EOF
  $KEY:
    <<: *cctv
    command: ["yarn", "start:worker", "$KEY"]
EOF
  )"
done

echo "$(head -n $START_LINE "$TEMPLATE_FILE")" >docker-compose.yml
echo "$WORKERS\n" >>docker-compose.yml
echo "$(tail -n +$END_LINE "$TEMPLATE_FILE")" >>docker-compose.yml
