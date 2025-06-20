pipeline {

    agent any

    stages {
    
        stage('run ansible pipeline') {
            steps {
                build job: 'ansible'
            }
        }

        stage('test connection to deploy env') {
        steps {
            sh '''
                ansible -i ~/workspace/ansible/ansible/inventories/hosts.yaml -m ping devops-vm
            '''
            }
        }
        
        stage('Install all') {
            steps {
                sh '''
                    export ANSIBLE_CONFIG=~/workspace/ansible/ansible/ansible.cfg
                    ansible-playbook -i ~/workspace/ansible/ansible/inventories/hosts.yaml -l ~/workspace/ansible/ansible/playbooks/deployments/deploy_all.yaml
                '''
            }
        }

}
}