#!/bin/bash

echo "Loading secret environment variables..."

# Check if the `env` file exists and load it
if [ -f env ]; then
    export $(grep -v '^#' env | xargs)
else
    echo "Error: env file not found!"
    exit 1
fi

# Ensure AMPLIFY_APP_ID is available
if [ -z "$AMPLIFY_APP_ID" ]; then
    echo "Error: AMPLIFY_APP_ID is missing in env! Exiting..."
    exit 1
fi

echo "Using AMPLIFY_APP_ID: $AMPLIFY_APP_ID"

# Construct the AWS SSM parameter path dynamically
PARAMETER_PATH="/amplify/shared/$AMPLIFY_APP_ID/"

# Fetch all parameters from AWS SSM (JSON format)
PARAMETERS=$(aws ssm get-parameters-by-path --path "$PARAMETER_PATH" --with-decryption --recursive --query 'Parameters[*]' --output json)

# Check if parameters exist
if [ -z "$PARAMETERS" ] || [[ "$PARAMETERS" == "[]" ]]; then
    echo "No parameters found at $PARAMETER_PATH"
    exit 1
fi

> .env

# Loop through each parameter in the JSON array
while read -r line; do
    if [[ "$line" == *'"Name":'* ]]; then
        NAME=$(echo "$line" | sed -E 's/.*"Name": "([^"]+)".*/\1/')
    fi
    if [[ "$line" == *'"Value":'* ]]; then
        VALUE=$(echo "$line" | sed -E 's/.*"Value": "([^"]+)".*/\1/')

        # Extract only the last part of the name (parameter key)
        ENV_NAME=$(basename "$NAME")

        echo "Exporting $ENV_NAME"

        echo "$ENV_NAME=$VALUE" >> .env
    fi
done <<< "$PARAMETERS"

echo "Secret environment variables loaded successfully."