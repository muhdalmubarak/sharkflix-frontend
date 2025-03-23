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

# Debug: Print the fetched parameters
echo "Fetched parameters: $PARAMETERS"

# Check if parameters exist
if [ -z "$PARAMETERS" ] || [[ "$PARAMETERS" == "[]" ]]; then
    echo "No parameters found at $PARAMETER_PATH"
    exit 1
fi

# Clear the .env file before writing new variables
> .env

# Extract values manually using Bash string manipulation
# Loop through each parameter in the JSON array
echo "$PARAMETERS" | grep -o '{[^}]*}' | while read -r param; do
    # Debug: Print the current parameter being processed
    echo "Processing parameter: $param"

    NAME=$(echo "$param" | grep -o '"Name": *"[^"]*"' | sed -E 's/.*"Name": *"([^"]+)".*/\1/')
    VALUE=$(echo "$param" | grep -o '"Value": *"[^"]*"' | sed -E 's/.*"Value": *"([^"]+)".*/\1/')

    # Debug: Print extracted NAME and VALUE
    echo "Extracted NAME: $NAME"
    echo "Extracted VALUE: $VALUE"

    # Extract only the last part of the name (parameter key)
    ENV_NAME=$(basename "$NAME")

    echo "Exporting $ENV_NAME"

    # Write to the .env file
    echo "$ENV_NAME=$VALUE" >> .env
done

# Load new environment variables from the .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: .env file not found!"
    exit 1
fi

echo "Secret environment variables loaded successfully."