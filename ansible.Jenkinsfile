pipeline {

    agent any

    parameters {
        booleanParam(name: 'INSTALL_ALL', defaultValue: true, description: 'Install ALL')
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
                ansible -i ~/workspace/ansible/ansible/inventories/hosts.yaml -m ping devops-vm
            '''
            }
        }
        
        stage('Install all') {
             when {
                expression { return params.INSTALL_ALL }
            }
            steps {
                sh '''
                    export ANSIBLE_CONFIG=~/workspace/ansible/ansible/ansible.cfg
                    ansible-playbook -i ~/workspace/ansible/ansible/inventories/hosts.yaml -l ~/workspace/ansible/ansible/playbooks/installations/install_all.yaml
                '''
            }
        }
    }
}