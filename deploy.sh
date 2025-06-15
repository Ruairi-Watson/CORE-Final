#!/bin/bash

# CORE Platform Deployment Script
# This script deploys the CORE platform to AWS Cloud9 and EC2

# Exit on any error
set -e

# Configuration
APP_NAME="core-platform"
REGION="us-east-1"  # AWS Academy Learner Lab only supports us-east-1 and us-west-2
INSTANCE_TYPE="t2.micro"
KEY_NAME="vockey"  # AWS Academy Learner Lab key pair name

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚀 Starting CORE Platform deployment..."

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Installing...${NC}"
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
fi

# Check AWS credentials and Learner Lab session
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Please ensure your Learner Lab session is active and AWS credentials are configured:${NC}"
    echo "aws configure"
    exit 1
fi

echo -e "${YELLOW}⚠️ Warning: AWS Academy Learner Lab sessions expire after 4 hours${NC}"
echo -e "${YELLOW}⚠️ Make sure to save your work and commit changes before session expiry${NC}"

# Create deployment package
echo "📦 Creating deployment package..."
zip -r deployment.zip . -x "*.git*" "node_modules/*" "deploy.sh"

# Create EC2 security group
echo "🔒 Setting up security group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "${APP_NAME}-sg" \
    --description "Security group for CORE Platform" \
    --output text \
    --query 'GroupId' 2>/dev/null || \
    aws ec2 describe-security-groups \
    --group-names "${APP_NAME}-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Configure security group rules
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 2>/dev/null || true

# Create EC2 launch template
echo "📝 Creating launch template..."
cat << EOF > user-data.sh
#!/bin/bash
yum update -y
yum install -y httpd git nodejs npm

# Install PM2 globally
npm install -y pm2 -g

# Clone and setup application
cd /var/www/html
aws s3 cp s3://\${S3_BUCKET}/deployment.zip .
unzip deployment.zip
npm install

# Configure Apache
cat << 'CONF' > /etc/httpd/conf.d/core-platform.conf
<VirtualHost *:80>
    DocumentRoot /var/www/html
    ServerName core-platform
    
    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog /var/log/httpd/core-platform-error.log
    CustomLog /var/log/httpd/core-platform-access.log combined
</VirtualHost>
CONF

# Start services
systemctl start httpd
systemctl enable httpd
pm2 start app.js
pm2 startup
pm2 save

# Set permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html
EOF

# Create S3 bucket for deployment
BUCKET_NAME="${APP_NAME}-deploy-$(date +%s)"
echo "🪣 Creating S3 bucket: ${BUCKET_NAME}..."
aws s3 mb "s3://${BUCKET_NAME}" --region $REGION

# Upload deployment package to S3
echo "📤 Uploading deployment package to S3..."
aws s3 cp deployment.zip "s3://${BUCKET_NAME}/"

# Use AWS Academy Learner Lab roles instead of creating new ones
ROLE_NAME="LabRole"
INSTANCE_PROFILE="LabInstanceProfile"

echo "👤 Using AWS Academy Learner Lab IAM role and instance profile..."

# Create Cloud9 environment
echo "🌩️ Creating Cloud9 environment..."
CLOUD9_ENV_ID=$(aws cloud9 create-environment-ec2 \
    --name "${APP_NAME}-dev" \
    --instance-type $INSTANCE_TYPE \
    --region $REGION \
    --automatic-stop-time-minutes 30 \
    --instance-profile-name $INSTANCE_PROFILE \
    --output text \
    --query 'environmentId')

# Wait for Cloud9 environment to be ready
echo "⏳ Waiting for Cloud9 environment to be ready..."
aws cloud9 wait environment-created --environment-id $CLOUD9_ENV_ID

# Get Cloud9 environment URL
CLOUD9_URL=$(aws cloud9 describe-environments \
    --environment-ids $CLOUD9_ENV_ID \
    --query 'environments[0].url' \
    --output text)

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}Cloud9 URL: ${CLOUD9_URL}${NC}"
echo -e "${GREEN}S3 Bucket: ${BUCKET_NAME}${NC}"

# Cleanup
rm -f trust-policy.json user-data.sh deployment.zip awscliv2.zip
rm -rf aws/

echo "
📝 Next steps:
1. Access your Cloud9 environment at: ${CLOUD9_URL}
2. Clone your repository in Cloud9
3. Run 'npm install' to install dependencies
4. Start the application with 'pm2 start app.js'

⚠️ Important AWS Academy Learner Lab Notes:
- Your session will expire after 4 hours
- All instances will be stopped when the session expires
- You'll need to restart instances when starting a new session
- Maximum instance limit is 9 instances
- Maximum volume size is 100GB
- Only us-east-1 region is fully supported

Remember to:
- Configure your Firebase credentials
- Set up EmailJS
- Update security group rules if needed
- Set up HTTPS with AWS Certificate Manager
" 