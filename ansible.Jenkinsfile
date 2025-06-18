pipeline {

    agent any

    parameters {
        booleanParam(name: 'INSTALL_POSTGRES', defaultValue: true, description: 'Install PostgreSQL')
        booleanParam(name: 'INSTALL_SPRING', defaultValue: true, description: 'Install Spring Boot app')
    }

    stages {
    
        stage('run ansible pipeline') {
            steps {
                build job: 'ansible'
            }
        }

        stage('test connection to deploy env') {
        steps {
            sh '''
                ansible -i ~/workspace/ansible/inventories/hosts.yaml -m ping devops-vm
            '''
            }
        }
        
        stage('Install postgres') {
             when {
                expression { return params.INSTALL_ALL }
            }
            steps {
                sh '''
                    export ANSIBLE_CONFIG=~/workspace/ansible/ansible.cfg
                    ansible-playbook -i ~/workspace/ansible/inventories/hosts.yaml -l devops-vm ~/workspace/ansible/playbooks/install_all.yaml
                '''
            }
        }
    }
}