#!/bin/bash

# Exit on error
set -e

# Function to load env files safely handling comments
load_env_file() {
  local file=$1
  if [ -f "$file" ]; then
    echo "📄 Loading $file..."
    while IFS= read -r line || [ -n "$line" ]; do
      # Trim leading/trailing whitespace
      line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
      
      # Skip comments and empty lines
      if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then
        continue
      fi
      
      # Match KEY=VALUE (tolerant of spaces around =)
      if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)[[:space:]]*=[[:space:]]*(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Remove trailing comments
        value=${value%% #*}
        
        # Remove surrounding quotes if simple
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        # Export and Log
        if [ -n "$key" ]; then
             export "$key=$value"
             # Debug log (masking value slightly)
             echo "   ✅ Loaded: $key"
        fi
      fi
    done < "$file"
  fi
}

# Try loading .env first, then .env.local (overriding)
load_env_file .env
load_env_file .env.local

# Handle variable name mismatch (User used AUTH_CLIENT_* instead of AUTH_GOOGLE_*)
if [ -z "$AUTH_GOOGLE_ID" ] && [ -n "$AUTH_CLIENT_ID" ]; then
  echo "⚠️  Mapping AUTH_CLIENT_ID to AUTH_GOOGLE_ID"
  AUTH_GOOGLE_ID="$AUTH_CLIENT_ID"
fi

if [ -z "$AUTH_GOOGLE_SECRET" ] && [ -n "$AUTH_CLIENT_SECRET" ]; then
  echo "⚠️  Mapping AUTH_CLIENT_SECRET to AUTH_GOOGLE_SECRET"
  AUTH_GOOGLE_SECRET="$AUTH_CLIENT_SECRET"
fi

# Debug: Print status of critical vars
echo "🔍 Checking configuration..."
if [ -n "$AUTH_GOOGLE_ID" ]; then echo "   OK: AUTH_GOOGLE_ID found"; else echo "   MISSING: AUTH_GOOGLE_ID"; fi
if [ -n "$AUTH_GOOGLE_SECRET" ]; then echo "   OK: AUTH_GOOGLE_SECRET found"; else echo "   MISSING: AUTH_GOOGLE_SECRET"; fi
if [ -n "$AUTH_SECRET" ]; then echo "   OK: AUTH_SECRET found"; else echo "   MISSING: AUTH_SECRET"; fi

PROJECT_ID=$(gcloud config get-value project)
echo "🚀 Setting up secrets for project: $PROJECT_ID"

# Enable Secret Manager API
echo "🔌 Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com

# Function to create or update a secret
create_secret() {
  local name=$1
  local value=$2

  if [ -z "$value" ]; then
    echo "❌ Error: Value for $name is missing. Please add it to your .env file."
    return 1
  fi

  # Check if secret exists
  if gcloud secrets describe $name --project="$PROJECT_ID" > /dev/null 2>&1; then
    echo "🔄 Updating secret: $name"
    printf "$value" | gcloud secrets versions add $name --data-file=- --project="$PROJECT_ID"
  else
    echo "✨ Creating secret: $name"
    printf "$value" | gcloud secrets create $name --data-file=- --project="$PROJECT_ID"
  fi
}

# Create secrets
create_secret "AUTH_GOOGLE_ID" "$AUTH_GOOGLE_ID"
create_secret "AUTH_GOOGLE_SECRET" "$AUTH_GOOGLE_SECRET"
create_secret "AUTH_SECRET" "$AUTH_SECRET"

# Grant Cloud Run access to secrets
# We assume the default compute service account is used by Cloud Run
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

echo "🔑 Granting access to Cloud Run Service Account: $SERVICE_ACCOUNT"

gcloud secrets add-iam-policy-binding AUTH_GOOGLE_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" --project="$PROJECT_ID" > /dev/null

gcloud secrets add-iam-policy-binding AUTH_GOOGLE_SECRET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" --project="$PROJECT_ID" > /dev/null

gcloud secrets add-iam-policy-binding AUTH_SECRET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" --project="$PROJECT_ID" > /dev/null

echo "✅ Success! Secrets configured and linked to Cloud Run."
