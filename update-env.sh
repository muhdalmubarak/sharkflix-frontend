#!/bin/bash

echo "Loading secret environment variables"

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
PARAMETERS=$(aws ssm get-parameters-by-path --path "$PARAMETER_PATH" --with-decryption --recursive --query 'Parameters[*].[Name,Value]' --output json)

# Check if parameters exist
if [ -z "$PARAMETERS" ] || [ "$PARAMETERS" == "[]" ]; then
    echo "No parameters found at $PARAMETER_PATH"
    exit 1
fi

# Loop through and export each parameter
echo "$PARAMETERS" | jq -c '.[]' | while read -r i; do
    NAME=$(echo $i | jq -r '.[0]')   # Full AWS SSM parameter name
    VALUE=$(echo $i | jq -r '.[1]')  # Secret value
    ENV_NAME=$(basename "$NAME")     # Extract only last part of the path

    echo "Exporting $ENV_NAME"

    # Export to runtime and `.env` file
    echo "export $ENV_NAME='$VALUE'" >> $BASH_ENV
    echo "$ENV_NAME=$VALUE" >> .env
done

# Load new environment variables
source $BASH_ENV

echo "Secret environment variables loaded successfully."
