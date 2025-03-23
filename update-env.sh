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

# Fetch all parameters from AWS SSM
PARAMETERS=$(aws ssm get-parameters-by-path --path "$PARAMETER_PATH" --with-decryption --recursive --query 'Parameters[*].[Name,Value]' --output text)

# Check if parameters exist
if [ -z "$PARAMETERS" ]; then
    echo "No parameters found at $PARAMETER_PATH"
    exit 1
fi

# Loop through parameters and export them
while read -r NAME VALUE; do
    if [[ -z "$NAME" || -z "$VALUE" ]]; then
        continue  # Skip invalid entries
    fi

    ENV_NAME=$(basename "$NAME")  # Extract only the last part of the path

    # Export to runtime and `.env` file
    echo "export $ENV_NAME='$VALUE'" >> "$BASH_ENV"
    echo "$ENV_NAME=$VALUE" >> .env
done <<< "$PARAMETERS"

# Load new environment variables
source "$BASH_ENV"

echo "Secret environment variables loaded successfully."
