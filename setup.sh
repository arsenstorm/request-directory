#!/bin/bash

# Ensure the script is run from the directory where the config.toml file is located
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"

# Parse command-line arguments
NO_CACHE=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-cache) NO_CACHE=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ".env file not found. Please create a .env file with the necessary environment variables."
    exit 1
fi

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Check if NEXT_PUBLIC_SITE_URL is set
if [ -z "$NEXT_PUBLIC_SITE_URL" ]; then
    echo "NEXT_PUBLIC_SITE_URL is not set in the .env file."
    exit 1
fi

# Check if Docker is installed, if not, install it
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Installing Docker..."
    
    # Update the apt package index
    sudo apt-get update

    # Install packages to allow apt to use a repository over HTTPS
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Add Docker’s official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Set up the Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") \
      $(lsb_release -cs) stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Update the apt package index again
    sudo apt-get update

    # Install Docker Engine, CLI, and containerd
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io

    # Start Docker and enable it to start on boot
    sudo systemctl start docker
    sudo systemctl enable docker

    # Add current user to the docker group
    sudo usermod -aG docker $USER

    # Activate changes to groups
    newgrp docker

    echo "Docker has been installed."
fi

# Check if Docker daemon is running, if not, start it
if ! sudo systemctl is-active --quiet docker; then
    echo "Docker is not running. Starting Docker..."
    sudo systemctl start docker
    echo "Docker has been started."
else
    echo "Docker is already running."
fi

# Check if Docker Compose is installed, if not, install it
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose is not installed. Installing Docker Compose..."
    
    # Download the Docker Compose binary
    sudo curl -L "https://github.com/docker/compose/releases/download/$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Apply executable permissions
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create a symbolic link
    sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

    echo "Docker Compose has been installed."
fi

# Check if python3.12 is installed, if not, install it
if ! command -v python3.12 &> /dev/null
then
    echo "python3.12 could not be found. Installing python3.12..."
    sudo apt-get update
    sudo apt-get install -y python3.12
fi

# Check if venv module is available, if not, install it
if ! python3.12 -m venv --help &> /dev/null
then
    echo "Installing 'python3.12-venv' package..."
    sudo apt-get install -y python3.12-venv
fi

# Create a virtual environment
if [ ! -d "venv" ]; then
    python3.12 -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Upgrade pip in the virtual environment
pip install --upgrade pip

# Install required Python packages in the virtual environment
if ! python -c "import toml" &> /dev/null
then
    echo "Installing 'toml' package..."
    pip install toml
fi

if ! python -c "import yaml" &> /dev/null
then
    echo "Installing 'PyYAML' package..."
    pip install PyYAML
fi

# Run the Python script to generate docker-compose.yml
python3.12 << 'EOF'
import toml
import yaml
import os

# Read config.toml file
with open('config.toml', 'r') as f:
    config = toml.load(f)

# Initialize docker-compose structure
docker_compose = {
    'services': {}
}

# Define the NextJS app service
docker_compose['services']['request-directory'] = {
    'build': {
        'context': '.',
        'dockerfile': 'Dockerfile'
    },
    'environment': {},
    'ports': ['3000:3000'],
    'deploy': {
        'replicas': 1,
    },
    'restart': 'unless-stopped',
    'depends_on': [],
}

# Define the Kamal Proxy service
docker_compose['services']['proxy'] = {
    'image': 'basecamp/kamal-proxy',
    'ports': [
        '80:80',
        '443:443',
    ],
    'restart': 'unless-stopped',
    'depends_on': ['request-directory'],
}

# Get database settings
database = config.get('database', {})
supabase_setting = database.get('supabase', 'managed')

# Determine if supabase is local
local_supabase = (supabase_setting == 'local')

if local_supabase:
    # Define the Supabase service
    docker_compose['services']['supabase'] = {
        'image': 'supabase/postgres:latest',
        'ports': ['5432:5432', '8000:8000'],
        'environment': {
            'POSTGRES_PASSWORD': '${SUPABASE_PASSWORD}',
            'JWT_SECRET': '${SUPABASE_JWT_SECRET}',
            'SITE_URL': '${NEXT_PUBLIC_SITE_URL}',
            'SUPABASE_JWT_SECRET': '${SUPABASE_JWT_SECRET}',
            'SUPABASE_ANON_KEY': '${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}',
            'SUPABASE_SERVICE_ROLE_KEY': '${SUPABASE_SECRET_KEY}',
            'GITHUB_CLIENT_ID': '${GITHUB_CLIENT_ID}',
            'GITHUB_CLIENT_SECRET': '${GITHUB_CLIENT_SECRET}',
            'STRIPE_WEBHOOK_SIGNING_SECRET': '${STRIPE_WEBHOOK_SIGNING_SECRET}',
        },
        'volumes': [
            'supabase_data:/var/lib/postgresql/data',
            './supabase/config.toml:/supabase/config.toml'
        ]
    }
    docker_compose['services']['request-directory']['depends_on'].append(
        'supabase')

    # Modify or create the Supabase config.toml file
    supabase_config_dir = './supabase'
    os.makedirs(supabase_config_dir, exist_ok=True)
    supabase_config_file = os.path.join(supabase_config_dir, 'config.toml')

    # Create a default config.toml if it doesn't exist
    if os.path.exists(supabase_config_file):
        with open(supabase_config_file, 'r') as f:
            supabase_config = toml.load(f)
    else:
        supabase_config = {}

    # Modify the config.toml to add the GitHub OAuth configuration
    supabase_config.setdefault('auth', {}).setdefault(
        'external', {}).setdefault('github', {})
    supabase_config['auth']['external']['github']['enabled'] = True
    supabase_config['auth']['external']['github']['client_id'] = "env(GITHUB_CLIENT_ID)"
    supabase_config['auth']['external']['github']['secret'] = "env(GITHUB_CLIENT_SECRET)"

    # Write the updated config.toml
    with open(supabase_config_file, 'w') as f:
        toml.dump(supabase_config, f)

