# Jenkins Auto-Deployment Setup Guide

## Overview
This guide will help you set up Jenkins to automatically deploy your NextJS application whenever changes are detected on the `fast` branch of your BoostFlow repository.

## Files Created

### 1. `Jenkinsfile.auto` (Polling-based)
- Uses SCM polling every 2 minutes to detect changes
- Simpler setup, no webhook configuration needed
- Slightly higher resource usage due to polling

### 2. `Jenkinsfile.webhook` (Webhook-based) - **RECOMMENDED**
- Uses GitHub webhooks for instant triggering
- More efficient and faster response time
- Requires webhook configuration in GitHub

## Setup Instructions

### Step 1: Choose Your Deployment Method

#### Option A: Polling-based (Easier Setup)
1. Rename your current `Jenkinsfile` to `Jenkinsfile.backup`
2. Rename `Jenkinsfile.auto` to `Jenkinsfile`
3. Commit and push to your repository

#### Option B: Webhook-based (Recommended)
1. Rename your current `Jenkinsfile` to `Jenkinsfile.backup`
2. Rename `Jenkinsfile.webhook` to `Jenkinsfile`
3. Set up GitHub webhook (see Step 2)
4. Commit and push to your repository

### Step 2: GitHub Webhook Setup (For Option B)

1. **Go to your GitHub repository**: `https://github.com/Kdim67/BoostFlow`

2. **Navigate to Settings > Webhooks**

3. **Click "Add webhook"**

4. **Configure the webhook**:
   - **Payload URL**: `http://your-jenkins-server:8080/github-webhook/`
     - Replace `your-jenkins-server` with your Jenkins server IP (likely `jenkins.boostflow.me`)
   - **Content type**: `application/json`
   - **Secret**: Leave empty or set a secret (optional)
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Checked

5. **Click "Add webhook"**

### Step 3: Jenkins Job Configuration

1. **Access Jenkins**: Go to `https://jenkins.boostflow.me`

2. **Create or Update Job**:
   - If you have an existing job, click on it and select "Configure"
   - If creating new, click "New Item" > "Pipeline" > Enter name (e.g., "boostflow-auto-deploy")

3. **Configure Pipeline**:
   - **Pipeline Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/Kdim67/BoostFlow.git`
   - **Credentials**: Select your GitHub credentials
   - **Branches to build**: `*/fast` (This ensures it only builds the fast branch)
   - **Script Path**: `Jenkinsfile` (or `Jenkinsfile.webhook` if you kept the original name)

4. **Build Triggers** (if using webhook):
   - ✅ Check "GitHub hook trigger for GITScm polling"

5. **Save the configuration**

### Step 4: Test the Setup

1. **Make a small change** to your code on the `fast` branch
2. **Commit and push** the change:
   ```bash
   git checkout fast
   git add .
   git commit -m "Test auto-deployment"
   git push origin fast
   ```
3. **Check Jenkins** - the job should trigger automatically
4. **Monitor the deployment** in the Jenkins console output

## What the Automated Pipeline Does

### 🔍 **Branch Validation**
- Checks if the trigger came from the `fast` branch
- Aborts if not on the target branch

### 🐳 **Docker Build & Push**
- Builds a new Docker image with commit-specific tag
- Pushes to your container registry
- Tags with both specific version and `latest`

### 🚀 **NextJS Deployment**
- Executes the `deploy_nextjs_only.yaml` playbook
- Targets only the `vag-prod-vm` (NextJS server)
- Restarts the application with the new image

### ✅ **Health Checks**
- Tests the NextJS health endpoint
- Verifies NGINX proxy functionality
- Checks HTTPS production endpoint
- Includes retry logic for reliability

## Key Features

### 🎯 **Targeted Deployment**
- Only affects the NextJS application
- MinIO and other services remain untouched
- Faster deployment times

### 🔄 **Automatic Triggering**
- No manual intervention required
- Triggers on every push to `fast` branch
- Immediate feedback on deployment status

### 🛡️ **Safety Features**
- Branch validation prevents accidental deployments
- Health checks ensure successful deployment
- Rollback capability (manual if needed)
- Detailed logging and error reporting

### 🧹 **Cleanup**
- Automatic Docker image cleanup
- Container pruning to save space
- Log archiving for troubleshooting

## Monitoring and Troubleshooting

### 📊 **Monitoring**
- Check Jenkins dashboard for build status
- Review console output for detailed logs
- Monitor application health at `https://boostflow.me`

### 🔧 **Troubleshooting**

#### Common Issues:

1. **Webhook not triggering**:
   - Check GitHub webhook delivery status
   - Verify Jenkins URL is accessible from GitHub
   - Ensure Jenkins job is configured for webhook triggers

2. **Build failing on branch validation**:
   - Ensure you're pushing to the `fast` branch
   - Check that the branch name matches exactly

3. **Ansible playbook errors**:
   - Verify ansible-boostflow repository is accessible
   - Check that the playbook path is correct
   - Ensure SSH keys and permissions are set up

4. **Health checks failing**:
   - Increase wait time in the pipeline
   - Check if the application is actually starting
   - Verify network connectivity between Jenkins and app server

### 📝 **Logs Location**
- Jenkins console output: Available in Jenkins web interface
- Application logs: On the target VM at `/opt/boostflow/logs/`
- Nginx logs: `/var/log/nginx/`

## Customization Options

### 🔧 **Modify Deployment Behavior**

You can customize the pipeline by editing the `Jenkinsfile`:

- **Change target branch**: Modify `DEPLOYMENT_BRANCH` variable
- **Adjust health check timing**: Modify `sleep` duration
- **Add notifications**: Uncomment Slack/email sections
- **Change retry attempts**: Modify `retry(3)` values
- **Add additional checks**: Add more stages as needed

### 📧 **Add Notifications**

To add Slack notifications, uncomment and configure:
```groovy
slackSend(channel: '#deployments', message: "✅ BoostFlow deployed successfully!")
```

### 🎯 **Multiple Branch Support**

To support multiple branches, modify the `when` conditions:
```groovy
when {
    anyOf {
        branch 'fast'
        branch 'staging'
        branch 'develop'
    }
}
```

## Security Considerations

- 🔐 Ensure Jenkins credentials are properly secured
- 🛡️ Use HTTPS for webhook communications
- 🔑 Regularly rotate Docker registry credentials
- 📋 Review and audit deployment logs regularly
- 🚫 Never commit sensitive information to the repository

## Next Steps

1. ✅ Choose and implement one of the Jenkinsfile options
2. ✅ Configure GitHub webhook (if using webhook option)
3. ✅ Set up Jenkins job with proper branch configuration
4. ✅ Test with a small change to the `fast` branch
5. ✅ Monitor the first few automated deployments
6. ✅ Customize notifications and additional checks as needed

---

**🎉 Once set up, every push to the `fast` branch will automatically deploy your NextJS application!**

The deployment will be fast, targeted, and safe - affecting only the NextJS application while leaving MinIO and other services running normally.