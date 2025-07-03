pipeline {
    agent any
    stages {
   
        stage('run ansible pipeline') {
            steps {
                build job: 'BoostFlow-ansible'
            }
        }
        
        stage('copy .env.local to workspace') {
            steps {
                sh '''
                    cp ~/.env.local ~/workspace/BoostFlow-ansible/
                '''
            }
        }
        
        stage('test connection to deploy env') {
            steps {
                sh '''
                    ansible -i ~/workspace/BoostFlow-ansible/ansible/inventories/hosts.yaml -m ping vag-prod-vm
                '''
            }
        }
       
        stage('Auto Deploy Boostflow') {
            steps {
                sh '''
                    export ANSIBLE_CONFIG=~/workspace/BoostFlow-ansible/ansible/ansible.cfg
                    ansible-playbook -i ~/workspace/BoostFlow-ansible/ansible/inventories/hosts.yaml ~/workspace/BoostFlow-ansible/ansible/playbooks/deployments/deploy_nextjs_only.yaml
                '''
            }
        }
    }
}