# Get the APIs configurations
api_configs = config.get('api', {})

# Define mapping from external API names to images and ports
external_api_images = {
    'nudenet': {
        'image': 'ghcr.io/arsenstorm/nudenet:latest',
        'ports': ['7001:7001'],
        'cap_add': ['SYS_RESOURCE'],
        'deploy': {
            'replicas': 1,
        },
        'restart': 'unless-stopped',
    },
    'facelandmarks': {
        'image': 'ghcr.io/arsenstorm/facelandmarks:latest',
        'ports': ['7002:7002'],
        'deploy': {
            'replicas': 1,
            'resources': {
                'limits': {
                    'memory': '3G',
                },
            },
        },
        'restart': 'unless-stopped',
    },
    'ageandgender': {
        'image': 'ghcr.io/arsenstorm/ageandgender:latest',
        'ports': ['7003:7003'],
        'deploy': {
            'replicas': 1,
            'resources': {
                'limits': {
                    'memory': '512M',
                },
            },
        },
        'restart': 'unless-stopped',
    },
    'youtube-dl': {
        'image': 'ghcr.io/arsenstorm/youtube-dl:latest',
        'ports': ['7005:7005'],
        'environment': {
            'R2_ENDPOINT': '${R2_ENDPOINT}',
            'R2_PUBLIC_URL': '${R2_PUBLIC_URL}',
            'R2_ACCESS_KEY': '${R2_ACCESS_KEY}',
            'R2_SECRET_KEY': '${R2_SECRET_KEY}',
            'R2_BUCKET_NAME': '${R2_BUCKET_NAME}',
        },
        'deploy': {
            'replicas': 1,
            'resources': {
                'limits': {
                    'memory': '512M',
                },
            },
        },
        'restart': 'unless-stopped',
    },
    # Add other external APIs here
}

# Environment Variables for external APIs
external_api_environment_variables = {
    'nudenet': {
        'NUDENET_URL': 'http://nudenet:7001/infer'
    },
    'facelandmarks': {
        'FACELANDMARKS_URL': 'http://facelandmarks:7002/landmarks'
    },
    'ageandgender': {
        'AGEANDGENDER_URL': 'http://ageandgender:7003/infer'
    },
    'youtube-dl': {
        'YOUTUBE_DL_URL': 'http://youtube-dl:7005/download'
    }
}

docker_compose['services']['request-directory']['environment'] = {
    # GitHub OAuth
    'GITHUB_CLIENT_ID': '${GITHUB_CLIENT_ID}',
    'GITHUB_CLIENT_SECRET': '${GITHUB_CLIENT_SECRET}',

    # Unkey
    'UNKEY_ROOT_KEY': '${UNKEY_ROOT_KEY}',
    'UNKEY_API_ID': '${UNKEY_API_ID}',

    # Supabase
    'NEXT_PUBLIC_SUPABASE_URL': '${NEXT_PUBLIC_SUPABASE_URL}',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': '${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}',
    'SUPABASE_SECRET_KEY': '${SUPABASE_SECRET_KEY}',
    'SUPABASE_JWT_SECRET': '${SUPABASE_JWT_SECRET}',

    # Stripe
    'STRIPE_PUBLISHABLE_KEY': '${STRIPE_PUBLISHABLE_KEY}',
    'STRIPE_SECRET_KEY': '${STRIPE_SECRET_KEY}'
}

# Process each API
for api_name, api_value in api_configs.items():
    api_enabled = api_value.get('enabled', False)
    api_type = api_value.get('type', 'internal')

    if api_enabled and api_type == 'external':
        # Get the external API configuration
        external_api = external_api_images.get(api_name)
        if external_api:
            service_name = api_name.replace('_', '-')
            service_config = {
                'image': external_api['image'],
                'ports': external_api['ports'],
            }

            if 'cap_add' in external_api:
                service_config['cap_add'] = external_api['cap_add']
            if 'privileged' in external_api:
                service_config['privileged'] = external_api['privileged']
            if 'deploy' in external_api:
                service_config['deploy'] = external_api['deploy']
            if 'restart' in external_api:
                service_config['restart'] = external_api['restart']

            docker_compose['services'][service_name] = service_config
            docker_compose['services']['request-directory']['depends_on'].append(
                service_name)

            # Add environment variables for this external API to the NextJS app service
            if api_name in external_api_environment_variables:
                docker_compose['services']['request-directory']['environment'].update(
                    external_api_environment_variables[api_name]
                )
        else:
            print(
                f"No image information for external API '{api_name}'. Skipping.")

# Write the docker-compose.yml file
with open('docker-compose.yml', 'w') as f:
    yaml.dump(docker_compose, f, sort_keys=False)

print("docker-compose.yml has been generated successfully.")
EOF

echo "docker-compose.yml has been generated successfully."

chmod +x ./deploy.sh

echo "Starting deployment..."
if [ "$NO_CACHE" = true ]; then
    ./deploy.sh --no-cache
else
    ./deploy.sh
fi
echo "Deployment completed."
