pipeline {

    agent any

    parameters {
        booleanParam(name: 'run ansible pipeline', defaultValue: true, description: 'run ansible pipeline')
        booleanParam(name: 'test connection to deploy env', defaultValue: true, description: 'test connection to deploy env')
        booleanParam(name: 'deploy all', defaultValue: true, description: 'deploy all')
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
        
        stage('deploy all') {
            steps {
                sh '''
                    export ANSIBLE_CONFIG=~/workspace/ansible/ansible/ansible.cfg
                    ansible-playbook -i ~/workspace/ansible/ansible/inventories/hosts.yaml -l ~/workspace/ansible/ansible/playbooks/deployments/deploy_all.yaml
                '''
            }
        }

}
}