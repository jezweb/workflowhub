#!/bin/bash

# Email Domain Configuration Script for WorkflowHub
# This script helps configure email domain restrictions for user registration

# Color codes for better UX
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to print colored output
print_color() {
    echo -e "$1$2${NC}"
}

# Function to print header
print_header() {
    echo
    print_color "${CYAN}${BOLD}" "========================================="
    print_color "${CYAN}${BOLD}" "   WorkflowHub Email Domain Configuration"
    print_color "${CYAN}${BOLD}" "========================================="
    echo
}

# Function to validate domain format
validate_domain() {
    local domain=$1
    # Basic domain validation regex
    if [[ $domain =~ ^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z]{2,}$ ]] || [[ $domain == "*" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to get current configuration
get_current_config() {
    print_color "${YELLOW}" "Fetching current configuration..."
    
    # Try to get from wrangler.toml
    if [ -f "wrangler.toml" ]; then
        local current=$(grep "ALLOWED_EMAIL_DOMAINS" wrangler.toml | cut -d'"' -f2)
        if [ ! -z "$current" ]; then
            print_color "${GREEN}" "Current local config (wrangler.toml): $current"
        fi
    fi
    
    echo
}

# Function to show examples
show_examples() {
    print_color "${CYAN}${BOLD}" "Configuration Examples:"
    echo
    print_color "${BLUE}" "  Open Registration (anyone can register):"
    echo "    *"
    echo
    print_color "${BLUE}" "  Single Domain:"
    echo "    company.com"
    echo
    print_color "${BLUE}" "  Multiple Domains:"
    echo "    company.com,partner.org,client.net"
    echo
    print_color "${BLUE}" "  Subdomain Wildcard:"
    echo "    *.company.com (allows mail@dev.company.com, mail@test.company.com, etc.)"
    echo
    print_color "${BLUE}" "  Mixed Configuration:"
    echo "    *.company.com,partner.org,specific.client.com"
    echo
}

# Function to configure open registration
configure_open() {
    print_color "${GREEN}" "Configuring open registration (anyone can register)..."
    echo
    FINAL_CONFIG="*"
    print_color "${CYAN}" "Configuration will be set to: ${BOLD}*"
    return 0
}

# Function to configure single domain
configure_single() {
    print_color "${GREEN}" "Configure single domain restriction"
    echo
    read -p "Enter the allowed domain (e.g., company.com): " domain
    
    if validate_domain "$domain"; then
        FINAL_CONFIG="$domain"
        print_color "${GREEN}" "✓ Valid domain: $domain"
        return 0
    else
        print_color "${RED}" "✗ Invalid domain format: $domain"
        return 1
    fi
}

# Function to configure multiple domains
configure_multiple() {
    print_color "${GREEN}" "Configure multiple domain restrictions"
    echo
    print_color "${YELLOW}" "Enter domains one at a time. Press Enter with empty input when done."
    echo
    
    local domains=()
    local counter=1
    
    while true; do
        read -p "Domain $counter (or press Enter to finish): " domain
        
        if [ -z "$domain" ]; then
            if [ ${#domains[@]} -eq 0 ]; then
                print_color "${RED}" "You must enter at least one domain!"
                continue
            else
                break
            fi
        fi
        
        if validate_domain "$domain"; then
            domains+=("$domain")
            print_color "${GREEN}" "✓ Added: $domain"
            ((counter++))
        else
            print_color "${RED}" "✗ Invalid domain format: $domain"
        fi
    done
    
    # Join domains with comma
    FINAL_CONFIG=$(IFS=','; echo "${domains[*]}")
    echo
    print_color "${CYAN}" "Configuration will be set to: ${BOLD}$FINAL_CONFIG"
    return 0
}

# Function to configure with wildcards
configure_wildcard() {
    print_color "${GREEN}" "Configure with subdomain wildcards"
    echo
    print_color "${YELLOW}" "You can use *.domain.com to allow all subdomains"
    echo
    
    local domains=()
    local counter=1
    
    while true; do
        read -p "Domain $counter (e.g., *.company.com or press Enter to finish): " domain
        
        if [ -z "$domain" ]; then
            if [ ${#domains[@]} -eq 0 ]; then
                print_color "${RED}" "You must enter at least one domain!"
                continue
            else
                break
            fi
        fi
        
        if validate_domain "$domain"; then
            domains+=("$domain")
            print_color "${GREEN}" "✓ Added: $domain"
            ((counter++))
        else
            print_color "${RED}" "✗ Invalid domain format: $domain"
        fi
    done
    
    # Join domains with comma
    FINAL_CONFIG=$(IFS=','; echo "${domains[*]}")
    echo
    print_color "${CYAN}" "Configuration will be set to: ${BOLD}$FINAL_CONFIG"
    return 0
}

# Function to apply configuration
apply_config() {
    echo
    print_color "${YELLOW}${BOLD}" "Where do you want to apply this configuration?"
    echo
    echo "1) Local development only (update wrangler.toml)"
    echo "2) Production Cloudflare Worker"
    echo "3) Both local and production"
    echo "4) Cancel"
    echo
    read -p "Select option (1-4): " apply_choice
    
    case $apply_choice in
        1)
            apply_local
            ;;
        2)
            apply_production
            ;;
        3)
            apply_local
            apply_production
            ;;
        4)
            print_color "${YELLOW}" "Configuration cancelled."
            ;;
        *)
            print_color "${RED}" "Invalid option!"
            ;;
    esac
}

# Function to apply to local wrangler.toml
apply_local() {
    echo
    print_color "${YELLOW}" "Updating local wrangler.toml..."
    
    if [ -f "wrangler.toml" ]; then
        # Check if ALLOWED_EMAIL_DOMAINS exists in the file
        if grep -q "ALLOWED_EMAIL_DOMAINS" wrangler.toml; then
            # Update existing line
            sed -i.bak "s/ALLOWED_EMAIL_DOMAINS = .*/ALLOWED_EMAIL_DOMAINS = \"$FINAL_CONFIG\"/" wrangler.toml
            print_color "${GREEN}" "✓ Updated wrangler.toml"
        else
            # Add new line in [vars] section
            sed -i.bak "/\[vars\]/a ALLOWED_EMAIL_DOMAINS = \"$FINAL_CONFIG\"" wrangler.toml
            print_color "${GREEN}" "✓ Added to wrangler.toml"
        fi
        
        # Show the change
        echo
        print_color "${CYAN}" "Updated configuration:"
        grep "ALLOWED_EMAIL_DOMAINS" wrangler.toml
    else
        print_color "${RED}" "✗ wrangler.toml not found!"
    fi
}

# Function to apply to production
apply_production() {
    echo
    print_color "${YELLOW}" "Updating production Cloudflare Worker..."
    echo
    print_color "${CYAN}" "This will run: wrangler secret put ALLOWED_EMAIL_DOMAINS"
    echo
    read -p "Continue? (y/n): " confirm
    
    if [[ $confirm == [yY] ]]; then
        echo "$FINAL_CONFIG" | wrangler secret put ALLOWED_EMAIL_DOMAINS
        
        if [ $? -eq 0 ]; then
            print_color "${GREEN}" "✓ Successfully updated production configuration!"
        else
            print_color "${RED}" "✗ Failed to update production. Make sure you're logged in to Cloudflare."
            print_color "${YELLOW}" "Run 'wrangler login' if needed."
        fi
    else
        print_color "${YELLOW}" "Production update cancelled."
    fi
}

# Main menu
main_menu() {
    while true; do
        print_header
        get_current_config
        
        print_color "${CYAN}${BOLD}" "Select Configuration Type:"
        echo
        echo "1) Open Registration (anyone can register)"
        echo "2) Single Domain Restriction"
        echo "3) Multiple Domain Restrictions"
        echo "4) Subdomain Wildcards (*.domain.com)"
        echo "5) Show Examples"
        echo "6) Exit"
        echo
        read -p "Select option (1-6): " choice
        
        case $choice in
            1)
                if configure_open; then
                    apply_config
                fi
                ;;
            2)
                if configure_single; then
                    apply_config
                fi
                ;;
            3)
                if configure_multiple; then
                    apply_config
                fi
                ;;
            4)
                if configure_wildcard; then
                    apply_config
                fi
                ;;
            5)
                show_examples
                echo
                read -p "Press Enter to continue..."
                ;;
            6)
                print_color "${GREEN}" "Goodbye!"
                exit 0
                ;;
            *)
                print_color "${RED}" "Invalid option! Please select 1-6."
                sleep 2
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
    done
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "wrangler.toml" ]; then
    print_color "${RED}" "Error: This script must be run from the WorkflowHub project root directory!"
    print_color "${YELLOW}" "Please cd to your WorkflowHub directory and try again."
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_color "${RED}" "Error: Wrangler CLI is not installed!"
    print_color "${YELLOW}" "Install it with: npm install -g wrangler"
    exit 1
fi

# Start the script
main_menu